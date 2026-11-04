"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// กำหนด Schema สำหรับตรวจสอบความถูกต้องของฟอร์มด้วย Zod
const registerSchema = z.object({
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

type RegisterFormData = z.infer<typeof registerSchema>;

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
  role?: {
    id: number;
    name: string;
  };
}

export default function UserRegisterPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lineProfile, setLineProfile] = useState<LineUserProfile | null>(null);

  // สถานะสมาชิกในระบบ
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [existingMember, setExistingMember] = useState<MemberData | null>(null);

  // ผลลัพธ์หลังลงทะเบียนสำเร็จ
  const [registerSuccess, setRegisterSuccess] = useState<boolean>(false);
  const [newMemberData, setNewMemberData] = useState<MemberData | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";

  // จัดการฟอร์มด้วย React Hook Form + Zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
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

  useEffect(() => {
    async function initializeLiffAndCheckMember() {
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

        // ดึงอีเมลจาก id_token หากได้รับสิทธิ์
        let lineEmail = "";
        try {
          const idToken = liff.getDecodedIDToken();
          if (idToken?.email) {
            lineEmail = idToken.email;
          }
        } catch {
          // หากไม่มีสิทธิ์อ่านอีเมล ให้เว้นว่างไว้ให้ผู้ใช้กรอก
        }

        // แยกชื่อจริงและนามสกุลจาก displayName
        let defaultFirstname = "";
        let defaultLastname = "";
        if (profile.displayName) {
          const nameParts = profile.displayName.trim().split(/\s+/);
          if (nameParts.length > 1) {
            defaultFirstname = nameParts[0];
            defaultLastname = nameParts.slice(1).join(" ");
          } else {
            defaultFirstname = nameParts[0];
          }
        }

        // กำหนดค่าเริ่มต้นให้กับ React Hook Form
        reset({
          lineId: profile.userId,
          firstname: defaultFirstname,
          lastname: defaultLastname,
          email: lineEmail,
          telephone: "",
          image: profile.pictureUrl || null,
        });

        // 4. ตรวจสอบข้อมูลสมาชิกใน member/profile
        const res = await fetch(`/api/member/profile?lineId=${encodeURIComponent(profile.userId)}`);
        const result = await res.json();

        if (res.ok && result.success && result.data) {
          setIsRegistered(true);
          setExistingMember(result.data);
        } else {
          setIsRegistered(false);
        }
      } catch (err) {
        console.error("LIFF / Member Init Error:", err);
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
      } finally {
        setLoading(false);
      }
    }

    initializeLiffAndCheckMember();
  }, [liffId, reset]);

  // ฟังก์ชันบันทึกข้อมูลเมื่อผ่านการตรวจสอบของ Zod
  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);

    try {
      const res = await fetch("/api/member/register", {
        method: "POST",
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
        throw new Error(result.message || "การลงทะเบียนไม่สำเร็จ");
      }

      setRegisterSuccess(true);
      setNewMemberData(result.data);
    } catch (err) {
      console.error("Register Submit Error:", err);
      setServerError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลงทะเบียน");
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
          <p className="text-gray-700 font-semibold text-sm">กำลังตรวจสอบข้อมูลสมาชิกผ่าน LINE...</p>
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

  // 3. หน้าจอลงทะเบียนสำเร็จ
  if (registerSuccess && newMemberData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4 py-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-[#06C755] text-white p-6 text-center">
            <div className="w-16 h-16 bg-white text-[#06C755] rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">ลงทะเบียนสำเร็จ!</h1>
            <p className="text-xs text-white/90 mt-1">ยินดีต้อนรับเข้าสู่ระบบสมาชิก</p>
          </div>

          <div className="p-6">
            <div className="flex flex-col items-center mb-6">
              {newMemberData.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={newMemberData.image}
                  alt={newMemberData.firstname}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover shadow-sm border-2 border-[#06C755] mb-2"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xl font-bold mb-2">
                  {newMemberData.firstname.charAt(0)}
                </div>
              )}
              <h2 className="text-base font-bold text-gray-800">
                {newMemberData.firstname} {newMemberData.lastname}
              </h2>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium mt-1">
                สมาชิกใหม่
              </span>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 text-xs space-y-2.5 text-gray-700 mb-6 border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-400">อีเมล:</span>
                <span className="font-semibold">{newMemberData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">เบอร์โทรศัพท์:</span>
                <span className="font-semibold">{newMemberData.telephone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">LINE ID:</span>
                <span className="font-mono text-gray-500 truncate max-w-[180px]">
                  {newMemberData.lineId}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                href="/p/welcome"
                className="block w-full py-3 bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold rounded-xl text-center text-sm transition"
              >
                ไปยังหน้าต้อนรับ (Welcome)
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

  // 4. กรณีที่ LINE ID นี้เคยลงทะเบียนไว้แล้ว
  if (isRegistered && existingMember) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4 py-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 text-center">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 text-2xl">
              ✓
            </div>
            <h1 className="text-lg font-bold">ท่านได้ลงทะเบียนแล้ว</h1>
            <p className="text-xs text-white/80 mt-1">พบข้อมูลสมาชิกของ LINE ID นี้ในระบบแล้ว</p>
          </div>

          <div className="p-6">
            <div className="flex flex-col items-center mb-6">
              {existingMember.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={existingMember.image}
                  alt={existingMember.firstname}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover shadow-sm border-2 border-indigo-500 mb-2"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold mb-2">
                  {existingMember.firstname.charAt(0)}
                </div>
              )}
              <h2 className="text-base font-bold text-gray-800">
                {existingMember.firstname} {existingMember.lastname}
              </h2>
              {existingMember.role && (
                <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-0.5 rounded-full font-medium mt-1">
                  {existingMember.role.name}
                </span>
              )}
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 text-xs space-y-2.5 text-gray-700 mb-6 border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-400">อีเมล:</span>
                <span className="font-semibold">{existingMember.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">เบอร์โทรศัพท์:</span>
                <span className="font-semibold">{existingMember.telephone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">สถานะ:</span>
                <span className="text-emerald-600 font-semibold">
                  {existingMember.isActive ? "ใช้งานปกติ" : "ระงับการใช้งาน"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                href="/p/welcome"
                className="block w-full py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl text-center text-sm transition"
              >
                ไปยังหน้าต้อนรับ (Welcome)
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

  // 5. แสดงฟอร์มลงทะเบียนพร้อม React Hook Form + Zod Validation
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4 py-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* ส่วนหัว Form */}
        <div className="bg-[#06C755] text-white p-6 text-center">
          <h1 className="text-xl font-bold">ลงทะเบียนสมาชิก</h1>
          <p className="text-xs text-white/90 mt-1">
            กรอกข้อมูลเพื่อเปิดใช้งานบัญชีสมาชิกสำหรับบัญชี LINE นี้
          </p>
        </div>

        {/* ข้อมูลโปรไฟล์จาก LINE */}
        <div className="pt-6 px-6 pb-2 flex flex-col items-center">
          {lineProfile?.pictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lineProfile.pictureUrl}
              alt={lineProfile.displayName}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover shadow-sm border-2 border-white ring-2 ring-[#06C755] mb-2"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-2xl font-bold mb-2">
              {lineProfile?.displayName?.charAt(0) || "U"}
            </div>
          )}
          <span className="text-xs bg-[#06C755]/10 text-[#06C755] px-3 py-1 rounded-full font-medium">
            LINE: {lineProfile?.displayName}
          </span>
        </div>

        {/* ฟอร์มลงทะเบียน */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
              <span className="font-bold">!</span>
              <span>{serverError}</span>
            </div>
          )}

          {/* ซ่อน lineId และ image ไว้ใน form */}
          <input type="hidden" {...register("lineId")} />
          <input type="hidden" {...register("image")} />

          {/* LINE User ID (Read-only Display) */}
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

          {/* ชื่อ - นามสกุล */}
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

          {/* ปุ่มบันทึก */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#06C755] hover:bg-[#05b34c] disabled:bg-gray-300 text-white font-bold rounded-xl text-sm transition shadow-md shadow-[#06C755]/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <span>ลงทะเบียนสมาชิก</span>
              )}
            </button>
          </div>

          {/* ปุ่มปิด */}
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-700 font-medium transition text-center cursor-pointer"
          >
            ยกเลิกและปิดหน้าต่าง
          </button>
        </form>

      </div>
    </main>
  );
}

