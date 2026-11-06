import { messagingApi } from "@line/bot-sdk";
import { CommandContext, CommandHandler } from "./types";

export const systemTestCommand: CommandHandler = {
  name: "ทดสอบระบบ",
  match: (command: string) => command === "ทดสอบระบบ",
  execute: async (ctx: CommandContext) => {
    const { client, replyToken, appUrl } = ctx;

    const imagemapMessage: messagingApi.ImagemapMessage = {
      type: "imagemap",
      baseUrl: `${appUrl}/submenu/config_1`,
      altText: "ทดสอบระบบ",
      baseSize: {
        width: 1040,
        height: 1040,
      },
      actions: [
        {
          type: "message",
          text: "ริชเมนู1",
          area: {
            x: 0,
            y: 0,
            width: 520,
            height: 520,
          },
        },
        {
          type: "message",
          text: "ริชเมนู2",
          area: {
            x: 520,
            y: 0,
            width: 520,
            height: 520,
          },
        },
        {
          type: "message",
          text: "แอปพลิเคชัน1",
          area: {
            x: 0,
            y: 520,
            width: 520,
            height: 520,
          },
        },
        {
          type: "message",
          text: "แอปพลิเคชัน2",
          area: {
            x: 520,
            y: 520,
            width: 520,
            height: 520,
          },
        },
      ],
    };

    await client.replyMessage({
      replyToken,
      messages: [imagemapMessage],
    });
  },
};

