import { CommandContext, CommandHandler } from "./types";
import { linkRichMenu } from "./utils";

export const richMenu2Command: CommandHandler = {
  name: "ริชเมนู2",
  match: (command: string) => command === "ริชเมนู2",
  execute: async (ctx: CommandContext) => {
    const { client, replyToken, userId } = ctx;
    const richMenuId = process.env.RICH_MENU_2_ID || "20571609";

    if (!userId) {
      await client.replyMessage({
        replyToken,
        messages: [{ type: "text", text: "ขออภัย ไม่สามารถระบุ LINE User ID ได้" }],
      });
      return;
    }

    try {
      await linkRichMenu(client, userId, richMenuId);
      await client.replyMessage({
        replyToken,
        messages: [{ type: "text", text: "สลับเป็นริชเมนู 2 เรียบร้อยแล้ว" }],
      });
    } catch (err) {
      console.error("[Webhook] Link Rich Menu 2 Error:", err);
      await client.replyMessage({
        replyToken,
        messages: [
          {
            type: "text",
            text: `เปลี่ยนริชเมนู 2 (ID: ${richMenuId}) ไม่สำเร็จ: ${
              err instanceof Error ? err.message : "โปรดตรวจสอบ Rich Menu ID ในระบบ"
            }`,
          },
        ],
      });
    }
  },
};

