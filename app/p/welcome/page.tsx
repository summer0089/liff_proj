"use client";

import { useEffect, useState, useCallback } from "react";

interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export default function WelcomePage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isInLineClient, setIsInLineClient] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

  const initLiff = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!liffId) {
      setLoading(false);
      return;
    }

    try {
      const liffModule = await import("@line/liff");
      const liff = liffModule.default;

      await liff.init({ liffId });

      setIsInLineClient(liff.isInClient());

      if (liff.isLoggedIn()) {
        setIsLoggedIn(true);
        const userProfile = await liff.getProfile();
        setProfile(userProfile);
      } else {
        setIsLoggedIn(false);
        // If opened inside LINE client, prompt login automatically
        if (liff.isInClient()) {
          liff.login();
        }
      }
    } catch (err) {
      console.error("LIFF Initialization failed:", err);
      setError(
        err instanceof Error ? err.message : "ไม่สามารถเชื่อมต่อ LINE LIFF ได้"
      );
    } finally {
      setLoading(false);
    }
  }, [liffId]);

  useEffect(() => {
    initLiff();
  }, [initLiff]);

  const handleLogin = async () => {
    try {
      const liffModule = await import("@line/liff");
      const liff = liffModule.default;
      if (!liff.isLoggedIn()) {
        liff.login();
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      const liffModule = await import("@line/liff");
      const liff = liffModule.default;
      if (liff.isLoggedIn()) {
        liff.logout();
        setIsLoggedIn(false);
        setProfile(null);
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleCloseLiff = async () => {
    try {
      const liffModule = await import("@line/liff");
      const liff = liffModule.default;
      if (liff.isInClient()) {
        liff.closeWindow();
      }
    } catch (err) {
      console.error("Close window failed:", err);
    }
  };

  const handleCopyLineId = () => {
    if (profile?.userId) {
      navigator.clipboard.writeText(profile.userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Mock data for previewing without LIFF ID during local development
  const handleMockPreview = () => {
    setProfile({
      userId: "U0123456789abcdef0123456789abcdef",
      displayName: "LINE Demo User",
      pictureUrl: "https://profile.line-scdn.net/0h6iHkZ8lqb153Fh1vKk1lFnJvbxM_bT57M3B7Y3MubxIkaSh2MyUpZXZ6OBZ1an4hNHYmOHZ_akJ4",
      statusMessage: "สวัสดี! กำลังทดสอบ LINE Mini App",
    });
    setIsLoggedIn(true);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-emerald-50 via-gray-50 to-white px-4 py-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-[#06C755] px-6 py-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-2 backdrop-blur-xs">
            <svg
              className="w-7 h-7 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.019 9.587.39.085.922.26 1.057.595.122.302.08.775.039 1.08-.061.447-.282 1.784-.403 2.571-.183 1.109.458 1.002 1.037.64 3.011-1.874 8.163-5.385 11.139-9.219 1.488-1.921 2.112-3.834 2.112-5.258" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">LINE Mini App</h1>
          <p className="text-xs text-white/80 mt-1">ยินดีต้อนรับเข้าสู่บริการ</p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {loading ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 font-medium">กำลังโหลดข้อมูลจาก LINE...</p>
            </div>
          ) : !liffId && !profile ? (
            /* Missing LIFF ID Configuration Guide */
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-sm">
                <div className="flex items-center space-x-2 font-semibold mb-1">
                  <svg className="w-5 h-5 text-amber-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>ยังไม่ได้ตั้งค่า NEXT_PUBLIC_LIFF_ID</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  กรุณากำหนดค่า <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">NEXT_PUBLIC_LIFF_ID</code> ในไฟล์ <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">.env</code> เพื่อเชื่อมต่อกับ LINE Developers Console
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleMockPreview}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>ดูตัวอย่างหน้าจอ (Mock Preview)</span>
                </button>
              </div>
            </div>
          ) : error ? (
            /* Error State */
            <div className="space-y-4 py-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800 text-sm">
                <div className="flex items-center space-x-2 font-semibold mb-1">
                  <svg className="w-5 h-5 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>เกิดข้อผิดพลาดในการโหลด LIFF</span>
                </div>
                <p className="text-xs text-red-700 leading-relaxed">{error}</p>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={initLiff}
                  className="flex-1 py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
                >
                  ลองใหม่อีกครั้ง
                </button>
                <button
                  type="button"
                  onClick={handleMockPreview}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-xs transition-colors cursor-pointer"
                >
                  ใช้ Mock Data
                </button>
              </div>
            </div>
          ) : !isLoggedIn && !profile ? (
            /* Not Logged In State (External Browser) */
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">ยังไม่ได้เข้าสู่ระบบ LINE</h2>
                <p className="text-xs text-gray-500 mt-1">กรุณาเข้าสู่ระบบเพื่อแสดงข้อมูลโปรไฟล์ของคุณ</p>
              </div>
              <button
                type="button"
                onClick={handleLogin}
                className="w-full py-3 px-4 bg-[#06C755] hover:bg-[#05b34c] text-white font-medium rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>เข้าสู่ระบบด้วย LINE</span>
              </button>
            </div>
          ) : profile ? (
            /* User Profile & Line ID Display */
            <div className="space-y-6">
              {/* Profile Image & Display Name */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3">
                  {profile.pictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.pictureUrl}
                      alt={profile.displayName}
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-100 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold ring-4 ring-emerald-50 shadow-md">
                      {profile.displayName?.charAt(0) || "U"}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-1 w-5 h-5 bg-[#06C755] border-2 border-white rounded-full flex items-center justify-center">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                  </span>
                </div>

                <h2 className="text-lg font-bold text-gray-900">{profile.displayName}</h2>
                {profile.statusMessage && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 max-w-xs italic">
                    &ldquo;{profile.statusMessage}&rdquo;
                  </p>
                )}

                <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{isInLineClient ? "เข้าใช้งานผ่าน LINE App" : "เข้าใช้งานผ่าน Web Browser"}</span>
                </div>
              </div>

              {/* LINE ID Section */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    <span>LINE User ID</span>
                  </span>
                  {copied && (
                    <span className="text-emerald-600 font-semibold text-[11px] animate-fade-in">
                      ✓ คัดลอกแล้ว
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-gray-200 shadow-2xs">
                  <span className="font-mono text-xs text-gray-800 truncate mr-2 select-all">
                    {profile.userId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLineId}
                    title="คัดลอก LINE User ID"
                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors shrink-0 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {isInLineClient ? (
                  <button
                    type="button"
                    onClick={handleCloseLiff}
                    className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>ปิดหน้าต่าง (Close)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 px-4 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 font-medium rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>ออกจากระบบ (Logout)</span>
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-gray-50/80 px-6 py-3 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400">LINE Front-end Framework (LIFF)</p>
        </div>
      </div>
    </main>
  );
}
