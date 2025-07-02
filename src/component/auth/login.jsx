import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import liff from '@line/liff';
import { message } from 'antd';
import { LoadingOutlined, CoffeeOutlined } from '@ant-design/icons';
import '../css/Login.css'; // ปรับให้ตรงกับโฟลเดอร์ที่เก็บไฟล์ CSS

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
      <div className="container">
        <div className="loading-text">กำลังโหลดระบบ...</div>
        <LoadingOutlined style={{ fontSize: '2rem', marginTop: '1rem' }} />
      </div>
    );
  }

  if (status.error && !status.isLoggingIn) {
    return (
      <div className="container">
        <div className="login-box error-container">
          <div className="error-message">{status.error}</div>
          <button className="retry-button" onClick={initializeLiff}>
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="logo"><CoffeeOutlined className="logo-icon" /></div>
      <h1 className="title">DeKcha Tea</h1>
      <p className="subtitle">กรุณาเข้าสู่ระบบด้วย LINE เพื่อดำเนินการต่อ</p>
      <div className="login-box">
        <button
          className="login-button"
          onClick={handleLogin}
          disabled={status.isLoggingIn}
          aria-label="เข้าสู่ระบบด้วย LINE"
        >
          {status.isLoggingIn ? (
            <><LoadingOutlined className="button-loading-icon" /><span>กำลังเชื่อมต่อ...</span></>
          ) : (
            'เข้าสู่ระบบด้วย LINE'
          )}
        </button>
      </div>
    </div>
  );
}
