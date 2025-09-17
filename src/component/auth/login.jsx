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
      await liff.init({ liffId: LIFF_ID });

      // เช็คว่าผู้ใช้ล็อกอินแล้วหรือยัง
      if (liff.isLoggedIn()) {
        message.loading({ content: 'กำลังโหลดข้อมูล LINE...', key: LOGIN_MESSAGE_KEY });
        
        // โหลดข้อมูลผู้ใช้จาก LIFF
        try {
          const profile = await liff.getProfile(); // ดึงข้อมูล LINE user
          console.log('LIFF profile:', profile);

          // หลังโหลดเสร็จแล้ว redirect
          message.success({ content: 'เข้าสู่ระบบสำเร็จ กำลังนำทาง...', key: LOGIN_MESSAGE_KEY });
          navigate('/login/userlogin');
        } catch (profileErr) {
          console.error('Error fetching profile:', profileErr);
          setStatus(prev => ({ ...prev, error: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' }));
          message.error({ content: 'โหลดข้อมูลผู้ใช้ไม่สำเร็จ', key: LOGIN_MESSAGE_KEY });
        }
      } else {
        // ยังไม่ล็อกอิน
        setStatus(prev => ({ ...prev, isInitializing: false }));
      }
    } catch (err) {
      console.error('LIFF init failed:', err);
      setStatus(prev => ({ ...prev, error: 'ไม่สามารถเริ่มต้น LIFF ได้' }));
      message.error({ content: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE', key: LOGIN_MESSAGE_KEY });
    }
  }, [navigate]);

  useEffect(() => {
    initializeLiff();
  }, [initializeLiff]);

  const handleLogin = async () => {
    setStatus(prev => ({ ...prev, isLoggingIn: true, error: null }));
    message.loading({ content: 'กำลังเชื่อมต่อกับ LINE...', key: LOGIN_MESSAGE_KEY });

    try {
      await liff.login(); 
      // หลัง login LIFF จะ redirect กลับมาที่หน้าเดิม
      // ซึ่ง useEffect จะตรวจสอบสถานะและโหลด profile ต่อ
    } catch (err) {
      console.error('LIFF login error:', err);
      setStatus(prev => ({ ...prev, isLoggingIn: false, error: 'เข้าสู่ระบบไม่สำเร็จ' }));
      message.error({ content: 'เข้าสู่ระบบไม่สำเร็จ', key: LOGIN_MESSAGE_KEY });
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
          </div>
          <h2 className="text-2xl font-bold text-[#3e2723] mb-4 font-['Prompt',sans-serif]">DekCha</h2>
          <p className="text-[#5d4037] opacity-70 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f5f5f5] to-[#f0f0f0] font-['Kanit',sans-serif]">
      <h1 className="text-4xl font-bold mb-4">DekCha</h1>
      <button
        onClick={handleLogin}
        disabled={status.isLoggingIn}
        className="px-6 py-4 bg-[#8d6e63] text-white rounded-2xl"
      >
        {status.isLoggingIn ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย LINE'}
      </button>
      {status.error && <p className="text-red-600 mt-4">{status.error}</p>}
    </div>
  );
}
