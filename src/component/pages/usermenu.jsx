import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import liff from '@line/liff';
import DOMPurify from 'dompurify';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/Usermenu.css';

// Import components
import CounterAnimation from '../CounterAnimation';
import PointChangeNotifier from '../PointChangeNotifier';

// อ่านค่า LIFF_ID และ API_URL จาก .env (Vite)
const LIFF_ID = import.meta.env.VITE_LIFF_ID;
const API_URL = import.meta.env.VITE_API_URL;

// สร้าง custom hook สำหรับการจัดการ API calls แบบมี abort controller
const useApi = () => {
  const abortControllerRef = useRef(null);

  const callApi = useCallback(async (url, options = {}) => {
    // ยกเลิก request เก่าถ้ามี
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // สร้าง controller ใหม่
    abortControllerRef.current = new AbortController();
    
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const response = await fetch(url, {
        ...options,
        headers,
        signal: abortControllerRef.current.signal
      });

      // จัดการกับสถานะ HTTP ต่างๆ
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        switch (response.status) {
          case 401:
            throw new Error('ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบใหม่');
          case 403:
            throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
          case 404:
            throw new Error('ไม่พบข้อมูลที่ร้องขอ');
          case 429:
            throw new Error('มีการเรียกใช้งาน API มากเกินไป กรุณาลองใหม่ในภายหลัง');
          case 500:
            throw new Error('เกิดข้อผิดพลาดที่เซิร์ฟเวอร์');
          default:
            throw new Error(`เกิดข้อผิดพลาด: ${errorData.message || response.statusText}`);
        }
      }
      
      return await response.json();
    } catch (error) {
      // ไม่ throw error เมื่อเป็นการ abort ที่ตั้งใจ
      if (error.name === 'AbortError') {
        return null;
      }
      throw error;
    }
  }, []);

  // ฟังก์ชันสำหรับยกเลิก request ทั้งหมด
  const cancelAllRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // ยกเลิก request ทั้งหมดเมื่อ component unmount
  useEffect(() => {
    return () => cancelAllRequests();
  }, [cancelAllRequests]);

  return { callApi, cancelAllRequests };
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

// Component สำหรับแสดง feedback ชั่วคราว
const StatusFeedback = ({ show, message, type }) => {
  if (!show) return null;

  return (
    <div className={`status-feedback ${type}`}>
      <div className="feedback-content">
        {type === 'success' && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feedback-icon">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        )}
        {type === 'error' && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feedback-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        )}
        {type === 'info' && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feedback-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};

// Component สำหรับแสดงรายการเมนู
const MenuItem = ({ id, name, description, point, userPoint, onRedeemCoupon }) => {
  const progress = Math.min((userPoint / point) * 100, 100);
  const isSufficient = userPoint >= point;

  return (
    <div className="menu-item-card">
      <h4>{name}</h4>
      <p>{description}</p>
      <div className="progress-container">
        <div
          className={`progress-bar ${isSufficient ? 'sufficient' : ''}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="menu-info">
        <div className="progress-text">
          {userPoint} / {point} แต้ม
        </div>
        <button
          className={`menu-status ${isSufficient ? 'sufficient' : 'insufficient'}`}
          disabled={!isSufficient}
          onClick={() => {
            if (isSufficient && onRedeemCoupon) {
              onRedeemCoupon(id, name, point);
            }
          }}
        >
          {isSufficient ? 'แลกคูปอง' : 'แต้มไม่เพียงพอ'}
        </button>
      </div>
    </div>
  );
};

// user reducer สำหรับจัดการ state ที่เกี่ยวข้องกัน
const userReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER_INFO':
      return {
        ...state,
        uid: action.payload.uid || state.uid,
        name: action.payload.name || state.name,
        userpoint: action.payload.userpoint !== undefined ? action.payload.userpoint : state.userpoint,
        profile: action.payload.profile || state.profile,
      };
    case 'SET_PREVIOUS_POINT':
      return { ...state, previousPoint: action.payload };
    case 'SET_POINT_CHANGED':
      return { ...state, pointChanged: action.payload };
    case 'UPDATE_UI_STATE':
      return { 
        ...state, 
        loading: action.payload.loading !== undefined ? action.payload.loading : state.loading,
        error: action.payload.error !== undefined ? action.payload.error : state.error,
        isUpdating: action.payload.isUpdating !== undefined ? action.payload.isUpdating : state.isUpdating,
      };
    default:
      return state;
  }
};

// feedback reducer
const feedbackReducer = (state, action) => {
  switch (action.type) {
    case 'SHOW_FEEDBACK':
      return {
        show: true,
        message: action.payload.message,
        type: action.payload.type || 'info'
      };
    case 'HIDE_FEEDBACK':
      return { show: false, message: '', type: '' };
    default:
      return state;
  }
};

export default function Usermenu() {
  // ใช้ useReducer แทน useState หลายตัวที่เกี่ยวข้องกัน
  const [userState, userDispatch] = useReducer(userReducer, {
    uid: '',
    name: '',
    userpoint: 0,
    previousPoint: 0,
    pointChanged: false,
    profile: null,
    loading: true,
    error: '',
    isUpdating: false
  });

  const [feedback, feedbackDispatch] = useReducer(feedbackReducer, {
    show: false,
    message: '',
    type: ''
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  
  const pointCounterRef = useRef(null);
  const authTokenRef = useRef(localStorage.getItem('authToken'));
  const userDataSavedRef = useRef(localStorage.getItem('userDataSaved') === 'true');
  const lastPollingTimeRef = useRef(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { callApi } = useApi();

  const toggleMenu = () => setMenuOpen(prev => !prev);

  // Function to sanitize strings
  const sanitize = (str) => DOMPurify.sanitize(str || '');

  // Function to show temporary feedback
  const showTemporaryFeedback = (message, type = 'info') => {
    feedbackDispatch({ type: 'SHOW_FEEDBACK', payload: { message, type } });
    setTimeout(() => {
      feedbackDispatch({ type: 'HIDE_FEEDBACK' });
    }, 3000);
  };

  // Function to handle logout
  const handleLogout = useCallback(async () => {
    try {
      if (liff.isLoggedIn()) await liff.logout();
    } catch {
      // ลบ console.error เพื่อป้องกันข้อมูลหลุด
    } finally {
      localStorage.clear();
      navigate('/');
    }
  }, [navigate]);

  // Function to sync user data with backend - ปรับปรุงให้เรียก API น้อยลง
  const syncUserData = useCallback(async (profileData, isPolling = false) => {
    if (!profileData) return;
    
    // ตรวจสอบเวลาครั้งล่าสุดที่ poll ไป ถ้าเป็นการ poll และยังไม่ถึงเวลา ไม่ต้องเรียก API
    const now = Date.now();
    if (isPolling && now - lastPollingTimeRef.current < 5000) {
      return; // ป้องกันการ poll ถี่เกินไป
    }
    
    lastPollingTimeRef.current = now;
    
    try {
      userDispatch({ type: 'UPDATE_UI_STATE', payload: { isUpdating: true } });
      const userId = profileData.userId;
      
      // ส่ง API call เดียวที่ทำทั้งสร้าง/อัปเดตและดึงข้อมูลกลับมา
      const endpoint = `${API_URL}/users/${userId}`;
      const params = new URLSearchParams({
        name: profileData.displayName,
        picture: profileData.pictureUrl || ''
      });
      
      const userData = await callApi(`${endpoint}?${params.toString()}`);
      
      // อัปเดต state จากข้อมูลที่ได้
      userDispatch({ 
        type: 'SET_USER_INFO', 
        payload: {
          uid: userData.uid,
          name: userData.displayName,
          userpoint: userData.userpoint || 0
        }
      });
      
      // อัปเดตสถานะว่าข้อมูลถูกบันทึกแล้ว
      if (!userDataSavedRef.current) {
        userDataSavedRef.current = true;
        localStorage.setItem('userDataSaved', 'true');
        
        if (!isPolling) {
          showTemporaryFeedback('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
        }
      }
      
      // ตรวจสอบการเปลี่ยนแปลงคะแนน
      if (userData.userpoint !== userState.userpoint && userState.userpoint > 0) {
        userDispatch({ type: 'SET_POINT_CHANGED', payload: true });
        
        // จัดการ animation
        if (pointCounterRef.current) {
          pointCounterRef.current.classList.add('changed');
          
          setTimeout(() => {
            if (pointCounterRef.current) {
              pointCounterRef.current.classList.remove('changed');
            }
          }, 600);
        }
        
        // อัปเดต previousPoint หลัง animation
        setTimeout(() => {
          userDispatch({ type: 'SET_PREVIOUS_POINT', payload: userData.userpoint });
          userDispatch({ type: 'SET_POINT_CHANGED', payload: false });
        }, 1500);
      }
    } catch (error) {
      if (!isPolling) {
        userDispatch({ type: 'UPDATE_UI_STATE', payload: { error: error.message } });
        showTemporaryFeedback('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
      }
    } finally {
      userDispatch({ type: 'UPDATE_UI_STATE', payload: { isUpdating: false } });
    }
  }, [callApi, userState.userpoint]);

  // Function to force save user data
  const handleForceSaveData = () => {
    if (!userState.profile) {
      showTemporaryFeedback('ไม่พบข้อมูลโปรไฟล์', 'error');
      return;
    }
    showTemporaryFeedback('กำลังอัปเดตข้อมูล...', 'info');
    userDataSavedRef.current = false; // บังคับให้มีการบันทึกใหม่
    syncUserData(userState.profile);
  };

  // Function to fetch menu items - ปรับให้ใช้ useApi
  const fetchMenuItems = useCallback(async () => {
    try {
      const data = await callApi(`${API_URL}/menu`);
      setMenuItems(data);
    } catch (error) {
      userDispatch({ type: 'UPDATE_UI_STATE', payload: { error: 'ไม่สามารถโหลดข้อมูลเมนูได้' } });
    }
  }, [callApi]);

  // Function to handle redeem coupon
  const handleRedeemCoupon = useCallback((menuId, menuName, menuPoint) => {
    // ตัวอย่างฟังก์ชันที่จะเรียก API สำหรับการแลกคูปอง
    showTemporaryFeedback(`กำลังแลกคูปอง ${menuName}...`, 'info');
    
    // ส่วนนี้จะเป็นการเรียก API จริงๆ (ปรับตามความต้องการ)
    setTimeout(() => {
      showTemporaryFeedback(`แลกคูปอง ${menuName} สำเร็จ!`, 'success');
      
      // จำลองการลดแต้ม (ในระบบจริงจะมาจาก API)
      const newUserPoint = userState.userpoint - menuPoint;
      userDispatch({ 
        type: 'SET_USER_INFO', 
        payload: { userpoint: newUserPoint }
      });
    }, 1000);
  }, [userState.userpoint]);

  // Initialize LIFF and get user profile
  useEffect(() => {
    let isActive = true;
    
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profileData = await liff.getProfile();
        
        if (isActive) {
          userDispatch({ 
            type: 'SET_USER_INFO', 
            payload: { profile: profileData }
          });
          
          await syncUserData(profileData);
          
          userDispatch({ 
            type: 'UPDATE_UI_STATE', 
            payload: { loading: false }
          });
        }
      } catch (err) {
        if (isActive) {
          userDispatch({ 
            type: 'UPDATE_UI_STATE', 
            payload: { 
              error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
              loading: false 
            }
          });
        }
      }
    };

    initializeLiff();
    
    // Cleanup function
    return () => {
      isActive = false;
    };
  }, []); // ไม่ใส่ syncUserData ในความขึ้นต่อ เพื่อป้องกันการเรียกซ้ำ

  // Fetch menu items on component mount
  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // Poll for user point updates - ปรับให้ช้าลงเป็น 30 วินาที
  useEffect(() => {
    if (!userState.profile) return;

    const interval = setInterval(() => {
      syncUserData(userState.profile, true);
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [userState.profile, syncUserData]);

  // Close menu when clicking outside
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

  if (userState.loading) return <LoadingSpinner />;
  if (userState.error) return <ErrorMessage message={userState.error} autoRefresh={false} />;

  const { profile } = userState;
  const safeName = sanitize(userState.name || profile?.displayName);

  return (
    <div className="app-container">
      <StatusFeedback {...feedback} />
      <PointChangeNotifier previousPoint={userState.previousPoint} currentPoint={userState.userpoint} />

      {/* Navbar */}
      <div className="user-navbar">
        <div className="user-info">
          {profile?.pictureUrl ? (
            <img src={profile.pictureUrl} alt="Profile" className="nav-profile-image" />
          ) : (
            <div className="profile-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          )}
          <div className="user-text">
            <div className="nav-display-name">{safeName}</div>
            <div className="nav-userpoint">
              <span>คะแนน: <CounterAnimation value={userState.userpoint} duration={1500} /></span>
            </div>
          </div>
        </div>
        <button onClick={toggleMenu} className="menu-toggle-button" aria-label="Toggle menu">
          <span className="menu-icon"></span>
          <span className="menu-icon"></span>
          <span className="menu-icon"></span>
        </button>
      </div>

      {/* Slide-in Menu */}
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

      {/* Main Content */}
      <div className="main-content">
        {/* User Welcome Card */}
        <div className="welcome-card">
          <div className="welcome-points">
            <span>คะแนนสะสม: </span>
            <div ref={pointCounterRef} className={`point-counter ${userState.pointChanged ? 'point-changed' : ''}`}>
              <CounterAnimation value={userState.userpoint} duration={1500} className="animated-points" />
              <span className="point-unit"> แต้ม</span>
            </div>
          </div>
        </div>
        <div className="menu-section">
          <div className="section-header">
            <h3>รายการเมนูโปรโมชั่น</h3>
            <button
              className="refresh-menu-button"
              onClick={() => {
                showTemporaryFeedback('กำลังรีเฟรชเมนู...', 'info');
                fetchMenuItems();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </button>
          </div>

          {menuItems.length > 0 ? (
            <div className="menu-items-grid">
              {menuItems.map((item) => (
                <MenuItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  point={item.point}
                  userPoint={userState.userpoint}
                  onRedeemCoupon={handleRedeemCoupon}
                />
              ))}
            </div>
          ) : (
            <div className="no-menu-items">
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                <p>ไม่พบรายการเมนูโปรโมชั่นในขณะนี้</p>
                <button
                  className="retry-button"
                  onClick={() => {
                    showTemporaryFeedback('กำลังโหลดเมนูใหม่...', 'info');
                    fetchMenuItems();
                  }}
                >
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="app-footer">
        <div className="footer-content">

        </div>
      </div>

      {/* Loading Overlay */}
      {userState.isUpdating && (
        <div className="loading-overlay">
          <div className="loading-spinner-small">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </div>
          <div className="loading-text-small">กำลังอัปเดตข้อมูล...</div>
        </div>
      )}
    </div>
  );
}