import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import Order from "../../../models/WholesaleOrder";
import { getSession } from "../../../lib/auth";

const DHL_BASE = "https://express.api.dhl.com/mydhlapi/test";

function getCountryCode(country: string): string {
  const map: Record<string, string> = {
    nigeria: "NG",
    ghana: "GH",
    kenya: "KE",
    "south africa": "ZA",
    "united kingdom": "GB",
    uk: "GB",
    "united states": "US",
    usa: "US",
    canada: "CA",
    france: "FR",
    germany: "DE",
    uae: "AE",
    "united arab emirates": "AE",
  };
  return (
    map[country?.toLowerCase()] || country?.toUpperCase().slice(0, 2) || "NG"
  );
}

function getCredentials() {
  return Buffer.from(
    `${process.env.DHL_API_KEY}:${process.env.DHL_API_SECRET}`,
  ).toString("base64");
}

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

    const order = await Order.findById(orderId).populate(
      "buyer",
      "contactName businessName email phone",
    );

    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const receiverCountry = getCountryCode(order.deliveryAddress.country);
    const intl = receiverCountry !== "NG";
    const productCode = intl ? "P" : "N";
    // EXP account covers all outbound shipments from NG (both domestic and international)
    const accountNumber = process.env.DHL_ACCOUNT_NUMBER_EXP;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const plannedShippingDateAndTime = `${tomorrow.toISOString().split("T")[0]}T10:00:00 GMT+01:00`;

    const totalWeightKg = Math.max(
      0.5,
      order.items.reduce(
        (sum: number, i: { qty: number; weightG?: number }) =>
          sum + ((i.weightG || 500) * i.qty) / 1000,
        0,
      ),
    );

    const imageOptions = [
      { templateName: "ECOM26_84_A4_001", typeCode: "label" },
      {
        templateName: "ARCH_8X4_A4_002",
        isRequested: true,
        hideAccountNumber: true,
        typeCode: "waybillDoc",
      },
      ...(intl
        ? [
            {
              templateName: "COMMERCIAL_INVOICE_P_10",
              invoiceType: "commercial",
              languageCode: "eng",
              isRequested: true,
              typeCode: "invoice",
            },
          ]
        : []),
    ];

    const lineItemsTotal = order.items.reduce(
      (sum: number, i: { qty: number; unitPrice: number }) =>
        sum + i.unitPrice * i.qty,
      0,
    );
    const declaredValue = Math.max(1, Math.round(lineItemsTotal * 100) / 100);

    const destinationCity = order.deliveryAddress.city;

    const content: Record<string, unknown> = {
      packages: [
        {
          weight: totalWeightKg,
          dimensions: { length: 30, width: 30, height: 30 },
        },
      ],
      unitOfMeasurement: "metric",
      isCustomsDeclarable: intl,
      description: order.items
        .map((i: { name: string }) => i.name)
        .join(", ")
        .slice(0, 70),
      incoterm: "DAP",
      declaredValue,
      declaredValueCurrency: "NGN",
    };

    if (intl) {
      const shippingPrice = order.shipping?.price || 0;
      const additionalCharges =
        shippingPrice >= 0.001
          ? [{ value: shippingPrice, typeCode: "freight" }]
          : [];

      content.exportDeclaration = {
        exportReason: "Permanent",
        exportReasonType: "permanent",
        shipmentType: "commercial",
        placeOfIncoterm: destinationCity,
        invoice: {
          number: `INV-${order._id.toString().slice(-8).toUpperCase()}`,
          date: new Date().toISOString().split("T")[0],
        },
        ...(additionalCharges.length > 0 && { additionalCharges }),
        lineItems: order.items.map(
          (
            item: {
              name: string;
              qty: number;
              unitPrice: number;
              weightG?: number;
              hsCode?: string;
              customsDescription?: string;
            },
            idx: number,
          ) => ({
            number: idx + 1,
            quantity: { unitOfMeasurement: "PCS", value: item.qty },
            price: item.unitPrice,
            // Use product-specific customs description and HS code if set on the product
            description: (item.customsDescription || item.name).slice(0, 255),
            weight: {
              netValue: Math.max(
                0.1,
                ((item.weightG || 500) * item.qty) / 1000,
              ),
              grossValue: Math.max(
                0.1,
                ((item.weightG || 500) * item.qty) / 1000,
              ),
            },
            commodityCodes: [
              { typeCode: "inbound", value: item.hsCode || "33049900" },
              { typeCode: "outbound", value: item.hsCode || "33049900" },
            ],
            exportReasonType: "permanent",
            manufacturerCountry: "NG",
          }),
        ),
      };
    }

    const requestBody = {
      plannedShippingDateAndTime,
      productCode,
      // pickup.isRequested is ALWAYS false here — pickup is a separate API call via /api/shipping/pickup
      pickup: { isRequested: false },
      outputImageProperties: {
        allDocumentsInOneImage: true,
        encodingFormat: "pdf",
        imageOptions,
      },
      accounts: [{ number: accountNumber, typeCode: "shipper" }],
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
          typeCode: "business",
        },
        receiverDetails: {
          postalAddress: {
            addressLine1: order.deliveryAddress.street.slice(0, 45),
            postalCode: order.deliveryAddress.postalCode || "000000",
            cityName: order.deliveryAddress.city,
            countyName:
              order.deliveryAddress.state || order.deliveryAddress.city,
            countryCode: receiverCountry,
          },
          contactInformation: {
            fullName: order.buyer?.contactName || "Customer",
            companyName: order.buyer?.businessName || "Customer",
            email: order.buyer?.email || "customer@example.com",
            phone: order.buyer?.phone || "+2348000000000",
          },
          typeCode: "business",
        },
      },
      content,
    };

    console.log("DHL shipment request:", JSON.stringify(requestBody, null, 2));

    const res = await fetch(`${DHL_BASE}/shipments`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${getCredentials()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("DHL shipment error:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        {
          error:
            data?.detail || data?.message || "DHL shipment creation failed",
          dhlError: data,
        },
        { status: 502 },
      );
    }

    const trackingNumber = data.shipmentTrackingNumber;
    const shipmentId = data.shipmentId || trackingNumber;
    const labelContent = data.documents?.[0]?.content;
    const labelUrl = labelContent
      ? `data:application/pdf;base64,${labelContent}`
      : null;

    await Order.findByIdAndUpdate(orderId, {
      $set: {
        status: "shipped",
        "dhl.trackingNumber": trackingNumber,
        "dhl.shipmentId": shipmentId,
        "dhl.labelUrl": labelUrl,
        "dhl.createdAt": new Date(),
      },
    });

    return NextResponse.json({
      trackingNumber,
      shipmentId,
      labelUrl,
    });
  } catch (error) {
    console.error("Shipment error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}