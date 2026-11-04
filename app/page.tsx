"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface SlideData {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  icon: (color: string) => React.ReactNode;
}

const slides: SlideData[] = [
  {
    id: 1,
    badge: "LINE CONNECT",
    title: "ยินดีต้อนรับสู่",
    subtitle: "LINE LIFF Member Portal",
    description:
      "เข้าสู่ระบบสะดวก ปลอดภัย ผ่านบัญชี LINE โดยตรง ไม่ต้องจำรหัสผ่าน พร้อมเชื่อมต่อทุกบริการได้ทันทีในที่เดียว",
    icon: () => (
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#06C755] to-[#25D366] text-white flex items-center justify-center shadow-lg shadow-[#06C755]/30">
        <svg
          className="w-14 h-14 sm:w-16 sm:h-16"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 5.92 2 10.75c0 2.97 1.69 5.59 4.29 7.15-.19.67-.68 2.45-.78 2.82-.12.46.17.45.36.33.15-.09 2.06-1.39 2.88-1.95.41.07.83.1 1.25.1 5.52 0 10-3.92 10-8.75S17.52 2 12 2zm-4.7 10.45h-1.5c-.3 0-.55-.25-.55-.55v-4.1c0-.3.25-.55.55-.55s.55.25.55.55v3.55h1c.3 0 .55.25.55.55s-.25.55-.55.55zm2.75 0h-.55c-.3 0-.55-.25-.55-.55v-4.1c0-.3.25-.55.55-.55s.55.25.55.55v4.1c0 .3-.25.55-.55.55zm3.9-.55c0 .3-.25.55-.55.55h-1.8c-.3 0-.55-.25-.55-.55v-4.1c0-.3.25-.55.55-.55h1.8c.3 0 .55.25.55.55s-.25.55-.55.55h-1.25v.95h1.25c.3 0 .55.25.55.55s-.25.55-.55.55h-1.25v1.5h1.25c.3 0 .55.25.55.55zm3.85 0c0 .3-.25.55-.55.55h-1.8c-.3 0-.55-.25-.55-.55v-4.1c0-.3.25-.55.55-.55h1.8c.3 0 .55.25.55.55s-.25.55-.55.55h-1.25v.95h1.25c.3 0 .55.25.55.55s-.25.55-.55.55h-1.25v1.5h1.25c.3 0 .55.25.55.55z" />
        </svg>
      </div>
    ),
  },
  {
    id: 2,
    badge: "EASY REGISTER",
    title: "สมัครง่าย รวดเร็ว",
    subtitle: "ลงทะเบียนสมาชิกในคลิกเดียว",
    description:
      "ดึงข้อมูลชื่อและรูปโปรไฟล์จาก LINE ให้อัตโนมัติ กรอกเพียงเบอร์โทรศัพท์และอีเมล พร้อมใช้งานระบบสมาชิกได้ทันที",
    icon: () => (
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-emerald-500 to-[#06C755] text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
        <svg
          className="w-12 h-12 sm:w-14 sm:h-14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.375 21c-2.331 0-4.512-.645-6.375-1.765z"
          />
        </svg>
      </div>
    ),
  },
  {
    id: 3,
    badge: "PROFILE & SETTINGS",
    title: "จัดการข้อมูลส่วนตัว",
    subtitle: "อัปเดตข้อมูลได้ตลอด 24 ชม.",
    description:
      "ตรวจสอบสิทธิ์และสถานะสมาชิก แก้ไขข้อมูลติดต่อ พร้อมฟังก์ชันซิงก์รูปโปรไฟล์ล่าสุดจาก LINE ได้อย่างง่ายดาย",
    icon: () => (
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#06C755] to-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
        <svg
          className="w-12 h-12 sm:w-14 sm:h-14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.6 6.6 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.241.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
    ),
  },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // เลื่อนสไลด์อัตโนมัติทุก 5 วินาที
  useEffect(() => {
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide]);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5000);
  };

  // รองรับการปัดหน้าจอ (Swipe Gesture บนมือถือ)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
      resetTimer();
    } else if (isRightSwipe) {
      prevSlide();
      resetTimer();
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#F7F8F9] text-gray-800 p-4 sm:p-6 selection:bg-[#06C755]/20">
      {/* Header Bar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#06C755] text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-[#06C755]/30">
            L
          </div>
          <span className="font-bold text-gray-900 tracking-tight text-base">
            LIFF Member
          </span>
        </div>

        <Link
          href="/p/welcome"
          className="text-xs font-semibold text-[#06C755] hover:text-[#05b34c] bg-[#06C755]/10 px-3 py-1.5 rounded-full transition"
        >
          เข้าสู่ระบบ
        </Link>
      </header>

      {/* Slide Container Card */}
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center my-auto">
        <div
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-200/60 border border-gray-100 flex flex-col items-center text-center relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Badge */}
          <div className="mb-6">
            <span className="text-[11px] font-bold text-[#06C755] bg-emerald-50 border border-emerald-200/80 px-3.5 py-1 rounded-full uppercase tracking-wider">
              {slides[currentSlide].badge}
            </span>
          </div>

          {/* Icon Preview with subtle pulse animation */}
          <div className="mb-6 transform transition-transform duration-500 hover:scale-105">
            {slides[currentSlide].icon("#06C755")}
          </div>

          {/* Titles & Content */}
          <div className="space-y-2 mb-6 min-h-[140px] flex flex-col justify-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
              {slides[currentSlide].title}
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {slides[currentSlide].subtitle}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xs mx-auto pt-1">
              {slides[currentSlide].description}
            </p>
          </div>

          {/* Pagination Indicators (Dots) */}
          <div className="flex items-center gap-2 mb-6">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => {
                  setCurrentSlide(index);
                  resetTimer();
                }}
                aria-label={`Slide ${index + 1}`}
                className={`transition-all duration-300 rounded-full h-2 ${
                  currentSlide === index
                    ? "w-7 bg-[#06C755]"
                    : "w-2 bg-gray-200 hover:bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Navigation Controls (Prev / Next Buttons) */}
          <div className="flex items-center justify-between w-full pt-2 border-t border-gray-100 text-xs">
            <button
              type="button"
              onClick={() => {
                prevSlide();
                resetTimer();
              }}
              className="text-gray-400 hover:text-gray-700 font-medium px-2 py-1 transition flex items-center gap-1 cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
              <span>ย้อนกลับ</span>
            </button>

            <span className="text-[11px] text-gray-400 font-mono">
              {currentSlide + 1} / {slides.length}
            </span>

            <button
              type="button"
              onClick={() => {
                nextSlide();
                resetTimer();
              }}
              className="text-[#06C755] hover:text-[#05b34c] font-semibold px-2 py-1 transition flex items-center gap-1 cursor-pointer"
            >
              <span>ถัดไป</span>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons & Links */}
      <footer className="max-w-md w-full mx-auto pt-4 pb-2 space-y-2.5">
        <Link
          href="/p/welcome"
          className="w-full py-3.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-2xl text-center text-sm transition shadow-lg shadow-[#06C755]/25 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>เริ่มต้นใช้งาน (Welcome)</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Link
            href="/u/register"
            className="py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold rounded-xl text-center transition shadow-sm"
          >
            ลงทะเบียนสมาชิก
          </Link>
          <Link
            href="/u/profile"
            className="py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold rounded-xl text-center transition shadow-sm"
          >
            แก้ไขข้อมูลส่วนตัว
          </Link>
        </div>

        <p className="text-center text-[11px] text-gray-400 pt-2">
          เชื่อมต่อกับ LINE Official Account & LIFF Mini App
        </p>
      </footer>
    </main>
  );
}
