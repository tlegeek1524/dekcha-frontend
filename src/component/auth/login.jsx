import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import liff from '@line/liff';
import { message } from 'antd';
import { LoadingOutlined, CoffeeOutlined } from '@ant-design/icons';

const LIFF_ID = '2007232510-W1b9JQEX';
const LOGIN_MESSAGE_KEY = 'login-message';

export default function Login() {
  const [status, setStatus] = useState({
    isInitializing: true,
    isLoggingIn: false,
    error: null
  });
  const navigate = useNavigate();

  const initializeLiff = useCallback(async () => {
    try {
      // ทำ URL ให้สะอาด ลบ code/state
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      if (window.location.search) {
        window.history.replaceState(null, '', cleanUrl);
      }

      // เริ่มต้น LIFF SDK
      await liff.init({ liffId: LIFF_ID });

      // ถ้ามี AccessToken อยู่แล้ว ถือว่า Logged in
      if (liff.isLoggedIn() && liff.getAccessToken()) {
        navigate('/login/userlogin');
        return;
      }
    } catch (err) {
      console.error('LIFF init failed:', err.toString(), err);
      setStatus(prev => ({ ...prev, error: 'ไม่สามารถเริ่มต้น LIFF ได้' }));
      message.error('เกิดข้อผิดพลาดในการโหลด ระบบ LIFF');
    } finally {
      setStatus(prev => ({ ...prev, isInitializing: false }));
    }
  }, [navigate]);

  useEffect(() => {
    // เพิ่ม Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    initializeLiff();
  }, [initializeLiff]);

  const handleLogin = async () => {
    setStatus(prev => ({ ...prev, isLoggingIn: true, error: null }));
    message.loading({ content: 'กำลังเชื่อมต่อกับ LINE...', key: LOGIN_MESSAGE_KEY });
    try {
      // ใช้ค่า default redirectUri จาก LIFF channel
      await liff.login();
    } catch (err) {
      console.error('LIFF login error:', err.toString(), err);
      message.error({ content: 'เข้าสู่ระบบไม่สำเร็จ', key: LOGIN_MESSAGE_KEY });
      setStatus(prev => ({ ...prev, isLoggingIn: false, error: 'เข้าสู่ระบบไม่สำเร็จ' }));
    }
  };

  if (status.isInitializing) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#f5f5f5', fontFamily: 'Kanit, sans-serif' }}>
        {/* Mobile-first animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-24 h-24 rounded-full animate-pulse" style={{ backgroundColor: '#8d6e63' }}></div>
          <div className="absolute bottom-1/3 right-1/4 w-16 h-16 rounded-full animate-pulse" style={{ backgroundColor: '#a1887f', animationDelay: '1s' }}></div>
        </div>
        
        <div className="text-center px-6 relative z-10">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full mx-auto backdrop-blur-md shadow-2xl flex items-center justify-center" style={{ backgroundColor: '#8d6e6390' }}>
              <CoffeeOutlined className="text-white text-4xl" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full animate-pulse" style={{ backgroundColor: '#a1887f' }}></div>
          </div>
          
          <h1 className="text-2xl font-bold mb-4 tracking-wide" style={{ color: '#3e2723' }}>DeKcha Tea</h1>
          <div className="text-lg font-light mb-8 tracking-wide" style={{ color: '#5d4037' }}>กำลังเตรียมระบบ</div>
          
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#8d6e63', animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#a1887f', animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: '#5d4037', animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (status.error && !status.isLoggingIn) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4" style={{ backgroundColor: '#f5f5f5', fontFamily: 'Kanit, sans-serif' }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-24 h-24 rounded-full animate-pulse" style={{ backgroundColor: '#8d6e63' }}></div>
          <div className="absolute bottom-1/3 right-1/4 w-16 h-16 rounded-full animate-pulse" style={{ backgroundColor: '#a1887f', animationDelay: '1s' }}></div>
        </div>
        
        <div className="w-full max-w-sm mx-auto relative z-10">
          <div className="backdrop-blur-md rounded-3xl shadow-2xl p-8 text-center border" style={{ backgroundColor: '#fff8e199', borderColor: '#8d6e6330' }}>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8d6e6320' }}>
              <CoffeeOutlined className="text-3xl" style={{ color: '#8d6e63' }} />
            </div>
            <div className="text-lg font-medium mb-8" style={{ color: '#3e2723' }}>{status.error}</div>
            <button 
              className="w-full py-4 px-8 rounded-2xl font-medium text-white transition-all duration-300 hover:shadow-xl transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: '#8d6e63', boxShadow: '0 10px 25px -5px rgba(141, 110, 99, 0.3)' }}
              onClick={initializeLiff}
            >
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#f5f5f5', fontFamily: 'Kanit, sans-serif' }}>
      {/* Mobile-optimized background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br opacity-20" style={{ 
          background: 'radial-gradient(circle at 30% 20%, #8d6e63 0%, transparent 50%), radial-gradient(circle at 70% 80%, #a1887f 0%, transparent 50%)'
        }}></div>
        
        {/* Floating elements optimized for mobile */}
        <div className="absolute top-16 left-8 w-16 h-16 rounded-full opacity-10 animate-pulse" style={{ backgroundColor: '#8d6e63' }}></div>
        <div className="absolute bottom-32 right-8 w-12 h-12 rounded-full opacity-10 animate-pulse" style={{ backgroundColor: '#a1887f', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-8 h-8 rounded-full opacity-10 animate-pulse" style={{ backgroundColor: '#5d4037', animationDelay: '2s' }}></div>
      </div>

      <div className="flex flex-col min-h-screen relative z-10">
        {/* Header Section - ปรับให้เล็กลง */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 max-h-[45vh]">
          <div className="text-center max-w-sm mx-auto">
            {/* Logo */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full backdrop-blur-md shadow-2xl relative" style={{ backgroundColor: '#8d6e6390' }}>
                <CoffeeOutlined className="text-white text-5xl" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full animate-pulse" style={{ backgroundColor: '#a1887f' }}></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full animate-pulse" style={{ backgroundColor: '#5d4037', animationDelay: '1s' }}></div>
              </div>
            </div>
            
            {/* Brand - ใช้ font Prompt สำหรับหัวข้อ */}
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight leading-tight" style={{ color: '#3e2723', fontFamily: 'Prompt, sans-serif' }}>
              DekCha
            </h1>
            <h2 className="text-xl md:text-2xl font-light mb-4" style={{ color: '#8d6e63', fontFamily: 'Prompt, sans-serif' }}>
              Mueang Tak
            </h2>
            
            <div className="w-16 h-1 mx-auto rounded-full" style={{ backgroundColor: '#a1887f' }}></div>
          </div>
        </div>

        {/* Login Section - ปรับให้ขึ้นมาชิดข้างบนมากขึ้น */}
        <div className="px-6 pb-8 flex-1 flex items-start justify-center pt-4">
          <div className="max-w-sm mx-auto w-full">
            {/* Login Card */}
            <div className="backdrop-blur-md rounded-3xl shadow-2xl p-8 mb-6 border" style={{ backgroundColor: '#fff8e199', borderColor: '#8d6e6330' }}>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2" style={{ color: '#3e2723', fontFamily: 'Prompt, sans-serif' }}>
                  ยินดีต้อนรับ
                </h3>
                <p className="text-sm opacity-80 leading-relaxed" style={{ color: '#5d4037', fontWeight: '300' }}>
                  กรุณาเข้าสู่ระบบด้วย LINE เพื่อเริ่มต้นใช้งาน
                </p>
              </div>

              {/* Login Button - Optimized for mobile */}
              <button
                className={`w-full py-5 px-8 rounded-2xl font-medium text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 relative overflow-hidden group text-lg ${
                  status.isLoggingIn
                    ? 'cursor-not-allowed opacity-70'
                    : 'hover:shadow-2xl transform active:scale-95 touch-manipulation'
                }`}
                style={{ 
                  backgroundColor: status.isLoggingIn ? '#a1887f' : '#8d6e63',
                  boxShadow: '0 20px 40px -10px rgba(141, 110, 99, 0.3)',
                  minHeight: '60px',
                  fontFamily: 'Kanit, sans-serif',
                  fontWeight: '500'
                }}
                onClick={handleLogin}
                disabled={status.isLoggingIn}
                aria-label="เข้าสู่ระบบด้วย LINE"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500 transform -skew-x-12 -translate-x-full group-hover:translate-x-full"></div>
                
                {status.isLoggingIn ? (
                  <div className="flex items-center justify-center space-x-4 relative z-10">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-white animate-bounce"></div>
                      <div className="w-3 h-3 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-3 h-3 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="font-medium">กำลังเชื่อมต่อ</span>
                  </div>
                ) : (
                  <div className="relative z-10 flex items-center justify-center space-x-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ffffff20' }}>
                      <span className="font-bold text-base">L</span>
                    </div>
                    <span className="font-medium">เข้าสู่ระบบด้วย LINE</span>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300" style={{ backgroundColor: '#ffffff20' }}>
                      <span className="text-base">→</span>
                    </div>
                  </div>
                )}
              </button>

              {/* Alternative section */}
              <div className="mt-8 text-center">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="h-px flex-1 opacity-20" style={{ backgroundColor: '#8d6e63' }}></div>
                  <span className="text-xs opacity-60" style={{ color: '#5d4037', fontWeight: '300' }}>หรือ</span>
                  <div className="h-px flex-1 opacity-20" style={{ backgroundColor: '#8d6e63' }}></div>
                </div>
                
                <div className="text-sm opacity-60 leading-relaxed" style={{ color: '#5d4037', fontWeight: '300' }}>
                  ใช้งานง่าย • ปลอดภัย • รวดเร็ว
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs opacity-50 leading-relaxed" style={{ color: '#5d4037', fontWeight: '300' }}>
                Powered by LINE Login • DeKcha Tea 2024
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}