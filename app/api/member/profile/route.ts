import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get("lineId");

    if (!lineId) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ lineId" },
        { status: 400 }
      );
    }

    const user = await db.orm.public.User
      .where({ lineId })
      .include("role", (r) => r.select("id", "name"))
      .first();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          notFound: true,
          message: "ไม่พบข้อมูลสมาชิกในระบบสำหรับ LINE ID นี้",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error in GET /api/member/profile:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูล",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const lineId = body.lineId;

    if (!lineId) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ lineId" },
        { status: 400 }
      );
    }

    const user = await db.orm.public.User
      .where({ lineId })
      .include("role", (r) => r.select("id", "name"))
      .first();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          notFound: true,
          message: "ไม่พบข้อมูลสมาชิกในระบบสำหรับ LINE ID นี้",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error in POST /api/member/profile:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูล",
      },
      { status: 500 }
    );
  }
}

