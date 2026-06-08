"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";

interface OrderItem {
  product: { _id: string; name: string; sku: string; images: string[] };
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  status: string;
  paymentMethod: string;
  poNumber?: string;
  notes?: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
  };
  paystack?: { reference?: string; status?: string; paidAt?: string };
  dhl?: {
    trackingNumber?: string;
    shipmentId?: string;
    estimatedDelivery?: string;
    labelUrl?: string;
  };

  shipping?: {
    productCode: string;
    productName: string;
    price: number;
    currency: string;
    estimatedDelivery?: string;
  };

  buyer: { businessName: string; contactName: string; email: string };
  createdAt: string;
}

const STATUS_STYLES: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  pending: { color: "#facc15", bg: "rgba(250,204,21,0.08)", label: "Pending" },
  confirmed: {
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    label: "Confirmed",
  },
  processing: {
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    label: "Processing",
  },
  shipped: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", label: "Shipped" },
  delivered: {
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    label: "Delivered",
  },
  cancelled: {
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    label: "Cancelled",
  },
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [payingNow, setPayingNow] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) setOrder(d.order);
        setLoading(false);
      });
  }, [id]);

  async function handlePayNow() {
    if (!order) return;
    setPayingNow(true);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order._id }),
      });
      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch {
      setPayingNow(false);
    }
  }

  function handleReorder() {
    if (!order) return;
    setReordering(true);
    const cart = order.items.map((item) => ({
      _id: item.product?._id || item.sku,
      sku: item.sku,
      name: item.name,
      image: item.product?.images?.[0] || "",
      retailPrice: item.unitPrice,
      wholesalePricing: [],
      qty: item.qty,
    }));
    localStorage.setItem("osx_cart", JSON.stringify(cart));
    window.location.href = "/cart";
  }

  if (loading) {
    return (
      <div
        className="min-h-screen px-5 md:px-8 py-12"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="skeleton h-10 w-48 rounded-xl" />
          <div className="skeleton h-32 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-5"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center space-y-4">
          <p
            className="text-5xl"
            style={{
              fontFamily: "var(--font-syne)",
              fontWeight: 800,
              color: "var(--foreground-subtle)",
            }}
          >
            404
          </p>
          <p style={{ color: "var(--foreground-muted)", fontWeight: 300 }}>
            Order not found.
          </p>
          <Link href="/orders" className="btn-ghost">
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const s = STATUS_STYLES[order.status] || STATUS_STYLES.pending;

  return (
    <div
      className="min-h-screen px-5 md:px-8 py-12 animate-fadeUp"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="breadcrumb mb-8">
          <Link href="/orders">Orders</Link>
          <span className="sep">/</span>
          <span className="current">#{order._id.slice(-8).toUpperCase()}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1
                className="text-3xl"
                style={{
                  fontFamily: "var(--font-syne)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                }}
              >
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <span
                className="badge"
                style={{ background: s.bg, color: s.color }}
              >
                {s.label}
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "0.72rem",
                color: "var(--foreground-subtle)",
              }}
            >
              Placed{" "}
              {new Date(order.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {order.status === "pending" &&
              order.paymentMethod === "paystack" && (
                <button
                  onClick={handlePayNow}
                  disabled={payingNow}
                  className="btn-primary"
                >
                  {payingNow ? "Redirecting..." : "Pay now"}
                  {!payingNow && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </button>
              )}
            <button
              onClick={handleReorder}
              disabled={reordering}
              className="btn-ghost"
            >
              {reordering ? "Adding..." : "Repeat order"}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Items */}
          <div className="md:col-span-2 space-y-4">
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <div
                className="px-5 py-3.5 flex items-center justify-between"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: "var(--surface)",
                }}
              >
                <p className="section-label">Items · {order.items.length}</p>
              </div>
              <div
                className="divide-y"
                style={{ borderColor: "var(--border)" }}
              >
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-4"
                    style={{ background: "var(--surface)" }}
                  >
                    <div
                      className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0"
                      style={{
                        background: "var(--surface-raised)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {item.product?.images?.[0] && (
                        <Image
                          src={item.product.images[0]}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm line-clamp-1 mb-0.5"
                        style={{ color: "var(--foreground)", fontWeight: 400 }}
                      >
                        {item.name}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-dm-mono)",
                          fontSize: "0.68rem",
                          color: "var(--foreground-subtle)",
                        }}
                      >
                        {item.sku} · {item.qty} × ₦
                        {item.unitPrice.toLocaleString()}
                      </p>
                    </div>
                    <p
                      className="shrink-0"
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        fontSize: "0.875rem",
                        color: "var(--brand-green)",
                        fontWeight: 500,
                      }}
                    >
                      ₦{item.subtotal.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* DHL tracking */}
            {order.dhl?.trackingNumber && (
              <div
                className="p-5 rounded-xl"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-accent)",
                }}
              >
                <p className="section-label mb-3">Shipment tracking</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span
                      style={{
                        color: "var(--foreground-subtle)",
                        fontFamily: "var(--font-dm-mono)",
                        fontSize: "0.75rem",
                      }}
                    >
                      Tracking number
                    </span>
                    <span
                      style={{
                        color: "var(--brand-green)",
                        fontFamily: "var(--font-dm-mono)",
                        fontSize: "0.75rem",
                      }}
                    >
                      {order.dhl.trackingNumber}
                    </span>
                  </div>
                  {order.dhl.estimatedDelivery && (
                    <div className="flex justify-between text-sm">
                      <span
                        style={{
                          color: "var(--foreground-subtle)",
                          fontFamily: "var(--font-dm-mono)",
                          fontSize: "0.75rem",
                        }}
                      >
                        Est. delivery
                      </span>
                      <span
                        style={{
                          color: "var(--foreground-muted)",
                          fontFamily: "var(--font-dm-mono)",
                          fontSize: "0.75rem",
                        }}
                      >
                        {new Date(
                          order.dhl.estimatedDelivery,
                        ).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  <a
                    href={`/api/orders/${order._id}/invoice`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost w-full justify-center mt-3 text-xs"
                    style={{ padding: "8px 16px" }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Download invoice
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div className="space-y-4">
            {/* Totals */}
            <div
              className="p-5 rounded-xl"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="section-label mb-4">Order summary</p>
              <div className="space-y-2.5">
                {[
                  {
                    label: "Subtotal",
                    value: `₦${order.subtotal.toLocaleString()}`,
                  },
                  {
                    label: "Shipping",
                    value: order.shipping
                      ? `${order.shipping.currency} ${order.shipping.price.toLocaleString()}`
                      : order.shippingFee
                        ? `₦${order.shippingFee.toLocaleString()}`
                        : "TBD",
                  },
                  {
                    label: "Tax",
                    value: order.tax ? `₦${order.tax.toLocaleString()}` : "—",
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span
                      style={{
                        color: "var(--foreground-muted)",
                        fontWeight: 300,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        color: "var(--foreground)",
                        fontFamily: "var(--font-dm-mono)",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
                <div
                  className="flex justify-between pt-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <span
                    style={{ fontFamily: "var(--font-syne)", fontWeight: 700 }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-syne)",
                      fontWeight: 800,
                      fontSize: "1.2rem",
                      color: "var(--brand-green)",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    ₦{order.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery address */}
            <div
              className="p-5 rounded-xl"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="section-label mb-3">Delivery address</p>
              <address
                className="not-italic text-sm space-y-0.5"
                style={{
                  color: "var(--foreground-muted)",
                  fontWeight: 300,
                  lineHeight: 1.7,
                }}
              >
                <p>{order.deliveryAddress.street}</p>
                <p>
                  {order.deliveryAddress.city}, {order.deliveryAddress.state}
                </p>
                {order.deliveryAddress.postalCode && (
                  <p>{order.deliveryAddress.postalCode}</p>
                )}
                <p>{order.deliveryAddress.country}</p>
              </address>
            </div>

            {/* Payment */}
            <div
              className="p-5 rounded-xl"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="section-label mb-3">Payment</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span
                    style={{
                      color: "var(--foreground-muted)",
                      fontWeight: 300,
                    }}
                  >
                    Method
                  </span>
                  <span
                    style={{
                      color: "var(--foreground)",
                      fontFamily: "var(--font-dm-mono)",
                      fontSize: "0.75rem",
                    }}
                  >
                    {order.paymentMethod === "paystack"
                      ? "Paystack"
                      : order.paymentMethod === "bank_transfer"
                        ? "Bank Transfer"
                        : "Net Terms"}
                  </span>
                </div>
                {order.paystack?.reference && (
                  <div className="flex justify-between text-sm">
                    <span
                      style={{
                        color: "var(--foreground-muted)",
                        fontWeight: 300,
                      }}
                    >
                      Reference
                    </span>
                    <span
                      style={{
                        color: "var(--foreground-subtle)",
                        fontFamily: "var(--font-dm-mono)",
                        fontSize: "0.7rem",
                      }}
                    >
                      {order.paystack.reference}
                    </span>
                  </div>
                )}
                {order.poNumber && (
                  <div className="flex justify-between text-sm">
                    <span
                      style={{
                        color: "var(--foreground-muted)",
                        fontWeight: 300,
                      }}
                    >
                      PO number
                    </span>
                    <span
                      style={{
                        color: "var(--foreground-subtle)",
                        fontFamily: "var(--font-dm-mono)",
                        fontSize: "0.75rem",
                      }}
                    >
                      {order.poNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div
                className="p-5 rounded-xl"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <p className="section-label mb-2">Notes</p>
                <p
                  className="text-sm"
                  style={{
                    color: "var(--foreground-muted)",
                    fontWeight: 300,
                    lineHeight: 1.7,
                  }}
                >
                  {order.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
