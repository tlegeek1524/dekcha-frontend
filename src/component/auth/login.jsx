// ส่วน import และ setup ยังเหมือนเดิม
import React, { useState, useEffect, useCallback } from 'react';
import liff from '@line/liff';
import { message } from 'antd';
import { CoffeeOutlined } from '@ant-design/icons';

const LIFF_ID = '2007232510-W1b9JQEX';
const LOGIN_MESSAGE_KEY = 'login-message';

export default function Login() {
  const [status, setStatus] = useState({
    isInitializing: true,
    isLoggingIn: false,
    error: null
  });

  const initializeLiff = useCallback(async () => {
    try {
      // ปรับปรุง URL cleanup - เอา query params ออกหมด
      const cleanUrl = window.location.origin + window.location.pathname;
      if (window.location.search || window.location.hash) {
        window.history.replaceState(null, '', cleanUrl);
      }

      // เพิ่ม timeout สำหรับ LIFF init
      const initPromise = liff.init({ liffId: LIFF_ID });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('LIFF initialization timeout')), 10000)
      );

      await Promise.race([initPromise, timeoutPromise]);

      // ตรวจสอบสถานะการ login
      if (liff.isLoggedIn() && liff.getAccessToken()) {
        // ใช้ setTimeout เพื่อให้ UI render เสร็จก่อน
        setTimeout(() => {
          // ใช้ href แทน replace เพื่อให้ browser navigate อย่างถูกต้อง
          window.location.href = window.location.origin + '/login/userlogin';
        }, 100);
        return;
      }
    } catch (err) {
      console.error('LIFF init failed:', err.toString(), err);
      let errorMessage = 'ไม่สามารถเริ่มต้น LIFF ได้';
      
      // ให้ข้อมูล error ที่ชัดเจนขึ้น
      if (err.message.includes('timeout')) {
        errorMessage = 'การเชื่อมต่อ LIFF ใช้เวลานานเกินไป';
      } else if (err.message.includes('network')) {
        errorMessage = 'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      }
      
      setStatus(prev => ({ ...prev, error: errorMessage }));
      message.error('เกิดข้อผิดพลาดในการโหลด ระบบ LIFF');
    } finally {
      setStatus(prev => ({ ...prev, isInitializing: false }));
    }
  }, []);

  useEffect(() => {
    // Preload fonts สำหรับ performance
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&display=swap';
    link.rel = 'preload';
    link.as = 'style';
    link.onload = () => {
      link.rel = 'stylesheet';
    };
    document.head.appendChild(link);
    
    initializeLiff();
    
    // Cleanup function
    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [initializeLiff]);

  const handleLogin = async () => {
    setStatus(prev => ({ ...prev, isLoggingIn: true, error: null }));
    message.loading({ content: 'กำลังเชื่อมต่อกับ LINE...', key: LOGIN_MESSAGE_KEY });
    
    try {
      // ตรวจสอบว่าอยู่ใน LINE app หรือไม่
      const isInLineApp = liff.isInClient();
      
      if (isInLineApp) {
        // ถ้าอยู่ใน LINE app ให้ login แบบปกติ
        await liff.login();
      } else {
        // ถ้าไม่ได้อยู่ใน LINE app ให้ redirect ไป LIFF URL
        const liffUrl = `https://liff.line.me/${LIFF_ID}`;
        window.location.href = liffUrl;
      }
      
      message.success({ content: 'เข้าสู่ระบบสำเร็จ', key: LOGIN_MESSAGE_KEY });
      
    } catch (err) {
      console.error('LIFF login error:', err.toString(), err);
      
      let errorMessage = 'เข้าสู่ระบบไม่สำเร็จ';
      
      // จัดการ error ที่เฉพาะเจาะจงขึ้น
      if (err.message.includes('user_cancel')) {
        errorMessage = 'การเข้าสู่ระบบถูกยกเลิก';
      } else if (err.message.includes('network')) {
        errorMessage = 'ปัญหาการเชื่อมต่อเครือข่าย';
      }
      
      message.error({ content: errorMessage, key: LOGIN_MESSAGE_KEY });
      setStatus(prev => ({ ...prev, isLoggingIn: false, error: errorMessage }));
    }
  };

  // เพิ่ม retry function สำหรับกรณี error
  const handleRetry = () => {
    setStatus({
      isInitializing: true,
      isLoggingIn: false,
      error: null
    });
    initializeLiff();
  };

  if (status.isInitializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#f5f5f5] font-['Kanit',sans-serif]">
        <div className="text-center">
          {/* Loading Icon */}
          <div className="relative mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#8d6e6390] backdrop-blur-md shadow-xl animate-pulse">
              <CoffeeOutlined className="text-white text-3xl animate-bounce" />
            </div>
            {/* Small floating dots */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#a1887f] rounded-full animate-ping"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#8d6e63] rounded-full animate-ping delay-300"></div>
          </div>
          
          <h2 className="text-2xl font-bold text-[#3e2723] mb-4 font-['Prompt',sans-serif]">DekCha</h2>
          
          {/* Enhanced Loading Animation */}
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#8d6e63] animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-[#a1887f] animate-bounce delay-100"></div>
            <div className="w-3 h-3 rounded-full bg-[#8d6e63] animate-bounce delay-200"></div>
          </div>
          
          <p className="text-[#5d4037] opacity-70 text-sm">กำลังเชื่อมต่อ LIFF...</p>
        </div>
      </div>
    );
  }

  // แสดง error state พร้อม retry button
  if (status.error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#f5f5f5] to-[#f0f0f0] font-['Kanit',sans-serif] px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-4">
            <span className="text-red-500 text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-[#3e2723] mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-[#5d4037] mb-4">{status.error}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 rounded-lg bg-[#8d6e63] text-white font-medium hover:bg-[#6d4c41] transition-colors"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#f5f5f5] to-[#f0f0f0] font-['Kanit',sans-serif] px-4 py-8 relative">
      {/* Subtle background decorations */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-[#8d6e6308] rounded-full blur-2xl"></div>
      <div className="absolute bottom-40 right-10 w-40 h-40 bg-[#a1887f08] rounded-full blur-2xl"></div>
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#8d6e6390] backdrop-blur-md shadow-2xl relative hover:scale-105 transition-transform duration-300">
          <CoffeeOutlined className="text-white text-4xl" />
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-full bg-[#8d6e63] opacity-20 blur-lg animate-pulse"></div>
        </div>
        <h1 className="text-4xl font-bold mt-4 text-[#3e2723] font-['Prompt',sans-serif] drop-shadow-sm">DekCha</h1>
        <h2 className="text-lg text-[#8d6e63] font-['Prompt',sans-serif]">Mueang Tak</h2>
        <div className="w-16 h-1 mx-auto rounded-full bg-gradient-to-r from-[#a1887f] to-[#8d6e63] mt-2 shadow-sm" />
      </div>

      {/* 💡 การ์ด login แบบ responsive */}
      <div className="w-[92%] sm:w-[90%] md:max-w-sm lg:max-w-md relative z-10">
        <div className="rounded-3xl shadow-2xl p-6 sm:p-8 border border-[#8d6e6330] backdrop-blur-md bg-[#fff8e199] relative overflow-hidden hover:shadow-3xl transition-shadow duration-300">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#ffffff20] to-transparent pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-2 text-[#3e2723] font-['Prompt',sans-serif] drop-shadow-sm">
                ยินดีต้อนรับ
              </h3>
              <p className="text-sm sm:text-base text-[#5d4037] opacity-80 font-light leading-relaxed">
                กรุณาเข้าสู่ระบบด้วย LINE เพื่อเริ่มต้นใช้งาน
              </p>
            </div>

            <button
              onClick={handleLogin}
              disabled={status.isLoggingIn}
              className={`w-full py-4 sm:py-5 px-6 sm:px-8 rounded-2xl font-medium text-white text-base sm:text-lg transition-all duration-300 relative overflow-hidden transform ${
                status.isLoggingIn ? 'cursor-not-allowed opacity-70' : 'hover:shadow-2xl hover:-translate-y-0.5 active:scale-95'
              }`}
              style={{
                background: status.isLoggingIn 
                  ? 'linear-gradient(135deg, #a1887f, #8d6e63)' 
                  : 'linear-gradient(135deg, #8d6e63, #6d4c41)',
                boxShadow: '0 20px 40px -10px rgba(141, 110, 99, 0.3)',
                fontFamily: 'Kanit, sans-serif',
              }}
              aria-label="เข้าสู่ระบบด้วย LINE"
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700"></div>
              
              {status.isLoggingIn ? (
                <div className="flex items-center justify-center space-x-4 relative z-10">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-white animate-bounce"></div>
                    <div className="w-3 h-3 rounded-full bg-white animate-bounce delay-100"></div>
                    <div className="w-3 h-3 rounded-full bg-white animate-bounce delay-200"></div>
                  </div>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-medium">กำลังเชื่อมต่อ</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-4 relative z-10">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#ffffff20] backdrop-blur-sm transition-all duration-300 group-hover:bg-[#ffffff30]">
                    <span className="font-bold text-base">L</span>
                  </div>
                  <span className="font-medium">เข้าสู่ระบบด้วย LINE</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#ffffff20] backdrop-blur-sm transition-all duration-300 group-hover:bg-[#ffffff30] group-hover:translate-x-1">
                    <span className="text-base">→</span>
                  </div>
                </div>
              )}
            </button>

            <div className="mt-8 text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="h-px flex-1 opacity-20 bg-gradient-to-r from-transparent via-[#8d6e63] to-transparent" />
                <span className="text-xs opacity-60 text-[#5d4037] font-light px-3 py-1 rounded-full bg-[#ffffff30] backdrop-blur-sm">หรือ</span>
                <div className="h-px flex-1 opacity-20 bg-gradient-to-r from-transparent via-[#8d6e63] to-transparent" />
              </div>
              
              {/* Enhanced feature indicators */}
              <div className="flex justify-center space-x-3 mt-4">
                <span className="text-xs text-[#5d4037] opacity-60 font-light px-3 py-1 rounded-full bg-[#ffffff40] backdrop-blur-sm border border-[#8d6e6320] hover:opacity-80 transition-opacity">ใช้งานง่าย</span>
                <span className="text-xs text-[#5d4037] opacity-60 font-light px-3 py-1 rounded-full bg-[#ffffff40] backdrop-blur-sm border border-[#8d6e6320] hover:opacity-80 transition-opacity">ปลอดภัย</span>
                <span className="text-xs text-[#5d4037] opacity-60 font-light px-3 py-1 rounded-full bg-[#ffffff40] backdrop-blur-sm border border-[#8d6e6320] hover:opacity-80 transition-opacity">รวดเร็ว</span>
              </div>
              
              {/* เพิ่มข้อมูลช่วยเหลือสำหรับผู้ใช้ */}
              <div className="mt-6 p-4 rounded-xl bg-[#ffffff50] backdrop-blur-sm border border-[#8d6e6320]">
                <p className="text-xs text-[#5d4037] opacity-70 font-light leading-relaxed">
                  💡 <strong>เคล็ดลับ:</strong> หากใช้งานในมือถือ กรุณาเปิดผ่าน LINE App เพื่อประสบการณ์การใช้งานที่ดีที่สุด
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs opacity-50 text-[#5d4037] font-light">
            Powered by LINE Login • DekCha Tea 2024
          </p>
          <p className="text-xs opacity-40 text-[#5d4037] font-light mt-1">
            LIFF ID: {LIFF_ID}
          </p>
        </div>
      </div>
    </div>
  );
}