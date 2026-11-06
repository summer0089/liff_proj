import { messagingApi } from "@line/bot-sdk";

/**
 * ฟังก์ชันสำหรับผูก Rich Menu เข้ากับ User
 * รองรับทั้งกรณีที่ส่ง ID มาเป็นตัวเลขตรงๆ หรือมี prefix "richmenu-"
 */
export async function linkRichMenu(
  client: messagingApi.MessagingApiClient,
  userId: string,
  richMenuId: string
): Promise<void> {
  try {
    await client.linkRichMenuIdToUser(userId, richMenuId);
  } catch (err: unknown) {
    // หากลองใช้ ID โดยตรงแล้วไม่พบ ให้ทดลองอีกรูปแบบ (เติมหรือตัด 'richmenu-')
    const altId = richMenuId.startsWith("richmenu-")
      ? richMenuId.replace("richmenu-", "")
      : `richmenu-${richMenuId}`;
    try {
      await client.linkRichMenuIdToUser(userId, altId);
    } catch {
      console.error(
        `[Webhook] Failed to link rich menu ${richMenuId} or ${altId} to user ${userId}:`,
        err
      );
      throw err;
    }
  }
}

