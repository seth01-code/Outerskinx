import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL as string;
const BASE = process.env.NEXT_PUBLIC_BASE_URL as string;

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#ffffff;border-radius:16px 16px 0 0;padding:28px 36px 24px;border-bottom:1px solid #e8ede8;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:18px;font-weight:800;letter-spacing:-0.04em;color:#1a1a1a;">Outer</span><span style="font-size:18px;font-weight:800;letter-spacing:-0.04em;color:#22c55e;">Skin</span><span style="font-size:18px;font-weight:800;letter-spacing:-0.04em;color:#1a1a1a;">X</span>
                </td>
                <td align="right">
                  <span style="font-size:10px;font-family:monospace;letter-spacing:0.1em;color:#22c55e;background:#f0fdf4;border:1px solid #bbf7d0;padding:4px 10px;border-radius:20px;">WHOLESALE PLATFORM</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8faf8;border-radius:0 0 16px 16px;padding:20px 36px;border-top:1px solid #e8ede8;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-family:monospace;letter-spacing:0.06em;">OUTERSKINX WHOLESALE</p>
                  <p style="margin:0;font-size:11px;color:#9ca3af;">Questions? <a href="mailto:hello@outerskinx.com" style="color:#22c55e;text-decoration:none;">hello@outerskinx.com</a></p>
                </td>
                <td align="right">
                  <p style="margin:0;font-size:10px;color:#d1d5db;font-family:monospace;">wholesale.outerskinx.com</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`

const statCell = (label: string, value: string) => `
  <td align="center" style="padding:16px;background:#f8faf8;border-radius:10px;border:1px solid #e8ede8;">
    <p style="margin:0 0 4px;font-size:10px;font-family:monospace;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;">${label}</p>
    <p style="margin:0;font-size:18px;font-weight:700;color:#1a1a1a;letter-spacing:-0.02em;">${value}</p>
  </td>
`

const ctaButton = (href: string, label: string) => `
  <a href="${href}" style="display:inline-block;background:#22c55e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:10px;letter-spacing:-0.01em;">
    ${label} &rarr;
  </a>
`

const divider = `<hr style="border:none;border-top:1px solid #e8ede8;margin:28px 0;" />`

const badge = (text: string, color = "#22c55e", bg = "#f0fdf4", border = "#bbf7d0") => `
  <span style="display:inline-block;font-size:10px;font-family:monospace;letter-spacing:0.1em;color:${color};background:${bg};border:1px solid ${border};padding:4px 10px;border-radius:20px;text-transform:uppercase;">${text}</span>
`

export async function sendWelcomeEmail(buyer: {
  email: string;
  contactName: string;
  businessName: string;
  buyerTier: string;
}) {
  const tierColors: Record<string, [string, string, string]> = {
    retailer:    ["#3b82f6", "#eff6ff", "#bfdbfe"],
    distributor: ["#f59e0b", "#fffbeb", "#fde68a"],
    premium:     ["#22c55e", "#f0fdf4", "#bbf7d0"],
  }
  const [tc, tbg, tb] = tierColors[buyer.buyerTier] ?? tierColors.retailer

  const content = `
    <!-- Hero -->
    <div style="text-align:center;padding:8px 0 32px;">
      <div style="width:56px;height:56px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <span style="font-size:24px;">✓</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;letter-spacing:-0.04em;color:#1a1a1a;">You're approved.</h1>
      <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.6;">
        Hi ${buyer.contactName}, your wholesale account for <strong style="color:#1a1a1a;">${buyer.businessName}</strong> is ready.
      </p>
    </div>

    ${divider}

    <!-- Stats -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        ${statCell("Account tier", `<span style="color:${tc};text-transform:capitalize;">${buyer.buyerTier}</span>`)}
        <td width="12"></td>
        ${statCell("Login email", buyer.email)}
        <td width="12"></td>
        ${statCell("Status", '<span style="color:#22c55e;">Active</span>')}
      </tr>
    </table>

    ${divider}

    <!-- What's next -->
    <h3 style="margin:0 0 16px;font-size:13px;font-family:monospace;letter-spacing:0.08em;color:#9ca3af;text-transform:uppercase;">What's next</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      ${[
        ["Browse the catalogue", "Access 200+ premium skincare brands at wholesale pricing."],
        ["Place your first order", "Use the bulk order tool to build large orders in minutes."],
        ["Track your shipments", "Every order ships with DHL tracking from your dashboard."],
      ].map(([title, desc], i) => `
        <tr>
          <td style="padding:12px 0;vertical-align:top;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:14px;vertical-align:top;">
                  <div style="width:24px;height:24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;text-align:center;line-height:24px;font-size:11px;font-family:monospace;color:#22c55e;font-weight:700;">0${i + 1}</div>
                </td>
                <td>
                  <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#1a1a1a;">${title}</p>
                  <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${desc}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${i < 2 ? `<tr><td style="padding:0;"><hr style="border:none;border-top:1px solid #f3f4f6;margin:0;" /></td></tr>` : ""}
      `).join("")}
    </table>

    <!-- CTA -->
    <div style="text-align:center;padding:24px;background:#f8faf8;border-radius:12px;border:1px solid #e8ede8;">
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">Ready to start ordering?</p>
      ${ctaButton(`${BASE}/catalogue`, "Browse the catalogue")}
    </div>
  `

  await resend.emails.send({
    from: FROM,
    to: buyer.email,
    subject: `You're approved — welcome to OuterSkinX, ${buyer.contactName}`,
    html: emailWrapper(content),
  })
}

export async function sendOrderConfirmationEmail(data: {
  email: string;
  contactName: string;
  businessName: string;
  orderId: string;
  total: number;
  itemCount: number;
}) {
  const shortId = data.orderId.slice(-8).toUpperCase()

  const content = `
    <!-- Hero -->
    <div style="text-align:center;padding:8px 0 32px;">
      <div style="width:56px;height:56px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <span style="font-size:24px;">📦</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;letter-spacing:-0.04em;color:#1a1a1a;">Order confirmed.</h1>
      <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.6;">
        Hi ${data.contactName}, we've received your order from <strong style="color:#1a1a1a;">${data.businessName}</strong>.
      </p>
    </div>

    ${divider}

    <!-- Stats -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        ${statCell("Order ID", `#${shortId}`)}
        <td width="12"></td>
        ${statCell("Items", `${data.itemCount} products`)}
        <td width="12"></td>
        ${statCell("Total", `₦${data.total.toLocaleString()}`)}
      </tr>
    </table>

    ${divider}

    <!-- Timeline -->
    <h3 style="margin:0 0 16px;font-size:13px;font-family:monospace;letter-spacing:0.08em;color:#9ca3af;text-transform:uppercase;">What happens next</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      ${[
        ["Order received", "Your order has been placed and is being reviewed.", true],
        ["Processing", "Our team will prepare and pack your items.", false],
        ["Shipped via DHL", "You'll receive a tracking number once dispatched.", false],
      ].map(([title, desc, active], i) => `
        <tr>
          <td style="padding:12px 0;vertical-align:top;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:14px;vertical-align:top;">
                  <div style="width:24px;height:24px;background:${active ? "#f0fdf4" : "#f9fafb"};border:1px solid ${active ? "#bbf7d0" : "#e5e7eb"};border-radius:6px;text-align:center;line-height:24px;font-size:11px;font-family:monospace;color:${active ? "#22c55e" : "#9ca3af"};font-weight:700;">0${i + 1}</div>
                </td>
                <td>
                  <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:${active ? "#1a1a1a" : "#6b7280"};">${title}</p>
                  <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">${desc}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${i < 2 ? `<tr><td><hr style="border:none;border-top:1px solid #f3f4f6;margin:0;" /></td></tr>` : ""}
      `).join("")}
    </table>

    <!-- CTA -->
    <div style="text-align:center;padding:24px;background:#f8faf8;border-radius:12px;border:1px solid #e8ede8;">
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">Track your order status in real time.</p>
      ${ctaButton(`${BASE}/orders/${data.orderId}`, "View order")}
    </div>
  `

  await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `Order confirmed — #${shortId}`,
    html: emailWrapper(content),
  })
}