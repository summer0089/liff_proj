import { CommandContext, CommandHandler } from "./types";

export const application1Command: CommandHandler = {
  name: "แอปพลิเคชัน1",
  match: (command: string) => command === "แอปพลิเคชัน1",
  execute: async (ctx: CommandContext) => {
    const { client, replyToken } = ctx;

    await client.replyMessage({
      replyToken,
      messages: [{ type: "text", text: "แอปพลิเคชัน1 กำลังพัฒนา" }],
    });
  },
};

