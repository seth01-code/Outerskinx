/**
 * /api/shipping/pickup
 *
 * POST  – create a DHL pickup request for an already-shipped order
 *         Returns { cbjNumber, dispatchConfirmationNumber }
 *
 * DELETE – cancel an existing DHL pickup
 *          Body: { cbjNumber, requestorName?, reason? }
 */

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

// ─── POST: Create pickup ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await req.json();
    if (!orderId)
      return NextResponse.json({ error: "orderId required" }, { status: 400 });

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (!order.dhl?.trackingNumber) {
      return NextResponse.json(
        { error: "Shipment must be created before requesting pickup" },
        { status: 400 },
      );
    }

    if (order.dhl?.pickupConfirmationNumber) {
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

    const totalWeightKg = Math.max(
      0.5,
      order.items.reduce(
        (sum: number, i: { qty: number; weightG?: number }) =>
          sum + ((i.weightG || 500) * i.qty) / 1000,
        0,
      ),
    );

    // Pickup date: next business day, 10:00 WAT
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const plannedPickupDateAndTime = `${tomorrow.toISOString().split("T")[0]}T10:00:00 GMT+01:00`;

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
        // receiverDetails mirrors shipper for pickup requests (required by DHL)
        receiverDetails: {
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
            declaredValueCurrency: "NGN",
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

    console.log("DHL pickup request:", JSON.stringify(pickupBody, null, 2));

    const res = await fetch(`${DHL_BASE}/pickups`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${getCredentials()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pickupBody),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("DHL pickup error:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        {
          error: data?.detail || data?.message || "DHL pickup creation failed",
          dhlError: data,
        },
        { status: 502 },
      );
    }

    // DHL returns dispatchConfirmationNumber — this is the CBJ number
    // e.g. "CBJ251027000281"
    const cbjNumber: string = data.dispatchConfirmationNumber;

    await Order.findByIdAndUpdate(orderId, {
      $set: {
        "dhl.pickupConfirmationNumber": cbjNumber,
        "dhl.pickupCreatedAt": new Date(),
      },
    });

    return NextResponse.json({
      cbjNumber,
      dispatchConfirmationNumber: cbjNumber,
    });
  } catch (error) {
    console.error("Pickup creation error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

// ─── DELETE: Cancel pickup ────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cbjNumber, orderId, requestorName = "OuterSkinX Operations", reason = "No longer required" } =
      await req.json();

    if (!cbjNumber)
      return NextResponse.json(
        { error: "cbjNumber required" },
        { status: 400 },
      );

    const params = new URLSearchParams({ requestorName, reason });
    const res = await fetch(`${DHL_BASE}/pickups/${cbjNumber}?${params}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${getCredentials()}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.detail || data?.message || "Pickup cancellation failed", dhlError: data },
        { status: 502 },
      );
    }

    // Clear the pickup number from the order if orderId provided
    if (orderId) {
      await connectDB();
      await Order.findByIdAndUpdate(orderId, {
        $unset: {
          "dhl.pickupConfirmationNumber": "",
          "dhl.pickupCreatedAt": "",
        },
      });
    }

    return NextResponse.json({ success: true, cbjNumber });
  } catch (error) {
    console.error("Pickup cancellation error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}