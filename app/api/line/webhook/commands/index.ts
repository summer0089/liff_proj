import { CommandContext, CommandHandler } from "./types";
import { profileCommand } from "./profile";
import { systemTestCommand } from "./system-test";
import { richMenu1Command } from "./richmenu-1";
import { richMenu2Command } from "./richmenu-2";
import { application1Command } from "./application-1";
import { application2Command } from "./application-2";

export * from "./types";
export * from "./utils";
export * from "./profile";
export * from "./system-test";
export * from "./richmenu-1";
export * from "./richmenu-2";
export * from "./application-1";
export * from "./application-2";

// รายการคำสั่งทั้งหมดของระบบ
export const commands: CommandHandler[] = [
  profileCommand,
  systemTestCommand,
  richMenu1Command,
  richMenu2Command,
  application1Command,
  application2Command,
];

/**
 * ค้นหาและเรียกประมวลผลคำสั่งที่ตรงกับข้อความของผู้ใช้
 * หากไม่พบคำสั่งที่ตรงกัน จะตอบกลับด้วยข้อความแนะนำ
 */
export async function executeCommand(ctx: CommandContext): Promise<boolean> {
  const handler = commands.find((cmd) => cmd.match(ctx.command));

  if (handler) {
    console.log(`[Webhook] Executing handler: [${handler.name}]`);
    await handler.execute(ctx);
    return true;
  }

  // กรณีไม่ตรงกับคำสั่งใดๆ ให้ตอบกลับข้อความแนะนำการใช้งาน
  if (ctx.command) {
    console.log(`[Webhook] No handler matched for command: "${ctx.command}". Sending fallback.`);
    await ctx.client.replyMessage({
      replyToken: ctx.replyToken,
      messages: [
        {
          type: "text",
          text: `สวัสดีครับ ท่านสามารถพิมพ์หรือกดเมนู "ข้อมูลส่วนตัว" เพื่อตรวจสอบโปรไฟล์ของคุณ หรือกด "ทดสอบระบบ" เพื่อดูเมนูตัวเลือกครับ`,
        },
      ],
    });
    return true;
  }

  return false;
}

