import React, { useState, useEffect, useCallback } from 'react';
import liff from '@line/liff';
import DOMPurify from 'dompurify';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie'; // เพิ่มไลบรารี js-cookie
import '../css/UserProfile.css';

// อ่านค่า LIFF_ID และ API_URL จาก .env (Vite)
const LIFF_ID = import.meta.env.VITE_LIFF_ID;
const API_URL = import.meta.env.VITE_API_URL;

// Component สำหรับแสดงข้อผิดพลาด
const ErrorMessage = ({ message = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", autoRefresh = false }) => {
  const [countdown, setCountdown] = useState(5);
  
  useEffect(() => {
    if (autoRefresh) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 5000);
      
      const interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [autoRefresh]);
  
  return (
    <div className="error-container">
      <div className="error-card">
        <div className="error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div className="error-message">{message}</div>
        
        {autoRefresh ? (
          <div className="refresh-countdown">
            <span>กำลังรีเฟรชในอีก {countdown} วินาที</span>
            <div className="refresh-spinner">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => window.location.reload()}
            className="refresh-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"></path>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            <span>รีเฟรชหน้านี้</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Component สำหรับแสดงสถานะการโหลด
const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
      </div>
      <div className="loading-text">กำลังโหลด...</div>
    </div>
  );
};

export default function UserProfile() {
  const [userInfo, setUserInfo] = useState({
    uid: '',
    name: '',
    userpoint: 0,
    profile: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [statusFeedback, setStatusFeedback] = useState({ show: false, message: '', type: '' });

  const toggleMenu = () => setMenuOpen(prev => !prev);

  const handleLogout = useCallback(async () => {
    try {
      if (liff.isLoggedIn()) await liff.logout();
    } catch (err) {
      console.error(err);
    } finally {
      Cookies.remove('authToken'); // ลบ Cookie เมื่อออกจากระบบ
      navigate('/');
    }
  }, [navigate]);

  // ฟังก์ชันแสดง feedback ชั่วคราว
  const showTemporaryFeedback = (message, type = 'info') => {
    setStatusFeedback({ show: true, message, type });
    setTimeout(() => {
      setStatusFeedback({ show: false, message: '', type: '' });
    }, 3000);
  };

  // ฟังก์ชันดึงข้อมูลผู้ใช้จาก backend และบันทึกข้อมูลผู้ใช้
  const syncUserData = useCallback(async (profileData, isPolling = false) => {
    try {
      const token = Cookies.get('authToken'); // ดึง Token จาก Cookie
      if (!token) throw new Error('Token not found');

      setIsUpdating(true);

      const apiUrl = `${API_URL}/users/${profileData.userId}`;
      const res = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) {
        if (!isPolling) showTemporaryFeedback('กำลังบันทึกข้อมูล...', 'info');
        const saveRes = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        });
        if (!saveRes.ok) throw new Error('Failed to save user data');
      }

      const data = await res.json();
      setUserInfo(prev => ({ ...prev, ...data }));
      if (!isPolling) showTemporaryFeedback('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error(error);
      if (!isPolling) showTemporaryFeedback('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // ฟังก์ชันสำหรับการบังคับบันทึกข้อมูลผู้ใช้
  const handleForceSaveData = () => {
    if (!userInfo.profile) {
      showTemporaryFeedback('ไม่พบข้อมูลโปรไฟล์', 'error');
      return;
    }
    showTemporaryFeedback('กำลังอัปเดตข้อมูล...', 'info');
    syncUserData(userInfo.profile);
  };

  // Polling เพื่ออัปเดต userpoint แบบ real-time
  useEffect(() => {
    if (!userInfo.profile) return;

    const interval = setInterval(() => {
      syncUserData(userInfo.profile, true);
    }, 150000);

    return () => clearInterval(interval);
  }, [userInfo.profile, syncUserData]);

  useEffect(() => {
    (async () => {
      try {
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const idToken = liff.getIDToken();
        if (idToken) {
          // บันทึก Token ลงใน Cookie ด้วย HttpOnly, Secure และ SameSite
          Cookies.set('authToken', idToken, {
            secure: true, // ใช้ได้เฉพาะ HTTPS
            sameSite: 'Strict', // ป้องกัน CSRF
            expires: 1 // หมดอายุใน 1 วัน
          });
        } else {
          throw new Error('ไม่สามารถดึง Token ได้');
        }

        const profileData = await liff.getProfile();
        setUserInfo(prev => ({ ...prev, profile: profileData }));
        await syncUserData(profileData);
      } catch (err) {
        console.error('Error during LIFF initialization or data sync:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [syncUserData]);

  // จัดการการคลิกนอกเมนู
  useEffect(() => {
    if (!menuOpen) return;
    
    const handleClickOutside = (e) => {
      if (!e.target.closest('.menu-popup') && !e.target.closest('.menu-toggle-button')) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const sanitize = (str) => DOMPurify.sanitize(str || '');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} autoRefresh={false} />;

  const { profile } = userInfo;
  const safeName = sanitize(userInfo.name || profile?.displayName);
  const safeStatus = sanitize(profile?.statusMessage);

  return (
    <div className="app-container">
      {statusFeedback.show && (
        <div className={`status-feedback ${statusFeedback.type}`}>
          <div className="feedback-content">
            {statusFeedback.type === 'success' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feedback-icon">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )}
            {statusFeedback.type === 'error' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feedback-icon">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            )}
            {statusFeedback.type === 'info' && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feedback-icon">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            )}
            <span>{statusFeedback.message}</span>
          </div>
        </div>
      )}

      <div className="user-navbar">
        <div className="user-info">
          {profile?.pictureUrl ? (
            <img
              src={profile.pictureUrl}
              alt="Profile"
              className="nav-profile-image"
            />
          ) : (
            <div className="profile-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          )}
          <div className="user-text">
            <div className="nav-display-name">ยินดีต้อนรับคุณ : {safeName}</div>
            <div className="nav-userpoint">
              คะแนน: {userInfo.userpoint}
              {isUpdating && <span className="update-indicator">กำลังอัปเดต...</span>}
            </div>
          </div>
        </div>
        <button onClick={toggleMenu} className="menu-toggle-button" aria-label="Toggle menu">
          <span className="menu-icon"></span>
          <span className="menu-icon"></span>
          <span className="menu-icon"></span>
        </button>
      </div>

      <div className={`menu-popup ${menuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <h3>เมนู</h3>
          <button className="close-menu" onClick={toggleMenu} aria-label="Close menu">×</button>
        </div>
        <div className="menu-items">
          <div 
            className={`menu-item ${location.pathname === '/login/userlogin' ? 'active' : ''}`} 
            onClick={() => { toggleMenu(); navigate('/login/userlogin'); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="menu-item-icon">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>ข้อมูลผู้ใช้</span>
          </div>
          <div 
            className={`menu-item ${location.pathname === '/login/menu' ? 'active' : ''}`} 
            onClick={() => { toggleMenu(); navigate('/login/menu'); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="menu-item-icon">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>รายการเมนูโปรโมชั่น</span>
          </div>
          <div 
            className="menu-item" 
            onClick={() => { toggleMenu(); handleForceSaveData(); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="menu-item-icon">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>อัปเดตข้อมูล</span>
          </div>
          <div 
            className="menu-item logout" 
            onClick={handleLogout}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="menu-item-icon">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>ออกจากระบบ</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        {userInfo.uid && (
          <div className="user-card">
            <div className="user-card-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="user-card-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <h2>ข้อมูลผู้ใช้งาน</h2>
            </div>
            <div className="user-card-content">
              <div className="user-info-item">
                <span className="info-label">รหัสผู้ใช้งาน (UID):</span>
                <span className="info-value">{userInfo.uid}</span>
              </div>
              <div className="user-info-item">
                <span className="info-label">ชื่อผู้ใช้:</span>
                <span className="info-value">{safeName}</span>
              </div>
            </div>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="save-error-card">
            <div className="error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <p>เกิดข้อผิดพลาดในการบันทึกข้อมูล</p>
            <button onClick={handleForceSaveData} className="retry-button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              <span>ลองใหม่</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}