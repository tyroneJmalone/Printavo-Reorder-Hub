import { Resend } from "resend";
import { log } from "./index";
import type { ReorderRequest } from "@shared/schema";

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found for repl/depl");
  }

  connectionSettings = await fetch(
    "https://" +
      hostname +
      "/api/v2/connection?include_secrets=true&connector_names=resend",
    {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: xReplitToken,
      },
    },
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error("Resend not connected");
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email,
  };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail,
  };
}

const SALES_EMAIL = "info@mintprintworks.com";

export async function sendReorderEmail(request: ReorderRequest) {
  try {
    const { client, fromEmail } = await getResendClient();

    const orderName = request.orderNickname || `Order #${request.visualId}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 22px;">Reorder Request</h1>
          <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">A customer wants to reorder a previous order</p>
        </div>

        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 120px;">Order</td>
              <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${orderName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Order #</td>
              <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${request.visualId || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Customer</td>
              <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${request.customerName || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email</td>
              <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${request.customerEmail}</td>
            </tr>
            ${
              request.sizes && request.sizes.length > 0
                ? `<tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px; vertical-align: top;">Sizes</td>
              <td style="padding: 8px 0; font-size: 14px;">
                <table style="border-collapse: collapse; width: 100%;">
                  ${request.sizes.map(s => `<tr>
                    <td style="padding: 2px 12px 2px 0; font-size: 13px;">${s.size}</td>
                    <td style="padding: 2px 0; font-size: 13px; font-weight: 600;">× ${s.qty}</td>
                  </tr>`).join("")}
                  <tr style="border-top: 1px solid #e2e8f0;">
                    <td style="padding: 6px 12px 2px 0; font-size: 13px; font-weight: 600;">Total</td>
                    <td style="padding: 6px 0 2px; font-size: 13px; font-weight: 600;">× ${request.sizes.reduce((sum, s) => sum + s.qty, 0)}</td>
                  </tr>
                </table>
              </td>
            </tr>`
                : ""
            }
            ${
              request.notes
                ? `<tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px; vertical-align: top;">Notes</td>
              <td style="padding: 8px 0; font-size: 14px;">${request.notes}</td>
            </tr>`
                : ""
            }
          </table>
        </div>

        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
          Sent from the Mint Printworks Reorder Portal
        </p>
      </div>
    `;

    const result = await client.emails.send({
      from: fromEmail,
      to: SALES_EMAIL,
      subject: `Reorder Request: ${orderName} from ${request.customerName || request.customerEmail}`,
      html: htmlContent,
    });

    log(`Reorder email sent for order ${request.visualId} - ${JSON.stringify(result)}`, "email");
    return { success: true };
  } catch (error: any) {
    log(`Failed to send reorder email: ${error.message}`, "email");
    throw new Error(`Failed to send notification email: ${error.message}`);
  }
}
