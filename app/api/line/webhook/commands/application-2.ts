import { CommandContext, CommandHandler } from "./types";

export const application2Command: CommandHandler = {
  name: "แอปพลิเคชัน2",
  match: (command: string) => command === "แอปพลิเคชัน2",
  execute: async (ctx: CommandContext) => {
    const { client, replyToken } = ctx;

    await client.replyMessage({
      replyToken,
      messages: [{ type: "text", text: "แอปพลิเคชัน2 กำลังพัฒนา" }],
    });
  },
};

