import { messagingApi } from "@line/bot-sdk";
import { db } from "@/prisma/db";
import { CommandContext, CommandHandler } from "./types";

export const profileCommand: CommandHandler = {
  name: "ข้อมูลส่วนตัว",
  match: (command: string) => {
    const normalized = command.toLowerCase();
    return (
      command === "ข้อมูลส่วนตัว" ||
      normalized === "profile" ||
      normalized === "action=profile" ||
      command === "ดูข้อมูลส่วนตัว" ||
      command === "ข้อมูลสมาชิก"
    );
  },
  execute: async (ctx: CommandContext) => {
    const { client, replyToken, userId } = ctx;

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
      return;
    }

    // 1. นำ userId ไปค้นหาในฐานข้อมูล
    const user = await db.orm.public.User
      .where({ lineId: userId })
      .include("role", (r) => r.select("id", "name"))
      .first();

    // 1.1 หากยังไม่มีข้อมูลในฐานข้อมูล -> แจ้งเตือนพร้อมปุ่มลงทะเบียน
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
                      uri: "https://liff-proj.vercel.app/u/register",
                    },
                  },
                ],
              },
            },
          },
        ],
      });
      return;
    }

    // 2. ตอบกลับในรูปแบบ Flex Message Profile
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
                uri: "https://miniapp.line.me/2012348381-xh5b25Ex",
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
  },
};

