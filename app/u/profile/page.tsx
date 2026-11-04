"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// กำหนด Schema สำหรับตรวจสอบความถูกต้องของฟอร์มแก้ไขข้อมูลด้วย Zod
const profileSchema = z.object({
  lineId: z.string().min(1, "ไม่พบข้อมูล LINE User ID"),
  firstname: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อจริง")
    .max(50, "ชื่อจริงต้องไม่เกิน 50 ตัวอักษร"),
  lastname: z
    .string()
    .trim()
    .min(1, "กรุณากรอกนามสกุล")
    .max(50, "นามสกุลต้องไม่เกิน 50 ตัวอักษร"),
  email: z
    .string()
    .trim()
    .min(1, "กรุณากรอกอีเมล")
    .email("รูปแบบอีเมลไม่ถูกต้อง"),
  telephone: z
    .string()
    .trim()
    .min(1, "กรุณากรอกเบอร์โทรศัพท์")
    .regex(/^[0-9]{9,10}$/, "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก"),
  image: z.string().optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface LineUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface MemberData {
  id: string;
  lineId: string;
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  role?: {
    id: number;
    name: string;
  };
}

export default function EditProfilePage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lineProfile, setLineProfile] = useState<LineUserProfile | null>(null);

  // ข้อมูลสมาชิกจากฐานข้อมูล
  const [isMember, setIsMember] = useState<boolean>(false);
  const [currentMember, setCurrentMember] = useState<MemberData | null>(null);

  // สถานะการแจ้งเตือน
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";

  // จัดการฟอร์มด้วย React Hook Form + Zod
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      lineId: "",
      firstname: "",
      lastname: "",
      email: "",
      telephone: "",
      image: null,
    },
    mode: "onBlur",
  });

  const currentImage = useWatch({ control, name: "image" });

  useEffect(() => {
    async function initializeLiffAndFetchProfile() {
      try {
        if (!liffId) {
          throw new Error("กรุณากำหนดค่า NEXT_PUBLIC_LIFF_ID ในไฟล์ .env");
        }

        // 1. เริ่มต้นเชื่อมต่อ LINE LIFF
        await liff.init({ liffId });

        // 2. ตรวจสอบสถานะการเข้าสู่ระบบ หากยังไม่ได้ล็อกอิน ให้ Login ทันที
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        // 3. ดึงข้อมูลโปรไฟล์จาก LINE
        const profile = await liff.getProfile();
        setLineProfile(profile);

        // 4. ดึงข้อมูลสมาชิกจากฐานข้อมูลผ่าน API
        const res = await fetch(`/api/member/profile?lineId=${encodeURIComponent(profile.userId)}`);
        const result = await res.json();

        if (res.ok && result.success && result.data) {
          setIsMember(true);
          setCurrentMember(result.data);

          // นำข้อมูลปัจจุบันใส่ลงในฟอร์ม
          reset({
            lineId: result.data.lineId,
            firstname: result.data.firstname || "",
            lastname: result.data.lastname || "",
            email: result.data.email || "",
            telephone: result.data.telephone || "",
            image: result.data.image || profile.pictureUrl || null,
          });
        } else {
          // ไม่พบข้อมูลสมาชิกในระบบ
          setIsMember(false);
        }
      } catch (err) {
        console.error("LIFF / Profile Init Error:", err);
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
      } finally {
        setLoading(false);
      }
    }

    initializeLiffAndFetchProfile();
  }, [liffId, reset]);

  // ฟังก์ชันบันทึกข้อมูลเมื่อผ่านการตรวจสอบของ Zod
  const onSubmit = async (data: ProfileFormData) => {
    setServerError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/member/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineId: data.lineId,
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          telephone: data.telephone,
          image: data.image || null,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "การอัปเดตข้อมูลไม่สำเร็จ");
      }

      setSuccessMessage("บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว");
      setCurrentMember(result.data);

      // รีเซ็ตสถานะ isDirty ด้วยข้อมูลล่าสุด
      reset({
        lineId: result.data.lineId,
        firstname: result.data.firstname,
        lastname: result.data.lastname,
        email: result.data.email,
        telephone: result.data.telephone,
        image: result.data.image,
      });
    } catch (err) {
      console.error("Update Profile Error:", err);
      setServerError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    }
  };

  // ดึงรูปโปรไฟล์ปัจจุบันจาก LINE เพื่อซิงก์
  const handleSyncLineImage = () => {
    if (lineProfile?.pictureUrl) {
      setValue("image", lineProfile.pictureUrl, { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleClose = () => {
    if (liff.isInClient()) {
      liff.closeWindow();
    } else {
      alert("คำสั่งนี้ใช้ได้เฉพาะเมื่อเปิดผ่านแอป LINE เท่านั้น");
    }
  };

  // 1. หน้าจอโหลดข้อมูล
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold text-sm">กำลังตรวจสอบสิทธิ์ผ่าน LINE LIFF...</p>
          <p className="text-gray-400 text-xs mt-1">กรุณารอสักครู่</p>
        </div>
      </main>
    );
  }

  // 2. หน้าจอแสดงข้อผิดพลาด LIFF
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-3xl shadow-sm border border-red-100 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">ไม่สามารถเชื่อมต่อ LINE ได้</h2>
          <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl mb-4 font-mono text-left break-all">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </main>
    );
  }

  // 3. กรณีที่ยังไม่ได้เป็นสมาชิกในระบบ
  if (!isMember) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4 py-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-amber-500 text-white p-6 text-center">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 text-2xl font-bold">
              !
            </div>
            <h1 className="text-lg font-bold">ยังไม่พบข้อมูลสมาชิก</h1>
            <p className="text-xs text-white/90 mt-1">
              บัญชี LINE นี้ยังไม่ได้ลงทะเบียนในระบบ
            </p>
          </div>

          <div className="p-6 text-center">
            {lineProfile?.pictureUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lineProfile.pictureUrl}
                alt={lineProfile.displayName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover shadow-sm border-2 border-amber-300 mx-auto mb-3"
              />
            )}
            <p className="font-semibold text-gray-800 text-sm mb-1">
              {lineProfile?.displayName}
            </p>
            <p className="text-xs text-gray-500 mb-6">
              กรุณาลงทะเบียนสมาชิกก่อนจึงจะสามารถเข้าดูและแก้ไขข้อมูลส่วนตัวได้
            </p>

            <div className="space-y-2">
              <Link
                href="/u/register"
                className="block w-full py-3 bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold rounded-xl text-center text-sm transition shadow-sm"
              >
                ไปที่หน้าลงทะเบียนสมาชิก
              </Link>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 4. หน้าจอแบบฟอร์มแก้ไขข้อมูลส่วนตัว
  const displayImage = currentImage || lineProfile?.pictureUrl;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4 py-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* หัวหน้าเว็บ */}
        <div className="bg-[#06C755] text-white p-6 text-center">
          <h1 className="text-xl font-bold">แก้ไขข้อมูลส่วนตัว</h1>
          <p className="text-xs text-white/90 mt-1">
            อัปเดตข้อมูลบัญชีสมาชิกสำหรับบัญชี LINE นี้
          </p>
        </div>

        {/* ส่วนรูปโปรไฟล์และสถานะ */}
        <div className="pt-6 px-6 pb-2 flex flex-col items-center">
          <div className="relative mb-2">
            {displayImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImage}
                alt="Profile"
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover shadow-sm border-2 border-white ring-2 ring-[#06C755]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-2xl font-bold border-2 border-white ring-2 ring-[#06C755]">
                {lineProfile?.displayName?.charAt(0) || "U"}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-[#06C755]/10 text-[#06C755] px-3 py-0.5 rounded-full font-medium">
              LINE: {lineProfile?.displayName}
            </span>
            {currentMember?.role && (
              <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-0.5 rounded-full font-medium">
                {currentMember.role.name}
              </span>
            )}
          </div>

          {/* ปุ่มดึงรูปโปรไฟล์จาก LINE */}
          {lineProfile?.pictureUrl && lineProfile.pictureUrl !== currentImage && (
            <button
              type="button"
              onClick={handleSyncLineImage}
              className="mt-2 text-xs text-[#06C755] hover:underline font-medium"
            >
              🔄 ใช้รูปโปรไฟล์ล่าสุดจาก LINE
            </button>
          )}
        </div>

        {/* ฟอร์มแก้ไขข้อมูลด้วย React Hook Form + Zod */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
          {/* ข้อความแจ้งเตือนความผิดพลาด */}
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
              <span className="font-bold">!</span>
              <span>{serverError}</span>
            </div>
          )}

          {/* ข้อความแจ้งเตือนบันทึกสำเร็จ */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <span className="font-bold">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* ซ่อน lineId และ image */}
          <input type="hidden" {...register("lineId")} />
          <input type="hidden" {...register("image")} />

          {/* LINE User ID (Read-only) */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              LINE User ID
            </label>
            <input
              type="text"
              readOnly
              value={lineProfile?.userId || ""}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-500 outline-none select-all cursor-not-allowed"
            />
            {errors.lineId && (
              <p className="text-xs text-red-500 mt-1">{errors.lineId.message}</p>
            )}
          </div>

          {/* ชื่อจริง และ นามสกุล */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                ชื่อจริง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("firstname")}
                placeholder="สมชาย"
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none transition ${
                  errors.firstname
                    ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                    : "border-gray-300 focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
                }`}
              />
              {errors.firstname && (
                <p className="text-xs text-red-500 mt-1">{errors.firstname.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("lastname")}
                placeholder="ใจดี"
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none transition ${
                  errors.lastname
                    ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                    : "border-gray-300 focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
                }`}
              />
              {errors.lastname && (
                <p className="text-xs text-red-500 mt-1">{errors.lastname.message}</p>
              )}
            </div>
          </div>

          {/* อีเมล */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              อีเมล <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register("email")}
              placeholder="example@mail.com"
              className={`w-full border rounded-xl px-3 py-2 text-sm outline-none transition ${
                errors.email
                  ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                  : "border-gray-300 focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
              }`}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* เบอร์โทรศัพท์ */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...register("telephone")}
              placeholder="0812345678"
              className={`w-full border rounded-xl px-3 py-2 text-sm outline-none transition ${
                errors.telephone
                  ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                  : "border-gray-300 focus:border-[#06C755] focus:ring-1 focus:ring-[#06C755]"
              }`}
            />
            {errors.telephone && (
              <p className="text-xs text-red-500 mt-1">{errors.telephone.message}</p>
            )}
          </div>

          {/* ปุ่มบันทึกการแก้ไข */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="w-full py-3.5 bg-[#06C755] hover:bg-[#05b34c] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl text-sm transition shadow-md shadow-[#06C755]/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <span>{isDirty ? "บันทึกการแก้ไขข้อมูล" : "ข้อมูลเป็นปัจจุบันแล้ว"}</span>
              )}
            </button>

            <Link
              href="/p/welcome"
              className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-center text-sm transition"
            >
              ไปยังหน้าต้อนรับ (Welcome)
            </Link>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 text-gray-400 hover:text-gray-600 text-xs font-medium transition text-center cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
