import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import liff from '@line/liff';
import { message } from 'antd';
import { CoffeeOutlined } from '@ant-design/icons';

// --- ค่าคงที่ ---
const LIFF_ID = '2007232510-W1b9JQEX';
const MESSAGE_KEY = 'liff-status-message';

export default function Login() {
  const [status, setStatus] = useState({
    isInitializing: true, // เริ่มต้นด้วยสถานะกำลังโหลดเสมอ
    isLoggingIn: false,
    error: null
  });
  const navigate = useNavigate();

  // useEffect จะทำงานเพียงครั้งเดียวเมื่อ component โหลดขึ้นมา
  // เพื่อจัดการการ initialize LIFF และตรวจสอบสถานะ login ทั้งหมด
  useEffect(() => {
    // เพิ่ม Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });

        // ✅ จุดสำคัญ: ทำความสะอาด URL *หลังจาก* liff.init() ทำงานสำเร็จแล้ว
        // เพราะ liff.init() ต้องใช้ query parameters จาก URL ในการยืนยันตัวตนหลัง redirect กลับมา
        if (window.location.search) {
          const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
          window.history.replaceState(null, '', cleanUrl);
        }

        if (liff.isLoggedIn()) {
          // ถ้าล็อกอินแล้ว ให้ redirect ไปยังหน้าที่ต้องการทันที
          // ไม่ต้องรอให้ user กดปุ่มใดๆ
          message.success({ content: 'เข้าสู่ระบบสำเร็จ กำลังนำทาง...', key: MESSAGE_KEY });
          navigate('/login/userlogin');
          // เมื่อ redirect แล้ว component นี้จะถูก unmount ไม่ต้องทำอะไรต่อ
        } else {
          // ถ้ายังไม่ล็อกอิน ให้แสดงหน้า Login ปกติ
          setStatus(prev => ({ ...prev, isInitializing: false }));
        }
      } catch (err) {
        console.error('LIFF Initialization failed:', err);
        setStatus({
          isInitializing: false,
          isLoggingIn: false,
          error: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE'
        });
        message.error({ content: 'ไม่สามารถเชื่อมต่อกับ LINE ได้', key: MESSAGE_KEY });
      }
    };

    initializeLiff();
    
    // Cleanup function (optional)
    return () => {
        document.head.removeChild(link);
    };
  }, [navigate]); // Dependency คือ navigate เท่านั้น

  // ฟังก์ชันนี้มีหน้าที่เดียว คือส่ง user ไปหน้า Login ของ LINE
  const handleLogin = async () => {
    // ป้องกันการกดซ้ำ และแสดง feedback ให้ user
    setStatus(prev => ({ ...prev, isLoggingIn: true, error: null }));
    message.loading({ content: 'กำลังเชื่อมต่อกับ LINE...', key: MESSAGE_KEY });

    try {
      // liff.login() จะทำการ redirect ทั้งหน้าจอ
      // โค้ดที่อยู่หลังจากนี้จะไม่ถูกรันหากการ redirect สำเร็จ
      await liff.login();
    } catch (err) {
      console.error('LIFF Login error:', err);
      setStatus(prev => ({ ...prev, isLoggingIn: false, error: 'เข้าสู่ระบบไม่สำเร็จ' }));
      message.error({ content: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', key: MESSAGE_KEY });
    }
  };

  // --- ส่วน JSX สำหรับการแสดงผล (เหมือนเดิม) ---
  if (status.isInitializing) {
    // UI ขณะกำลังโหลด...
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#f5f5f5] font-['Kanit',sans-serif]">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#8d6e6390] backdrop-blur-md shadow-xl animate-pulse">
              <CoffeeOutlined className="text-white text-3xl animate-bounce" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#a1887f] rounded-full animate-ping"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#8d6e63] rounded-full animate-ping delay-300"></div>
          </div>
          <h2 className="text-2xl font-bold text-[#3e2723] mb-4 font-['Prompt',sans-serif]">DekCha</h2>
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#8d6e63] animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-[#a1887f] animate-bounce delay-100"></div>
            <div className="w-3 h-3 rounded-full bg-[#8d6e63] animate-bounce delay-200"></div>
          </div>
          <p className="text-[#5d4037] opacity-70 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // UI หน้า Login หลัก
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#f5f5f5] to-[#f0f0f0] font-['Kanit',sans-serif] px-4 py-8 relative">
      {/* ส่วน UI ที่เหลือเหมือนเดิมทั้งหมด... */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-[#8d6e6308] rounded-full blur-2xl"></div>
      <div className="absolute bottom-40 right-10 w-40 h-40 bg-[#a1887f08] rounded-full blur-2xl"></div>
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#8d6e6390] backdrop-blur-md shadow-2xl relative hover:scale-105 transition-transform duration-300">
          <CoffeeOutlined className="text-white text-4xl" />
          <div className="absolute inset-0 rounded-full bg-[#8d6e63] opacity-20 blur-lg animate-pulse"></div>
        </div>
        <h1 className="text-4xl font-bold mt-4 text-[#3e2723] font-['Prompt',sans-serif] drop-shadow-sm">DekCha</h1>
        <h2 className="text-lg text-[#8d6e63] font-['Prompt',sans-serif]">Mueang Tak</h2>
        <div className="w-16 h-1 mx-auto rounded-full bg-gradient-to-r from-[#a1887f] to-[#8d6e63] mt-2 shadow-sm" />
      </div>

      <div className="w-[92%] sm:w-[90%] md:max-w-sm lg:max-w-md relative z-10">
        <div className="rounded-3xl shadow-2xl p-6 sm:p-8 border border-[#8d6e6330] backdrop-blur-md bg-[#fff8e199] relative overflow-hidden hover:shadow-3xl transition-shadow duration-300">
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
              className={`w-full py-4 sm:py-5 px-6 sm:px-8 rounded-2xl font-medium text-white text-base sm:text-lg transition-all duration-300 relative overflow-hidden transform group ${
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
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {status.isLoggingIn ? (
                <div className="flex items-center justify-center space-x-4 relative z-10">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-medium">กำลังเชื่อมต่อ</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-4 relative z-10">
                  <span className="font-medium">เข้าสู่ระบบด้วย LINE</span>
                </div>
              )}
            </button>
            {/* ... ส่วน UI ที่เหลือ ... */}
          </div>
        </div>
      </div>
    </div>
  );
}