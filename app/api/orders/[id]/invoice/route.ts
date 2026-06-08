import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { connectDB } from "../../../../lib/mongodb";
import Order from "../../../../models/WholesaleOrder";
import {
  renderToBuffer,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  type DocumentProps,
} from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },

  // Header band
  headerBand: {
    backgroundColor: "#0a0f0a",
    paddingHorizontal: 48,
    paddingTop: 36,
    paddingBottom: 32,
    marginBottom: 0,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  logoMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.5,
    color: "#ffffff",
  },
  logoGreen: {
    color: "#22c55e",
  },
  invoiceBadge: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  invoiceBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
  },
  headerMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerMetaLeft: {
    gap: 3,
  },
  headerMetaLabel: {
    fontSize: 7,
    color: "#6b7280",
    letterSpacing: 1,
    fontFamily: "Helvetica",
    textTransform: "uppercase",
  },
  headerMetaValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  headerMetaSmall: {
    fontSize: 8,
    color: "#9ca3af",
    fontFamily: "Helvetica",
    marginTop: 1,
  },

  // Green accent bar
  accentBar: {
    height: 3,
    backgroundColor: "#22c55e",
    marginBottom: 0,
  },

  // Body
  body: {
    paddingHorizontal: 48,
    paddingTop: 36,
  },

  // Parties section
  partiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 36,
    gap: 32,
  },
  partyBlock: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#22c55e",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ede8",
    paddingBottom: 6,
  },
  partyName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 3,
  },
  partyDetail: {
    fontSize: 8.5,
    color: "#6b7280",
    lineHeight: 1.6,
  },

  // Info grid
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 36,
  },
  infoCell: {
    flex: 1,
    backgroundColor: "#f8faf8",
    borderWidth: 1,
    borderColor: "#e8ede8",
    borderRadius: 6,
    padding: 12,
  },
  infoCellLabel: {
    fontSize: 7,
    color: "#9ca3af",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoCellValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  infoCellSub: {
    fontSize: 7.5,
    color: "#6b7280",
    marginTop: 2,
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#22c55e",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  col_desc: { flex: 3 },
  col_sku: { flex: 1.5 },
  col_qty: { flex: 0.7, textAlign: "right" },
  col_unit: { flex: 1.3, textAlign: "right" },
  col_sub: { flex: 1.3, textAlign: "right" },
  cellText: {
    fontSize: 8.5,
    color: "#374151",
  },
  cellTextBold: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  cellTextMono: {
    fontSize: 8,
    color: "#6b7280",
    fontFamily: "Helvetica",
  },
  cellTextRight: {
    textAlign: "right",
  },

  // Totals
  totalsSection: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsBox: {
    width: 240,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  totalsLabel: {
    fontSize: 8.5,
    color: "#6b7280",
  },
  totalsValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  totalsFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 4,
    marginTop: 2,
  },
  totalsFinalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  totalsFinalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#22c55e",
    letterSpacing: -0.3,
  },

  // Shipping info
  shippingBox: {
    marginTop: 28,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shippingLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#22c55e",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  shippingValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  shippingMeta: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0a0f0a",
    paddingHorizontal: 48,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7.5,
    color: "#6b7280",
    fontFamily: "Helvetica",
  },
  footerBrand: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#22c55e",
    letterSpacing: 0.5,
  },
  footerRight: {
    alignItems: "flex-end",
    gap: 2,
  },

  // Notes
  notesBox: {
    marginTop: 20,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e8ede8",
    borderRadius: 6,
    padding: 12,
  },
  notesLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#9ca3af",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 8.5,
    color: "#6b7280",
    lineHeight: 1.5,
  },
});

function InvoicePDF({
  order,
  invoiceNumber,
  issuedDate,
}: {
  order: any;
  invoiceNumber: string;
  issuedDate: string;
}) {
  const statusColor =
    order.status === "shipped" || order.status === "delivered"
      ? "#22c55e"
      : order.status === "cancelled"
        ? "#ef4444"
        : "#f59e0b";

  const statusBadgeStyle = {
    backgroundColor: statusColor + "22",
    borderWidth: 1,
    borderColor: statusColor + "44",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  };

  const statusBadgeTextStyle = {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: statusColor,
    letterSpacing: 1,
  };

  const paymentMethodLabel =
    order.paymentMethod === "paystack"
      ? "Paystack"
      : order.paymentMethod === "bank_transfer"
        ? "Bank Transfer"
        : "Net Terms";

  const infoCells = [
    {
      label: "Order ID",
      value: `#${order._id.toString().slice(-8).toUpperCase()}`,
      sub: issuedDate,
    },
    {
      label: "DHL Tracking",
      value: order.dhl?.trackingNumber || "Pending",
      sub: order.dhl?.shipmentId || "",
    },
    {
      label: "Buyer tier",
      value: order.buyer?.buyerTier
        ? order.buyer.buyerTier.charAt(0).toUpperCase() +
          order.buyer.buyerTier.slice(1)
        : "Retailer",
      sub: "Wholesale account",
    },
    {
      label: "Payment status",
      value:
        order.paystack?.status === "success"
          ? "Paid"
          : order.paymentMethod === "bank_transfer"
            ? "Bank Transfer"
            : "Pending",
      sub: order.paystack?.paidAt
        ? new Date(order.paystack.paidAt).toLocaleDateString("en-GB")
        : "",
    },
  ];

  const totalsRows = [
    { label: "Subtotal", value: `NGN ${order.subtotal.toLocaleString()}` },
    {
      label: "Shipping",
      value: order.shipping
        ? `${order.shipping.currency} ${order.shipping.price.toLocaleString()}`
        : order.shippingFee
          ? `NGN ${order.shippingFee.toLocaleString()}`
          : "TBD",
    },
    {
      label: "Tax",
      value: order.tax ? `NGN ${order.tax.toLocaleString()}` : "—",
    },
  ];

  return React.createElement(
    Document,
    {
      title: `Invoice ${invoiceNumber} — OuterSkinX`,
      author: "OuterSkinX",
      subject: "Wholesale Invoice",
    },
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.headerBand },
        React.createElement(
          View,
          { style: styles.headerTop },
          React.createElement(
            View,
            { style: styles.logoMark },
            React.createElement(
              Text,
              { style: styles.logoText },
              React.createElement(Text, null, "Outer"),
              React.createElement(Text, { style: styles.logoGreen }, "Skin"),
              React.createElement(Text, null, "X"),
            ),
          ),
          React.createElement(
            View,
            { style: styles.invoiceBadge },
            React.createElement(
              Text,
              { style: styles.invoiceBadgeText },
              "INVOICE",
            ),
          ),
        ),
        React.createElement(
          View,
          { style: styles.headerMeta },
          React.createElement(
            View,
            { style: styles.headerMetaLeft },
            React.createElement(
              Text,
              { style: styles.headerMetaLabel },
              "Invoice number",
            ),
            React.createElement(
              Text,
              { style: styles.headerMetaValue },
              invoiceNumber,
            ),
            React.createElement(
              Text,
              { style: styles.headerMetaSmall },
              `Issued ${issuedDate}`,
            ),
          ),
          React.createElement(
            View,
            { style: { alignItems: "flex-end", gap: 3 } },
            React.createElement(
              View,
              { style: statusBadgeStyle },
              React.createElement(
                Text,
                { style: statusBadgeTextStyle },
                order.status.toUpperCase(),
              ),
            ),
            React.createElement(
              Text,
              { style: styles.headerMetaSmall },
              paymentMethodLabel,
            ),
          ),
        ),
      ),
      React.createElement(View, { style: styles.accentBar }),
      React.createElement(
        View,
        { style: styles.body },
        React.createElement(
          View,
          { style: styles.partiesRow },
          React.createElement(
            View,
            { style: styles.partyBlock },
            React.createElement(Text, { style: styles.partyLabel }, "From"),
            React.createElement(
              Text,
              { style: styles.partyName },
              "OuterSkinX",
            ),
            React.createElement(
              Text,
              { style: styles.partyDetail },
              "1 Commerce Road, Lagos\nNigeria · 100001\nhello@outerskinx.com\nwholesale.outerskinx.com",
            ),
          ),
          React.createElement(
            View,
            { style: styles.partyBlock },
            React.createElement(Text, { style: styles.partyLabel }, "Bill to"),
            React.createElement(
              Text,
              { style: styles.partyName },
              order.buyer?.businessName || "Customer",
            ),
            React.createElement(
              Text,
              { style: styles.partyDetail },
              order.buyer?.contactName,
              "\n",
              order.buyer?.email,
              "\n",
              order.buyer?.phone || "",
            ),
          ),
          React.createElement(
            View,
            { style: styles.partyBlock },
            React.createElement(Text, { style: styles.partyLabel }, "Ship to"),
            React.createElement(
              Text,
              { style: styles.partyName },
              order.deliveryAddress?.street,
            ),
            React.createElement(
              Text,
              { style: styles.partyDetail },
              order.deliveryAddress?.city,
              ", ",
              order.deliveryAddress?.state,
              "\n",
              order.deliveryAddress?.postalCode
                ? order.deliveryAddress.postalCode + "\n"
                : "",
              order.deliveryAddress?.country,
            ),
          ),
        ),
        React.createElement(
          View,
          { style: styles.infoGrid },
          infoCells.map((cell, i) =>
            React.createElement(
              View,
              { key: i, style: styles.infoCell },
              React.createElement(
                Text,
                { style: styles.infoCellLabel },
                cell.label,
              ),
              React.createElement(
                Text,
                { style: styles.infoCellValue },
                cell.value,
              ),
              cell.sub
                ? React.createElement(
                    Text,
                    { style: styles.infoCellSub },
                    cell.sub,
                  )
                : null,
            ),
          ),
        ),
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(
            Text,
            { style: [styles.tableHeaderText, styles.col_desc] },
            "Description",
          ),
          React.createElement(
            Text,
            { style: [styles.tableHeaderText, styles.col_sku] },
            "SKU",
          ),
          React.createElement(
            Text,
            {
              style: [
                styles.tableHeaderText,
                styles.col_qty,
                { textAlign: "right" },
              ],
            },
            "Qty",
          ),
          React.createElement(
            Text,
            {
              style: [
                styles.tableHeaderText,
                styles.col_unit,
                { textAlign: "right" },
              ],
            },
            "Unit price",
          ),
          React.createElement(
            Text,
            {
              style: [
                styles.tableHeaderText,
                styles.col_sub,
                { textAlign: "right" },
              ],
            },
            "Subtotal",
          ),
        ),
        order.items.map((item: any, i: number) =>
          React.createElement(
            View,
            {
              key: i,
              style: [styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}],
            },
            React.createElement(
              View,
              { style: styles.col_desc },
              React.createElement(
                Text,
                { style: styles.cellTextBold },
                item.name,
              ),
            ),
            React.createElement(
              Text,
              { style: [styles.cellTextMono, styles.col_sku] },
              item.sku,
            ),
            React.createElement(
              Text,
              {
                style: [styles.cellText, styles.col_qty, styles.cellTextRight],
              },
              item.qty,
            ),
            React.createElement(
              Text,
              {
                style: [styles.cellText, styles.col_unit, styles.cellTextRight],
              },
              "NGN " + item.unitPrice.toLocaleString(),
            ),
            React.createElement(
              Text,
              {
                style: [
                  styles.cellTextBold,
                  styles.col_sub,
                  styles.cellTextRight,
                ],
              },
              "NGN " + item.subtotal.toLocaleString(),
            ),
          ),
        ),
        React.createElement(
          View,
          { style: styles.totalsSection },
          React.createElement(
            View,
            { style: styles.totalsBox },
            totalsRows.map(({ label, value }) =>
              React.createElement(
                View,
                { key: label, style: styles.totalsRow },
                React.createElement(Text, { style: styles.totalsLabel }, label),
                React.createElement(Text, { style: styles.totalsValue }, value),
              ),
            ),
            React.createElement(
              View,
              { style: styles.totalsFinalRow },
              React.createElement(
                Text,
                { style: styles.totalsFinalLabel },
                "Total",
              ),
              React.createElement(
                Text,
                { style: styles.totalsFinalValue },
                `NGN ${order.total.toLocaleString()}`,
              ),
            ),
          ),
        ),
        order.dhl?.trackingNumber &&
          React.createElement(
            View,
            { style: styles.shippingBox },
            React.createElement(
              View,
              null,
              React.createElement(
                Text,
                { style: styles.shippingLabel },
                "DHL Shipment",
              ),
              React.createElement(
                Text,
                { style: styles.shippingValue },
                order.dhl.trackingNumber,
              ),
              order.shipping?.productName &&
                React.createElement(
                  Text,
                  { style: styles.shippingMeta },
                  order.shipping.productName,
                ),
            ),
            order.dhl.estimatedDelivery &&
              React.createElement(
                View,
                { style: { alignItems: "flex-end" } },
                React.createElement(
                  Text,
                  { style: styles.shippingLabel },
                  "Est. delivery",
                ),
                React.createElement(
                  Text,
                  { style: styles.shippingValue },
                  new Date(order.dhl.estimatedDelivery).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  ),
                ),
              ),
          ),
        order.notes &&
          React.createElement(
            View,
            { style: styles.notesBox },
            React.createElement(
              Text,
              { style: styles.notesLabel },
              "Order notes",
            ),
            React.createElement(Text, { style: styles.notesText }, order.notes),
          ),
        order.poNumber &&
          React.createElement(
            View,
            { style: [styles.notesBox, { marginTop: 8 }] },
            React.createElement(
              Text,
              { style: styles.notesLabel },
              "PO number",
            ),
            React.createElement(
              Text,
              { style: styles.notesText },
              order.poNumber,
            ),
          ),
      ),
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(
          View,
          null,
          React.createElement(
            Text,
            { style: styles.footerBrand },
            "OuterSkinX Wholesale",
          ),
          React.createElement(
            Text,
            { style: styles.footerText },
            "hello@outerskinx.com · wholesale.outerskinx.com",
          ),
        ),
        React.createElement(
          View,
          { style: styles.footerRight },
          React.createElement(
            Text,
            { style: styles.footerText },
            invoiceNumber,
          ),
          React.createElement(
            Text,
            { style: [styles.footerText, { color: "#4b5563" }] },
            "Page ",
            React.createElement(Text, {
              render: ({ pageNumber, totalPages }: any) =>
                `${pageNumber} of ${totalPages}`,
            }),
          ),
        ),
      ),
    ),
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const order = await Order.findById(id)
      .populate("buyer", "businessName contactName email phone buyerTier")
      .lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow buyer who owns it, or admin
    if (
      session.role !== "admin" &&
      order.buyer?._id?.toString() !== session.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invoiceNumber = `INV-${order._id.toString().slice(-8).toUpperCase()}`;
    const issuedDate = new Date(order.createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const buffer = await renderToBuffer(
      React.createElement(InvoicePDF, {
        order,
        invoiceNumber,
        issuedDate,
      }) as unknown as React.ReactElement<DocumentProps>,
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoiceNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 },
    );
  }
}
