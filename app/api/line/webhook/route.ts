import { NextRequest, NextResponse } from "next/server";
import {
  messagingApi,
  channelAccessToken,
  validateSignature,
  webhook,
} from "@line/bot-sdk";
import { db } from "@/prisma/db";

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
      "ไม่พบการตั้งค่า CHANNEL_ACCESS_TOKEN หรือ CHANNEL_ID และ CHANNEL_SECRET_ID ในไฟล์ .env"
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
        return NextResponse.json(
          { message: "Missing x-line-signature header" },
          { status: 401 }
        );
      }

      const isValid = validateSignature(bodyText, channelSecret, signature);
      if (!isValid) {
        return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
      }
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

    // 2. วนลูปจัดการแต่ละ Event
    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        if (!("replyToken" in event) || !event.replyToken) {
          continue;
        }

        const textMessage = event.message.text.trim();
        const replyToken = event.replyToken;
        const userId = event.source?.userId;

        // คำสั่ง "ข้อมูลส่วนตัว" จาก Rich Menu หรือข้อความ
        if (textMessage === "ข้อมูลส่วนตัว") {
          if (!userId) {
            await client.replyMessage({
              replyToken,
              messages: [
                {
                  type: "text",
                  text: "ขออภัย ไม่สามารถระบุ LINE User ID ของท่านได้",
                },
              ],
            });
            continue;
          }

          // 1. นำ userId ไปค้นหาในฐานข้อมูล
          const user = await db.orm.public.User
            .where({ lineId: userId })
            .include("role", (r) => r.select("id", "name"))
            .first();

          // 1.1 หากยังไม่มีข้อมูลในฐานข้อมูล
          if (!user) {
            await client.replyMessage({
              replyToken,
              messages: [
                {
                  type: "text",
                  text: "ไม่พบข้อมูลสมาชิกของคุณในระบบ กรุณาลงทะเบียนเป็นสมาชิกก่อนใช้งานครับ",
                },
                {
                  type: "flex",
                  altText: "ลงทะเบียนสมาชิกใหม่",
                  contents: {
                    type: "bubble",
                    header: {
                      type: "box",
                      layout: "vertical",
                      backgroundColor: "#06C755",
                      contents: [
                        {
                          type: "text",
                          text: "ลงทะเบียนสมาชิก",
                          weight: "bold",
                          size: "lg",
                          color: "#FFFFFF",
                          align: "center",
                        },
                      ],
                    },
                    body: {
                      type: "box",
                      layout: "vertical",
                      spacing: "sm",
                      contents: [
                        {
                          type: "text",
                          text: "ยังไม่พบข้อมูลสมาชิก",
                          weight: "bold",
                          size: "md",
                          color: "#1F2937",
                        },
                        {
                          type: "text",
                          text: "กดปุ่มด้านล่างเพื่อทำการลงทะเบียนและเปิดใช้งานบัญชีของคุณ",
                          size: "xs",
                          color: "#6B7280",
                          wrap: true,
                        },
                      ],
                    },
                    footer: {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "button",
                          style: "primary",
                          color: "#06C755",
                          action: {
                            type: "uri",
                            label: "ลงทะเบียนตอนนี้",
                            uri: "https://miniapp.line.me/2012348381-xh5b25Ex",
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            });
            continue;
          }

          // 2. ตอบกลับในรูปแบบ Flex Message ตามเงื่อนไขที่กำหนด
          // - Header: มีสีพื้นหลัง และมีข้อความ "Profile"
          // - Hero: เป็นรูป profile ขนาดเต็มพื้นที่ (size: "full")
          // - Body: แสดงข้อมูลของผู้ใช้งาน
          // - Footer: มีปุ่ม "แก้ไขข้อมูล" เชื่อมโยงมาหน้า liff-proj.vercel.app/u/profile
          const avatarUrl =
            user.image && user.image.startsWith("https://")
              ? user.image
              : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop";

          const profileFlexMessage: messagingApi.FlexMessage = {
            type: "flex",
            altText: `ข้อมูลส่วนตัวของคุณ ${user.firstname} ${user.lastname}`,
            contents: {
              type: "bubble",
              header: {
                type: "box",
                layout: "vertical",
                backgroundColor: "#06C755",
                paddingAll: "lg",
                contents: [
                  {
                    type: "text",
                    text: "Profile",
                    weight: "bold",
                    size: "xl",
                    color: "#FFFFFF",
                    align: "center",
                  },
                ],
              },
              hero: {
                type: "image",
                url: avatarUrl,
                size: "full",
                aspectRatio: "20:13",
                aspectMode: "cover",
              },
              body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                paddingAll: "xl",
                contents: [
                  {
                    type: "text",
                    text: `${user.firstname} ${user.lastname}`,
                    weight: "bold",
                    size: "lg",
                    color: "#111827",
                  },
                  {
                    type: "separator",
                    color: "#E5E7EB",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                      {
                        type: "box",
                        layout: "baseline",
                        spacing: "sm",
                        contents: [
                          {
                            type: "text",
                            text: "สถานะ",
                            color: "#9CA3AF",
                            size: "xs",
                            flex: 2,
                          },
                          {
                            type: "text",
                            text: user.isActive ? "ใช้งานปกติ" : "ระงับการใช้งาน",
                            color: user.isActive ? "#059669" : "#DC2626",
                            size: "xs",
                            weight: "bold",
                            flex: 4,
                          },
                        ],
                      },
                      {
                        type: "box",
                        layout: "baseline",
                        spacing: "sm",
                        contents: [
                          {
                            type: "text",
                            text: "ระดับสมาชิก",
                            color: "#9CA3AF",
                            size: "xs",
                            flex: 2,
                          },
                          {
                            type: "text",
                            text: user.role?.name || "MEMBER",
                            color: "#4F46E5",
                            size: "xs",
                            weight: "bold",
                            flex: 4,
                          },
                        ],
                      },
                      {
                        type: "box",
                        layout: "baseline",
                        spacing: "sm",
                        contents: [
                          {
                            type: "text",
                            text: "อีเมล",
                            color: "#9CA3AF",
                            size: "xs",
                            flex: 2,
                          },
                          {
                            type: "text",
                            text: user.email,
                            color: "#374151",
                            size: "xs",
                            flex: 4,
                            wrap: true,
                          },
                        ],
                      },
                      {
                        type: "box",
                        layout: "baseline",
                        spacing: "sm",
                        contents: [
                          {
                            type: "text",
                            text: "เบอร์โทร",
                            color: "#9CA3AF",
                            size: "xs",
                            flex: 2,
                          },
                          {
                            type: "text",
                            text: user.telephone,
                            color: "#374151",
                            size: "xs",
                            flex: 4,
                          },
                        ],
                      },
                      {
                        type: "box",
                        layout: "baseline",
                        spacing: "sm",
                        contents: [
                          {
                            type: "text",
                            text: "LINE ID",
                            color: "#9CA3AF",
                            size: "xs",
                            flex: 2,
                          },
                          {
                            type: "text",
                            text: user.lineId,
                            color: "#6B7280",
                            size: "xxs",
                            flex: 4,
                            wrap: true,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              footer: {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                paddingAll: "lg",
                contents: [
                  {
                    type: "button",
                    style: "primary",
                    color: "#06C755",
                    height: "sm",
                    action: {
                      type: "uri",
                      label: "แก้ไขข้อมูล",
                      uri: "https://liff-proj.vercel.app/u/profile",
                    },
                  },
                ],
              },
            },
          };

          await client.replyMessage({
            replyToken,
            messages: [profileFlexMessage],
          });
        }
      }
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Error in line webhook handler:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
