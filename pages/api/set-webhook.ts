import type { NextApiRequest, NextApiResponse } from "next";
import { telegramApi } from "../../lib/telegram";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const requestedUrl = typeof req.body?.webhookUrl === "string" ? req.body.webhookUrl : "";
    let webhookUrl = requestedUrl;
    
    if (!webhookUrl) {
      const forwardedProto = req.headers["x-forwarded-proto"];
      const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || "https";
      const host = req.headers.host;
      
      if (!host) {
        return res.status(400).json({
          error: "Webhook URL not provided and could not be determined",
        });
      }
      
      const fullWebhookUrl = `${protocol}://${host}/api/webhook`;
      webhookUrl = fullWebhookUrl;
    }

    const parsedUrl = new URL(webhookUrl);
    if (parsedUrl.protocol !== "https:") {
      return res.status(400).json({ error: "Webhook URL must use HTTPS" });
    }

    await telegramApi("setWebhook", {
      url: webhookUrl,
      allowed_updates: ["message", "chat_join_request"],
    });
    return res.status(200).json({
      success: true,
      webhookUrl,
      message: "Webhook set successfully",
    });
  } catch (error) {
    console.error("Set webhook error:", error);
    return res.status(500).json({
      error: "Failed to set webhook",
    });
  }
}
