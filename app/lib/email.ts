import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL as string;

export async function sendWelcomeEmail(buyer: {
  email: string;
  contactName: string;
  businessName: string;
  buyerTier: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: buyer.email,
    subject: "Your OuterSkinX wholesale account is approved",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <div style="padding: 32px 0 16px;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">Welcome, ${buyer.contactName} 👋</h2>
          <p style="margin: 0; color: #6b6560; font-size: 14px;">Your wholesale account for <strong>${buyer.businessName}</strong> has been approved.</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e8e3dc; margin: 16px 0;" />

        <div style="padding: 16px 0;">
          <p style="font-size: 14px; margin: 0 0 12px;">Here are your account details:</p>
          <table style="font-size: 14px; width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #6b6560; width: 140px;">Account tier</td>
              <td style="padding: 6px 0; text-transform: capitalize;">${buyer.buyerTier}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b6560;">Login email</td>
              <td style="padding: 6px 0;">${buyer.email}</td>
            </tr>
          </table>
        </div>

        <div style="padding: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/login"
            style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 14px; padding: 10px 24px; border-radius: 6px;"
          >
            Sign in to your account
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e8e3dc; margin: 16px 0;" />

        <p style="font-size: 12px; color: #a39d97; margin: 16px 0 0;">
          Questions? Reply to this email or contact us at hello@outerskinx.com
        </p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail(data: {
  email: string;
  contactName: string;
  businessName: string;
  orderId: string;
  total: number;
  itemCount: number;
}) {
  await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `Order confirmed — #${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <div style="padding: 32px 0 16px;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">Order confirmed ✓</h2>
          <p style="margin: 0; color: #6b6560; font-size: 14px;">Hi ${data.contactName}, we've received your order from <strong>${data.businessName}</strong>.</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e8e3dc; margin: 16px 0;" />

        <table style="font-size: 14px; width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #6b6560; width: 140px;">Order ID</td>
            <td style="padding: 6px 0;">#${data.orderId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b6560;">Items</td>
            <td style="padding: 6px 0;">${data.itemCount} products</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b6560;">Total</td>
            <td style="padding: 6px 0;">₦${data.total.toLocaleString()}</td>
          </tr>
        </table>

        <div style="padding: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/orders/${data.orderId}"
            style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 14px; padding: 10px 24px; border-radius: 6px;"
          >
            View order
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e8e3dc; margin: 16px 0;" />

        <p style="font-size: 12px; color: #a39d97; margin: 16px 0 0;">
          Questions? Contact us at hello@outerskinx.com
        </p>
      </div>
    `,
  });
}
