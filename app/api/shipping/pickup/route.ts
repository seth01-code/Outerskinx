import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import Order from "../../../models/WholesaleOrder";
import { getSession } from "../../../lib/auth";

const DHL_BASE = "https://express.api.dhl.com/mydhlapi/test";

function getCredentials() {
  return Buffer.from(
    `${process.env.DHL_API_KEY}:${process.env.DHL_API_SECRET}`,
  ).toString("base64");
}

// ─── Structured logger ────────────────────────────────────────────────────────
function log(level: "INFO" | "WARN" | "ERROR", tag: string, data: object) {
  const entry = JSON.stringify({ ts: new Date().toISOString(), level, tag, ...data });
  if (level === "ERROR") console.error(entry);
  else console.log(entry);
}

// ─── POST: Create pickup ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await req.json();
    log("INFO", "pickup/create:start", { orderId });

    if (!orderId)
      return NextResponse.json({ error: "orderId required" }, { status: 400 });

    // ── Connect and fetch order ──
    await connectDB();
    const order = await Order.findById(orderId);

    if (!order) {
      log("WARN", "pickup/create:not_found", { orderId });
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.dhl?.trackingNumber) {
      log("WARN", "pickup/create:no_tracking", { orderId });
      return NextResponse.json(
        { error: "Shipment must be created before requesting pickup" },
        { status: 400 },
      );
    }

    if (order.dhl?.pickupConfirmationNumber) {
      log("WARN", "pickup/create:already_exists", {
        orderId,
        cbjNumber: order.dhl.pickupConfirmationNumber,
      });
      return NextResponse.json(
        {
          error: "Pickup already requested",
          cbjNumber: order.dhl.pickupConfirmationNumber,
        },
        { status: 409 },
      );
    }

    const receiverCountryRaw = order.deliveryAddress?.country || "NG";
    const countryMap: Record<string, string> = {
      nigeria: "NG", ghana: "GH", kenya: "KE", "south africa": "ZA",
      "united kingdom": "GB", uk: "GB", "united states": "US", usa: "US",
      canada: "CA", france: "FR", germany: "DE", uae: "AE",
      "united arab emirates": "AE",
    };
    const receiverCountry =
      countryMap[receiverCountryRaw.toLowerCase()] ||
      receiverCountryRaw.toUpperCase().slice(0, 2) ||
      "NG";

    const intl = receiverCountry !== "NG";
    const productCode = intl ? "P" : "N";
    const accountNumber = process.env.DHL_ACCOUNT_NUMBER_EXP;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const plannedPickupDateAndTime = `${tomorrow.toISOString().split("T")[0]}T10:00:00`;

    const totalWeightKg = Math.max(
      0.5,
      order.items.reduce(
        (sum: number, i: { qty: number; weightG?: number }) =>
          sum + ((i.weightG || 500) * i.qty) / 1000,
        0,
      ),
    );

    const receiverAddress = order.deliveryAddress;
    const receiverContact = order.buyer;

    const currencyMap: Record<string, string> = {
      US: "USD", GB: "GBP", DE: "EUR", FR: "EUR", CA: "CAD",
      GH: "GHS", KE: "KES", ZA: "ZAR", AE: "AED", NG: "NGN",
    };
    const declaredCurrency = currencyMap[receiverCountry] || "USD";

    const pickupBody = {
      plannedPickupDateAndTime,
      closeTime: "17:00",
      location: "reception",
      locationType: "business",
      accounts: [{ number: accountNumber, typeCode: "shipper" }],
      specialInstructions: [
        { value: "Handle with care", typeCode: "TBD" },
      ],
      customerDetails: {
        shipperDetails: {
          postalAddress: {
            addressLine1: "OuterSkinX Warehouse, 1 Commerce Road",
            postalCode: "100001",
            cityName: "Lagos",
            countyName: "Lagos",
            countryCode: "NG",
          },
          contactInformation: {
            fullName: "OuterSkinX Operations",
            companyName: "OuterSkinX",
            email: "operations@outerskinx.com",
            phone: "+2348012345678",
          },
        },
        receiverDetails: {
          postalAddress: {
            addressLine1: receiverAddress?.street || receiverAddress?.addressLine1 || "N/A",
            postalCode: receiverAddress?.postalCode || "N/A",
            cityName: receiverAddress?.city || "N/A",
            countyName: receiverAddress?.state || receiverAddress?.city || "N/A",
            countryCode: receiverCountry,
          },
          contactInformation: {
            fullName: receiverContact?.businessName || receiverContact?.fullName || "N/A",
            companyName: receiverContact?.businessName || "N/A",
            email: receiverContact?.email || "N/A",
            phone: receiverContact?.phone || "+2340000000000",
          },
        },
      },
      shipmentDetails: [
        {
          productCode,
          isCustomsDeclarable: intl,
          ...(intl && {
            declaredValue: Math.max(
              1,
              order.items.reduce(
                (s: number, i: { qty: number; unitPrice: number }) =>
                  s + i.unitPrice * i.qty,
                0,
              ),
            ),
            declaredValueCurrency: declaredCurrency,
          }),
          unitOfMeasurement: "metric",
          packages: [
            {
              weight: totalWeightKg,
              dimensions: { length: 30, width: 30, height: 30 },
            },
          ],
        },
      ],
    };

    log("INFO", "pickup/create:request", {
      orderId,
      trackingNumber: order.dhl.trackingNumber,
      productCode,
      intl,
      receiverCountry,
      declaredCurrency,
      plannedPickupDateAndTime,
      totalWeightKg,
      payload: pickupBody,
    });

    const res = await fetch(`${DHL_BASE}/pickups`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${getCredentials()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pickupBody),
    });

    const data = await res.json();

    log(res.ok ? "INFO" : "ERROR", "pickup/create:dhl_response", {
      orderId,
      status: res.status,
      ok: res.ok,
      response: data,
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data?.detail || data?.message || "DHL pickup creation failed",
          dhlError: data,
        },
        { status: 502 },
      );
    }

    const cbjNumber: string =
      data.dispatchConfirmationNumber ||
      data.dispatchConfirmationNumbers?.[0];

    if (!cbjNumber) {
      log("ERROR", "pickup/create:no_cbj", { orderId, response: data });
      return NextResponse.json(
        { error: "DHL did not return a confirmation number", dhlResponse: data },
        { status: 502 },
      );
    }

    // ── Re-connect before DB write (connection may have timed out during DHL call) ──
    await connectDB();

    const updated = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          "dhl.pickupConfirmationNumber": cbjNumber,
          "dhl.pickupCreatedAt": new Date(),
        },
      },
      { new: true },
    );

    if (!updated) {
      log("ERROR", "pickup/create:db_update_failed", {
        orderId,
        cbjNumber,
        reason: "findByIdAndUpdate returned null — order may not exist or ID mismatch",
      });
      // Still return the CBJ number to the client so the admin can note it,
      // but flag that the DB save failed.
      return NextResponse.json(
        {
          cbjNumber,
          dispatchConfirmationNumber: cbjNumber,
          warning: "Pickup confirmed by DHL but failed to save to database. Please record CBJ number manually.",
        },
        { status: 207 },
      );
    }

    log("INFO", "pickup/create:db_saved", {
      orderId,
      cbjNumber,
      savedValue: updated.dhl?.pickupConfirmationNumber,
    });

    log("INFO", "pickup/create:success", { orderId, cbjNumber });

    return NextResponse.json({
      cbjNumber,
      dispatchConfirmationNumber: cbjNumber,
    });
  } catch (error) {
    log("ERROR", "pickup/create:exception", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// ─── DELETE: Cancel pickup ────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      cbjNumber,
      orderId,
      requestorName = "OuterSkinX Operations",
      reason = "No longer required",
    } = await req.json();

    log("INFO", "pickup/cancel:start", { cbjNumber, orderId, requestorName, reason });

    if (!cbjNumber)
      return NextResponse.json({ error: "cbjNumber required" }, { status: 400 });

    const params = new URLSearchParams({ requestorName, reason });
    const res = await fetch(`${DHL_BASE}/pickups/${cbjNumber}?${params}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${getCredentials()}`,
      },
    });

    const responseText = await res.text();
    let data: object = {};
    try { data = JSON.parse(responseText); } catch { data = { raw: responseText }; }

    log(res.ok ? "INFO" : "ERROR", "pickup/cancel:dhl_response", {
      cbjNumber,
      status: res.status,
      ok: res.ok,
      response: data,
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          error: (data as any)?.detail || (data as any)?.message || "Pickup cancellation failed",
          dhlError: data,
        },
        { status: 502 },
      );
    }

    if (orderId) {
      await connectDB();
      const cleared = await Order.findByIdAndUpdate(
        orderId,
        {
          $unset: {
            "dhl.pickupConfirmationNumber": "",
            "dhl.pickupCreatedAt": "",
          },
        },
        { new: true },
      );

      if (!cleared) {
        log("WARN", "pickup/cancel:db_clear_failed", {
          orderId,
          cbjNumber,
          reason: "findByIdAndUpdate returned null",
        });
      } else {
        log("INFO", "pickup/cancel:db_cleared", { orderId, cbjNumber });
      }
    }

    return NextResponse.json({ success: true, cbjNumber });
  } catch (error) {
    log("ERROR", "pickup/cancel:exception", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
