import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ size?: string[] }> }
) {
  try {
    await params;
    // อ่านไฟล์รูปภาพจาก public/submenu/config_1.jpg เพื่อตอบกลับเป็น Content-Type: image/jpeg
    const filePath = path.join(process.cwd(), "public", "submenu", "config_1.jpg");
    const imageBuffer = await fs.readFile(filePath);

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Error serving imagemap image:", error);
    return new NextResponse("Image not found", { status: 404 });
  }
}

