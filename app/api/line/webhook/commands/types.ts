import { messagingApi } from "@line/bot-sdk";

export interface CommandContext {
  client: messagingApi.MessagingApiClient;
  replyToken: string;
  userId?: string;
  command: string;
  appUrl: string;
}

export interface CommandHandler {
  name: string;
  match: (command: string) => boolean;
  execute: (ctx: CommandContext) => Promise<void>;
}

