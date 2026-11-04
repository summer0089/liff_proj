"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import liff from "@line/liff";
import Link from "next/link";

// กำหนดโครงสร้างข้อมูลโปรไฟล์ของ LINE
interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface MemberProfile {
  id: string;
  lineId: string;
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  image?: string | null;
  isActive: boolean;
  createdAt?: string;
  role?: {
    id: number;
    name: string;
  };
}

export default function WelcomePage() {
  const router = useRouter();

  // สร้าง State สำหรับเก็บสถานะและข้อมูล
  const [loading, setLoading] = useState<boolean>(true);
  const [redirecting, setRedirecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // ดึงค่า LIFF ID จาก .env
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";

  useEffect(() => {
    // ฟังก์ชันเริ่มต้นการทำงานของ LIFF และตรวจสอบสถานะสมาชิก
    async function initializeLiff() {
      try {
        if (!liffId) {
          throw new Error("กรุณากำหนดค่า NEXT_PUBLIC_LIFF_ID ในไฟล์ .env");
        }

        // 1. เริ่มต้นเชื่อมต่อกับ LINE LIFF
        await liff.init({ liffId });

        // 2. ตรวจสอบว่าผู้ใช้ล็อกอินหรือยัง ถ้ายังให้พาไปหน้าล็อกอิน
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        // 3. ดึงข้อมูลโปรไฟล์ของผู้ใช้จาก LINE
        const userProfile = await liff.getProfile();
        setProfile(userProfile);

        // 4. ตรวจสอบข้อมูลสมาชิกในระบบผ่าน api/member/profile ด้วย lineId
        const res = await fetch(
          `/api/member/profile?lineId=${encodeURIComponent(userProfile.userId)}`
        );
        const data = await res.json();

        if (res.ok && data.success && data.data) {
          // เคยเป็นสมาชิกแล้ว -> แสดงข้อมูลหน้านี้
          setMember(data.data);
          setLoading(false);
        } else {
          // ยังไม่ได้เป็นสมาชิก -> redirect ไปยังหน้าลงทะเบียน u/register
          setRedirecting(true);
          router.replace("/u/register");
        }
      } catch (err) {
        console.error("LIFF / Welcome Init Error:", err);
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
        setLoading(false);
      }
    }

    initializeLiff();
  }, [liffId, router]);

  // ฟังก์ชันสำหรับคัดลอก LINE User ID
  const handleCopyId = () => {
    if (profile?.userId) {
      navigator.clipboard.writeText(profile.userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ฟังก์ชันสำหรับปิดหน้าต่าง (เมื่อเปิดในแอป LINE)
  const handleClose = () => {
    if (liff.isInClient()) {
      liff.closeWindow();
    } else {
      alert("คำสั่งนี้ใช้ได้เฉพาะเมื่อเปิดผ่านแอป LINE เท่านั้น");
    }
  };

  // 1. หน้าต่างแสดงสถานะกำลัง redirect ไปยัง u/register
  if (redirecting) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F7F8F9] p-4">
        <div className="text-center max-w-xs">
          <div className="w-12 h-12 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-800 font-bold text-sm">ยังไม่พบข้อมูลสมาชิกในระบบ</p>
          <p className="text-gray-500 text-xs mt-1">กำลังนำท่านไปยังหน้าลงทะเบียนสมาชิก...</p>
        </div>
      </main>
    );
  }

  // 2. หน้าต่างแสดงสถานะ "กำลังโหลดข้อมูล"
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F7F8F9] p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold text-sm">กำลังตรวจสอบข้อมูลสมาชิกผ่าน LINE...</p>
          <p className="text-gray-400 text-xs mt-1">กรุณารอสักครู่</p>
        </div>
      </main>
    );
  }

  // 3. หน้าต่างแสดงเมื่อ "เกิดข้อผิดพลาด"
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F7F8F9] p-4">
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
            className="w-full py-3 bg-[#1E1E1E] hover:bg-black text-white rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </main>
    );
  }

  // 4. หน้าต่างแสดงผลข้อมูลสมาชิกที่ตรวจสอบผ่านแล้ว (ธีมสี LINE สวยงาม)
  const avatarUrl = member?.image || profile?.pictureUrl;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F8F9] p-4 py-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        
        {/* ส่วนหัว Header (ธีมสีเขียว LINE #06C755) */}
        <div className="bg-[#06C755] text-white p-6 text-center relative overflow-hidden">
          {/* ลวดลาย background ด้านหลัง */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-block text-[11px] font-semibold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              LINE MEMBER PORTAL
            </span>
            <h1 className="text-xl font-bold">ยินดีต้อนรับสมาชิก</h1>
            <p className="text-xs text-white/90 mt-1">
              เข้าสู่ระบบผ่านบัญชี LINE สำเร็จ
            </p>
          </div>
        </div>

        {/* ส่วนแสดงข้อมูลผู้ใช้ */}
        <div className="p-6">
          
          {/* รูปโปรไฟล์และชื่อ */}
          <div className="flex flex-col items-center -mt-14 mb-4">
            <div className="relative mb-2">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={profile?.displayName || "Profile"}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white ring-4 ring-[#06C755]/20 bg-white"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-emerald-50 text-[#06C755] border-4 border-white ring-4 ring-[#06C755]/20 flex items-center justify-center text-3xl font-bold shadow-lg">
                  {member?.firstname ? member.firstname.charAt(0) : "U"}
                </div>
              )}

              {/* สถานะใช้งานปกติ (จุดเขียว) */}
              <span
                className="absolute bottom-1 right-1 w-5 h-5 bg-[#06C755] border-2 border-white rounded-full shadow-sm"
                title="Active"
              />
            </div>

            {/* ชื่อสมาชิกจริง */}
            <h2 className="text-lg font-bold text-gray-900 text-center">
              {member?.firstname} {member?.lastname}
            </h2>

            {/* ชื่อบน LINE */}
            {profile?.displayName && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <span>LINE:</span>
                <span className="font-medium text-gray-700">{profile.displayName}</span>
              </p>
            )}

            {/* Badge สถานะสมาชิก / สิทธิ์ */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3 py-0.5 rounded-full font-semibold">
                {member?.role?.name || "MEMBER"}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
                {member?.isActive ? "สถานะ: ปกติ" : "ระงับการใช้งาน"}
              </span>
            </div>
          </div>

          {/* กล่องแสดงรายละเอียดข้อมูลส่วนตัว */}
          <div className="bg-[#F7F8F9] rounded-2xl p-4 space-y-3 border border-gray-100 text-xs mb-5">
            <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
              <span className="text-gray-500 font-medium">อีเมล</span>
              <span className="text-gray-800 font-semibold">{member?.email || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
              <span className="text-gray-500 font-medium">เบอร์โทรศัพท์</span>
              <span className="text-gray-800 font-semibold">{member?.telephone || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500 font-medium">LINE User ID</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-gray-600 truncate max-w-[130px]" title={profile?.userId}>
                  {profile?.userId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-md text-[11px] font-medium transition cursor-pointer"
                >
                  {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                </button>
              </div>
            </div>
          </div>

          {/* ปุ่มจัดการ: ปุ่มแก้ไขข้อมูลไปยัง u/profile และปุ่มปิดหน้าต่าง */}
          <div className="space-y-2.5">
            {/* ปุ่มแก้ไขข้อมูลไปยัง u/profile */}
            <Link
              href="/u/profile"
              className="w-full py-3.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-xl text-center text-sm transition shadow-lg shadow-[#06C755]/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              <span>แก้ไขข้อมูลส่วนตัว</span>
            </Link>

            {/* ปุ่มปิดหน้าต่าง LINE Mini App */}
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition cursor-pointer text-center"
            >
              ปิดหน้าต่าง
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
