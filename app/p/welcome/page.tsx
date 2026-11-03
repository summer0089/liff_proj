"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";

// กำหนดโครงสร้างข้อมูลโปรไฟล์ของ LINE
interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export default function WelcomePage() {
  // สร้าง State สำหรับเก็บสถานะและข้อมูล
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // ดึงค่า LIFF ID จาก .env
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";

  useEffect(() => {
    // ฟังก์ชันเริ่มต้นการทำงานของ LIFF และดึงข้อมูลผู้ใช้
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

        // 3. ดึงข้อมูลโปรไฟล์ของผู้ใช้ (LINE ID, รูปโปรไฟล์, ชื่อ)
        const userProfile = await liff.getProfile();
        setProfile(userProfile);
      } catch (err) {
        console.error("LIFF Error:", err);
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
      } finally {
        setLoading(false);
      }
    }

    initializeLiff();
  }, [liffId]);

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

  // 1. หน้าต่างแสดงสถานะ "กำลังโหลดข้อมูล"
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูลผู้ใช้จาก LINE...</p>
        </div>
      </main>
    );
  }

  // 2. หน้าต่างแสดงเมื่อ "เกิดข้อผิดพลาด"
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-sm border border-red-100 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">ไม่สามารถเชื่อมต่อ LINE ได้</h2>
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl mb-4 font-mono text-left break-all">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </main>
    );
  }

  // 3. หน้าต่างแสดงผล "ข้อมูลโปรไฟล์และ LINE ID"
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        
        {/* ส่วนหัว (Header) */}
        <div className="bg-[#06C755] text-white p-6 text-center">
          <h1 className="text-lg font-bold">ข้อมูลผู้ใช้งาน LINE</h1>
          <p className="text-xs text-white/80 mt-1">LINE Mini App Welcome Page</p>
        </div>

        {/* ส่วนแสดงข้อมูลผู้ใช้ (Body) */}
        <div className="p-6 flex flex-col items-center">
          
          {/* รูป Profile */}
          <div className="mb-4">
            {profile?.pictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-white ring-2 ring-gray-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-2xl font-bold">
                {profile?.displayName?.charAt(0) || "U"}
              </div>
            )}
          </div>

          {/* ชื่อผู้ใช้ (Display Name) */}
          <h2 className="text-xl font-bold text-gray-800 text-center">
            {profile?.displayName}
          </h2>

          {/* ข้อความสถานะ (Status Message ถ้ามี) */}
          {profile?.statusMessage && (
            <p className="text-xs text-gray-500 text-center mt-1 mb-4 italic">
              &ldquo;{profile.statusMessage}&rdquo;
            </p>
          )}

          {/* กล่องแสดง LINE ID */}
          <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 my-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-gray-500">LINE User ID:</span>
              {copied && <span className="text-xs text-[#06C755] font-bold">คัดลอกแล้ว!</span>}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={profile?.userId || ""}
                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-gray-700 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyId}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-medium shrink-0 transition"
              >
                คัดลอก
              </button>
            </div>
          </div>

          {/* ปุ่มปิดหน้าต่าง */}
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition mt-2"
          >
            ปิดหน้าต่าง
          </button>

        </div>
      </div>
    </main>
  );
}
