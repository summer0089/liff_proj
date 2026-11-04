import { NextRequest, NextResponse } from "next/server";
import { db } from "@/prisma/db";

interface RegisterRequestBody {
  lineId?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  telephone?: string;
  image?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as RegisterRequestBody;
    const { lineId, firstname, lastname, email, telephone, image } = body;

    // 1. ตรวจสอบข้อมูลบังคับ
    if (!lineId || typeof lineId !== "string" || !lineId.trim()) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ LINE ID" },
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

    // 2. ตรวจสอบว่า lineId นี้เคยลงทะเบียนไว้แล้วหรือยัง
    const existingUser = await db.orm.public.User.where({ lineId: trimmedLineId }).first();
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "LINE ID นี้ได้ลงทะเบียนเป็นสมาชิกในระบบแล้ว" },
        { status: 409 }
      );
    }

    // 3. ตรวจสอบว่า email ซ้ำหรือไม่
    const existingEmail = await db.orm.public.User.where({ email: trimmedEmail }).first();
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น" },
        { status: 409 }
      );
    }

    // 4. ค้นหา Role เริ่มต้นสำหรับสมาชิก (เช่น 'MEMBER' หรือ Role แรกในระบบ)
    let role = await db.orm.public.UserRole.where({ name: "MEMBER" }).first();
    if (!role) {
      const allRoles = await db.orm.public.UserRole.all();
      if (allRoles.length > 0) {
        role = allRoles[0];
      } else {
        role = await db.orm.public.UserRole.create({
          name: "MEMBER",
        });
      }
    }

    // 5. บันทึกข้อมูลสมาชิกลงฐานข้อมูล
    const newUser = await db.orm.public.User.create({
      lineId: trimmedLineId,
      firstname: trimmedFirstname,
      lastname: trimmedLastname,
      email: trimmedEmail,
      telephone: cleanPhone,
      image: image ? image.trim() : null,
      roleId: role.id,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "ลงทะเบียนสมาชิกสำเร็จ",
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/member/register:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลงทะเบียน",
      },
      { status: 500 }
    );
  }
}

