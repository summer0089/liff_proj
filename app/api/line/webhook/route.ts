import { NextRequest, NextResponse } from "next/server";
import {
  messagingApi,
  channelAccessToken,
  validateSignature,
  webhook,
} from "@line/bot-sdk";
import { executeCommand } from "./commands";

// แคช Stateless Token ในหน่วยความจำเพื่อหลีกเลี่ยงการขอ token บ่อยเกินความจำเป็น
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * ดึง Client สำหรับส่งข้อความผ่าน Messaging API
 * รองรับทั้งแบบ CHANNEL_ACCESS_TOKEN โดยตรง
 * หรือสร้าง Stateless Token จาก CHANNEL_ID และ CHANNEL_SECRET_ID อัตโนมัติ
 */
async function getMessagingClient(): Promise<messagingApi.MessagingApiClient> {
  const directToken = process.env.CHANNEL_ACCESS_TOKEN;
  if (directToken && directToken.trim()) {
    return new messagingApi.MessagingApiClient({ channelAccessToken: directToken.trim() });
  }

  const clientId = process.env.CHANNEL_ID?.trim();
  const clientSecret = (process.env.CHANNEL_SECRET_ID || process.env.CHANNEL_SECRET)?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "ไม่พบการตั้งค่า CHANNEL_ACCESS_TOKEN หรือ CHANNEL_ID และ CHANNEL_SECRET_ID ใน Environment Variables (โปรดตรวจสอบการตั้งค่าใน Vercel / .env)"
    );
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return new messagingApi.MessagingApiClient({ channelAccessToken: cachedToken.token });
  }

  const tokenClient = new channelAccessToken.ChannelAccessTokenClient({});
  const tokenRes = await tokenClient.issueStatelessChannelTokenByClientSecret(
    clientId,
    clientSecret
  );

  cachedToken = {
    token: tokenRes.access_token,
    expiresAt: now + (tokenRes.expires_in || 900) * 1000,
  };

  return new messagingApi.MessagingApiClient({ channelAccessToken: cachedToken.token });
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get("x-line-signature");
    const channelSecret = (process.env.CHANNEL_SECRET_ID || process.env.CHANNEL_SECRET)?.trim();

    // 1. ตรวจสอบลายเซ็น (LINE Signature)
    if (channelSecret) {
      if (!signature) {
        console.warn("[Webhook] Missing x-line-signature header");
        return NextResponse.json(
          { message: "Missing x-line-signature header" },
          { status: 401 }
        );
      }

      const isValid = validateSignature(bodyText, channelSecret, signature);
      if (!isValid) {
        console.warn("[Webhook] Invalid signature received");
        return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn(
        "[Webhook] Warning: CHANNEL_SECRET_ID is not configured, skipping signature validation."
      );
    }

    const payload = JSON.parse(bodyText) as {
      destination?: string;
      events?: webhook.Event[];
    };

    const events = payload.events || [];

    // สำหรับกรณี LINE Developers กด "Verify" Webhook (events จะเป็น array ว่าง)
    if (events.length === 0) {
      return NextResponse.json({ message: "OK" });
    }

    const client = await getMessagingClient();

    const appUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : null) ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "https://liff-proj.vercel.app";

    // 2. วนลูปจัดการแต่ละ Event
    for (const event of events) {
      try {
        if (!("replyToken" in event) || !event.replyToken) {
          continue;
        }

        const replyToken = event.replyToken;
        const userId = event.source?.userId;

        // ดึงข้อความหรือคำสั่งจาก Message Event หรือ Postback Event (Rich Menu รองรับทั้ง 2 แบบ)
        let command = "";
        if (event.type === "message" && event.message.type === "text") {
          command = event.message.text.trim();
        } else if (event.type === "postback") {
          command = event.postback.data.trim();
        }

        console.log(`[Webhook] Event type: ${event.type}, Command: "${command}", User: ${userId}`);

        if (command) {
          await executeCommand({
            client,
            replyToken,
            userId,
            command,
            appUrl,
          });
        }
      } catch (eventError) {
        console.error("[Webhook] Error processing event:", eventError);
      }
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("[Webhook] Global Error in handler:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
