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

interface UpdateProfileRequestBody {
  lineId?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  telephone?: string;
  image?: string | null;
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as UpdateProfileRequestBody;
    const { lineId, firstname, lastname, email, telephone, image } = body;

    // 1. ตรวจสอบข้อมูลบังคับ
    if (!lineId || typeof lineId !== "string" || !lineId.trim()) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ lineId" },
        { status: 400 }
      );
    }

    if (!firstname || typeof firstname !== "string" || !firstname.trim()) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกชื่อจริง" },
        { status: 400 }
      );
    }

    if (!lastname || typeof lastname !== "string" || !lastname.trim()) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกนามสกุล" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกอีเมล" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: "รูปแบบอีเมลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (!telephone || typeof telephone !== "string" || !telephone.trim()) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกเบอร์โทรศัพท์" },
        { status: 400 }
      );
    }

    const cleanPhone = telephone.trim().replace(/[\s-]/g, "");
    if (!/^[0-9]{9,15}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ควรเป็นตัวเลข 9-10 หลัก)" },
        { status: 400 }
      );
    }

    const trimmedLineId = lineId.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedFirstname = firstname.trim();
    const trimmedLastname = lastname.trim();

    // 2. ตรวจสอบว่าผู้ใช้อยู่ในระบบหรือไม่
    const existingUser = await db.orm.public.User
      .where({ lineId: trimmedLineId })
      .first();

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          notFound: true,
          message: "ไม่พบข้อมูลสมาชิกในระบบสำหรับ LINE ID นี้",
        },
        { status: 404 }
      );
    }

    // 3. ตรวจสอบว่า email ใหม่ชนกับ user อื่นหรือไม่
    if (trimmedEmail !== existingUser.email) {
      const emailOccupant = await db.orm.public.User
        .where({ email: trimmedEmail })
        .first();

      if (emailOccupant && emailOccupant.id !== existingUser.id) {
        return NextResponse.json(
          { success: false, message: "อีเมลนี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว กรุณาใช้อีเมลอื่น" },
          { status: 409 }
        );
      }
    }

    // 4. บันทึกข้อมูลที่แก้ไข
    await db.orm.public.User
      .where({ id: existingUser.id })
      .update({
        firstname: trimmedFirstname,
        lastname: trimmedLastname,
        email: trimmedEmail,
        telephone: cleanPhone,
        ...(image !== undefined ? { image: image ? image.trim() : null } : {}),
      });

    // 5. ดึงข้อมูลล่าสุดพร้อม role กลับมาแสดง
    const updatedUser = await db.orm.public.User
      .where({ id: existingUser.id })
      .include("role", (r) => r.select("id", "name"))
      .first();

    return NextResponse.json({
      success: true,
      message: "อัปเดตข้อมูลส่วนตัวสำเร็จ",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error in PUT /api/member/profile:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
      },
      { status: 500 }
    );
  }
}
