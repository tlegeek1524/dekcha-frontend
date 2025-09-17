// ส่วน import และ setup ยังเหมือนเดิม
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const initializeLiff = useCallback(async () => {
    try {
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      if (window.location.search) {
        window.history.replaceState(null, '', cleanUrl);
      }

      // ✅ ใช้ withLoginOnExternalBrowser เพื่อกัน popup ใน LINE Browser
      await liff.init({ liffId: LIFF_ID, withLoginOnExternalBrowser: true });

      // ถ้า login แล้วและมี token → ไปหน้า userlogin เลย
      if (liff.isLoggedIn() && (liff.getIDToken() || liff.getAccessToken())) {
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
    const link = document.createElement('link');
    link.href =
      'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    initializeLiff();
  }, [initializeLiff]);

  const handleLogin = async () => {
    setStatus(prev => ({ ...prev, isLoggingIn: true, error: null }));
    message.loading({ content: 'กำลังเชื่อมต่อกับ LINE...', key: LOGIN_MESSAGE_KEY });
    try {
      // ✅ ไม่ให้ popup เด้งถ้าเปิดจาก LINE App
      if (!liff.isInClient()) {
        // เปิดจาก browser นอก LINE → ต้อง login
        await liff.login();
      } else {
        // เปิดใน LINE app → ใช้ token ที่มีอยู่ได้เลย
        const token = liff.getIDToken() || liff.getAccessToken();
        if (token) {
          navigate('/login/userlogin');
        } else {
          throw new Error('No token from LINE');
        }
      }
    } catch (err) {
      console.error('LIFF login error:', err.toString(), err);
      message.error({ content: 'เข้าสู่ระบบไม่สำเร็จ', key: LOGIN_MESSAGE_KEY });
      setStatus(prev => ({ ...prev, isLoggingIn: false, error: 'เข้าสู่ระบบไม่สำเร็จ' }));
    }
  };

  if (status.isInitializing) {
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

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#f5f5f5] to-[#f0f0f0] font-['Kanit',sans-serif] px-4 py-8 relative">
      {/* ... UI ส่วนอื่นเหมือนเดิม ... */}
      <button
        onClick={handleLogin}
        disabled={status.isLoggingIn}
        className="w-full py-4 px-6 rounded-2xl font-medium text-white text-lg"
        style={{
          background: 'linear-gradient(135deg, #8d6e63, #6d4c41)',
          fontFamily: 'Kanit, sans-serif',
        }}
      >
        เข้าสู่ระบบด้วย LINE
      </button>
    </div>
  );
}
