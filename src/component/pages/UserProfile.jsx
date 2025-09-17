import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import liff from '@line/liff';
import DOMPurify from 'dompurify';
import Cookies from 'js-cookie';
import Navbar from '../navbar';
import Spinner from '../util/LoadSpinner';
import { QRCodeCanvas } from 'qrcode.react';
import { TbQrcode } from "react-icons/tb";

// --- ICONS ---
const Icons = {
  Error: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" /></svg>,
  User: () => <svg className="w-10 h-10 text-[#f5f5f5]/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Star: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  Check: ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Copy: ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Eye: ({ open, className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">{open ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />}</svg>,
  Spinner: ({ className = "w-5 h-5" }) => <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 0 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
  Activity: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7" /></svg>,
  Refresh: ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Chevron: ({ open }) => <svg className={`w-5 h-5 text-stone-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  QrCode: ({ className = "w-5 h-5" }) => <TbQrcode className={className} color="#3e2723" />,
  Download: ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Close: ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
};

// --- QR CODE COMPONENTS ---
const QRCodeDisplay = React.memo(function QRCodeDisplay({ data, size = 200, canvasRef }) {
  return (
    <QRCodeCanvas
      ref={canvasRef}
      value={data || ''}
      size={size}
      bgColor="#f5f5f5"
      fgColor="#3e2723"
      level="H"
      includeMargin={true}
      className="rounded-lg border-4 border-[#8d6e63]/20 bg-white"
      style={{ display: 'block', margin: '0 auto' }}
    />
  );
});

// Popup Modal Component
const QRPopup = ({ isOpen, onClose, uid, copyToClipboard }) => {
  const [isCopied, setIsCopied] = useState(false);
  const canvasRef = useRef(null);

  const handleCopy = () => {
    if (!uid) return;
    copyToClipboard(uid);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1200);
  };

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr_uid_${uid || 'noid'}.png`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl border border-[#8d6e63]/30 w-full max-w-sm transform transition-all duration-300 scale-100 opacity-100 pointer-events-auto animate-in zoom-in-95 duration-300" style={{ fontFamily: 'Prompt, sans-serif' }}>
          <div className="bg-gradient-to-br from-[#5d4037] to-[#3e2723] px-6 py-4 text-[#f5f5f5] rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#f5f5f5]/20 rounded-lg flex items-center justify-center">
                  <Icons.QrCode />
                </div>
                <h2 className="text-lg font-semibold" style={{ fontFamily: 'Kanit, sans-serif' }}>QR Code</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 hover:bg-[#f5f5f5]/20 rounded-lg flex items-center justify-center transition-colors duration-200">
                <Icons.Close />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-6 flex justify-center">
              <QRCodeDisplay data={uid || 'No UID'} size={200} canvasRef={canvasRef} />
            </div>
            <div className="text-center mb-6">
              <p className="text-sm text-[#5d4037] mb-3">QR Code เพื่อรับแต้มสะสม</p>
              <div className="bg-[#f5f5f5] rounded-lg p-3 border border-[#8d6e63]/20">
                <code className="text-xs text-[#3e2723] font-mono break-all">{uid || 'ไม่มีข้อมูล'}</code>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#5d4037] to-[#3e2723] hover:from-[#3e2723] hover:to-[#2e1912] text-[#f5f5f5] px-4 py-3 rounded-xl text-sm transition-all duration-300 active:scale-95 hover:shadow-lg disabled:opacity-50" disabled={isCopied}>
                {isCopied ? <Icons.Check /> : <Icons.Copy />}
                <span style={{ fontFamily: 'Kanit, sans-serif' }}>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
              <button onClick={downloadQR} className="flex-1 flex items-center justify-center gap-2 bg-[#f5f5f5] hover:bg-[#e0e0e0] text-[#3e2723] border-2 border-[#5d4037] px-4 py-3 rounded-xl text-sm transition-all duration-300 active:scale-95 hover:shadow-lg">
                <Icons.Download />
                <span style={{ fontFamily: 'Kanit, sans-serif' }}>ดาวน์โหลด</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Hidden QR Button Component
const HiddenQRButton = ({ uid, copyToClipboard }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsPopupOpen(true)} className="absolute top-4 right-4 w-8 h-8 bg-[#f5f5f5]/80 hover:bg-[#f5f5f5] text-[#5d4037] rounded-lg shadow-lg backdrop-blur-sm border border-[#8d6e63]/20 flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-110 group z-10" title="แสดง QR Code">
        <Icons.QrCode className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
      </button>
      <QRPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} uid={uid} copyToClipboard={copyToClipboard} />
    </>
  );
};

// --- ENVIRONMENT & API ---
const LIFF_ID = import.meta.env.VITE_LIFF_ID;
const API_URL = import.meta.env.VITE_API_URL;

// Improved API function with better error handling
const api = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// --- UI COMPONENTS ---
const Toast = React.memo(({ message, type, show }) => {
  if (!show) return null;
  const styles = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-[#3e2723]',
    update: 'bg-amber-600'
  };
  return (
    <div className={`fixed top-5 right-5 z-50 ${styles[type]} text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <span className="font-medium text-sm" style={{ fontFamily: 'Kanit, sans-serif' }}>{message}</span>
    </div>
  );
});

const ProfileHeader = React.memo(({ user, safeName, copyToClipboard }) => (
  <div className="bg-gradient-to-br from-[#5d4037] to-[#3e2723] px-6 py-8 text-[#f5f5f5] relative">
    <HiddenQRButton uid={user.uid} copyToClipboard={copyToClipboard} />
    <div className="text-center relative z-10">
      <div className="mb-4">
        {user.pictureUrl ? (
          <img src={user.pictureUrl} alt="Profile" className="w-24 h-24 rounded-full mx-auto shadow-2xl ring-4 ring-[#f5f5f5]/20 transition-transform duration-300 hover:scale-105" loading="lazy" />
        ) : (
          <div className="w-24 h-24 bg-gradient-to-br from-[#a1887f] to-[#8d6e63] rounded-full mx-auto flex items-center justify-center shadow-lg ring-4 ring-[#f5f5f5]/20">
            <Icons.User />
          </div>
        )}
      </div>
      <h1 className="text-2xl font-semibold mb-2 text-[#f5f5f5] tracking-wide" style={{ fontFamily: 'Kanit, sans-serif' }}>
        {safeName}
      </h1>
    </div>
  </div>
));

const PointsCard = React.memo(({ userpoint, pointsAnimation }) => (
  <div className={`bg-gradient-to-br from-[#5d4037] to-[#3e2723] rounded-2xl p-6 text-[#f5f5f5] shadow-xl transition-all duration-500 relative overflow-hidden ${pointsAnimation ? 'scale-105 shadow-2xl' : ''}`}>
    <div className={`absolute top-0 left-[-100%] h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ${pointsAnimation ? 'translate-x-[200%]' : ''}`}></div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm opacity-80 mb-1 tracking-wider" style={{ fontFamily: 'Prompt, sans-serif' }}>คะแนนสะสม</p>
        <p className={`text-4xl font-bold transition-colors duration-500 ${pointsAnimation ? 'text-amber-300' : 'text-[#f5f5f5]'}`}>
          {userpoint.toLocaleString()}
        </p>
      </div>
      <Icons.Star className={`w-12 h-12 text-amber-400/80 transition-all duration-500 ${pointsAnimation ? 'rotate-12 scale-125' : ''}`} />
    </div>
  </div>
));

const UserIdAccordion = React.memo(({ uid, copyToClipboard }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const handleCopy = () => {
    if (!uid) return;
    copyToClipboard(uid);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-[#f5f5f5] rounded-2xl p-4 border border-[#8d6e63]/30 transition-all duration-300">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between text-left group">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#5d4037] to-[#3e2723] rounded-lg flex items-center justify-center text-[#f5f5f5] transition-transform duration-300 group-hover:scale-105">
            <Icons.Eye open={isOpen} />
          </div>
          <div>
            <p className="font-medium text-[#3e2723]" style={{ fontFamily: 'Kanit, sans-serif' }}>รหัสผู้ใช้</p>
            <p className="text-sm text-[#5d4037]">{isOpen ? 'คลิกเพื่อซ่อน' : 'คลิกเพื่อแสดง'}</p>
          </div>
        </div>
        <Icons.Chevron open={isOpen} />
      </button>

      {isOpen && (
        <div className="mt-4 p-3 bg-white rounded-lg border border-[#8d6e63]/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between gap-3">
            <code className="text-sm text-[#5d4037] font-mono flex-1 break-all">{uid || 'ไม่มี'}</code>
            <button onClick={handleCopy} className="flex items-center justify-center w-24 gap-2 bg-gradient-to-r from-[#5d4037] to-[#3e2723] hover:from-[#3e2723] hover:to-[#2e1912] text-[#f5f5f5] px-3 py-2 rounded-lg text-sm transition-all duration-300 active:scale-95 hover:shadow-lg disabled:opacity-50" disabled={isCopied}>
              {isCopied ? <Icons.Check /> : <Icons.Copy />}
              <span style={{ fontFamily: 'Kanit, sans-serif' }}>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

const RefreshButton = React.memo(({ onClick, isUpdating }) => (
  <button onClick={onClick} disabled={isUpdating} className="w-full bg-gradient-to-r from-[#5d4037] to-[#3e2723] hover:from-[#3e2723] hover:to-[#2e1912] disabled:opacity-60 disabled:cursor-not-allowed text-[#f5f5f5] py-3 px-4 rounded-2xl transition-all duration-300 active:scale-95 hover:shadow-xl flex items-center justify-center gap-2.5">
    <div className={`transition-transform duration-500 ${isUpdating ? 'animate-spin' : ''}`}>
      {isUpdating ? <Icons.Spinner /> : <Icons.Refresh />}
    </div>
    <span className="text-base font-medium" style={{ fontFamily: 'Kanit, sans-serif' }}>
      {isUpdating ? 'กำลังอัปเดต...' : 'รีเฟรชตอนนี้'}
    </span>
  </button>
));

// --- MAIN COMPONENT ---
export default function UserProfile() {
  const [userInfo, setUserInfo] = useState({ 
    uid: '', 
    name: '', 
    userpoint: 0, 
    profile: null 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [pointsAnimation, setPointsAnimation] = useState(false);
  const [initStep, setInitStep] = useState('กำลังเริ่มต้น LIFF...');

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500);
  }, []);

  const copyToClipboard = useCallback((text) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast('คัดลอกไปยังคลิปบอร์ดแล้ว', 'success'))
        .catch(() => showToast('ไม่สามารถคัดลอกได้', 'error'));
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('คัดลอกไปยังคลิปบอร์ดแล้ว', 'success');
      } catch (err) {
        showToast('ไม่สามารถคัดลอกได้', 'error');
      }
      document.body.removeChild(textArea);
    }
  }, [showToast]);

  const syncData = useCallback(async (profile) => {
    if (!profile?.userId) {
      console.error('No profile or userId provided');
      return;
    }

    try {
      setIsUpdating(true);
      setInitStep('กำลังดึงข้อมูลผู้ใช้...');
      
      const token = Cookies.get('authToken');
      if (!token) {
        throw new Error('ไม่พบ Authentication Token');
      }

      let userData;
      
      try {
        // Try to get existing user
        userData = await api(`${API_URL}/users/${profile.userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        if (err.message.includes('404') || err.message.includes('400')) {
          // User not found, create new user
          setInitStep('กำลังสร้างบัญชีผู้ใช้...');
          
          const userDataToSend = {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl
          };

          try {
            await api(`${API_URL}/users`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: JSON.stringify(userDataToSend)
            });

            // Wait a bit for the server to process
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Try to fetch the newly created user
            userData = await api(`${API_URL}/users/${profile.userId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (postError) {
            console.error('Failed to create user:', postError);
            
            // Fallback to default user data
            userData = {
              uid: profile.userId,
              name: profile.displayName,
              userpoint: 0,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl
            };
          }
        } else {
          throw err;
        }
      }

      setUserInfo(prev => ({ ...prev, ...userData }));
      showToast('โหลดข้อมูลสำเร็จ', 'success');

    } catch (err) {
      console.error('Sync error:', err);
      setError(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  }, [showToast]);

  const handleRefresh = useCallback(() => {
    if (userInfo.profile) {
      syncData(userInfo.profile);
    }
  }, [syncData, userInfo.profile]);

  useEffect(() => {
    let isMounted = true;
    
    const initializeLiff = async () => {
      try {
        if (!LIFF_ID) {
          throw new Error('LIFF ID ไม่ถูกตั้งค่า');
        }

        setInitStep('กำลังเริ่มต้น LIFF...');
        console.log('Initializing LIFF with ID:', LIFF_ID);

        // Check if we just came back from login redirect
        const urlParams = new URLSearchParams(window.location.search);
        const isFromRedirect = urlParams.has('liffRedirectUri') || 
                              window.location.hash.includes('access_token') ||
                              document.referrer.includes('access.line.me');

        // Initialize LIFF
        await liff.init({ 
          liffId: LIFF_ID,
          withLoginOnExternalBrowser: true
        });

        if (!isMounted) return;

        console.log('LIFF initialized successfully');
        console.log('isLoggedIn:', liff.isLoggedIn());
        console.log('isFromRedirect:', isFromRedirect);

        // If coming from redirect, wait a bit for LIFF to process
        if (isFromRedirect) {
          setInitStep('กำลังประมวลผลการเข้าสู่ระบบ...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        setInitStep('กำลังตรวจสอบการเข้าสู่ระบบ...');

        // Check login status multiple times if needed
        let loginAttempts = 0;
        const maxAttempts = 5;
        
        while (!liff.isLoggedIn() && loginAttempts < maxAttempts) {
          console.log(`Login attempt ${loginAttempts + 1}/${maxAttempts}`);
          
          if (loginAttempts === 0 && !isFromRedirect) {
            // First attempt - try to login
            console.log('Attempting to login...');
            setInitStep('กำลังเข้าสู่ระบบ...');
            
            try {
              await liff.login({
                redirectUri: window.location.href
              });

              // เริ่ม setTimeout ที่นี่
              setTimeout(() => {
                console.log('Timeout finished. Attempting to get profile...');
                // โค้ดที่ควรจะทำงานต่อหลังจากรอ
              }, 5000); // 5 วินาที ตามที่ต้องการ

              return; // This will redirect, so we return here
            } catch (loginErr) {
              console.error('Login failed:', loginErr);
            }
          }
          
          // Wait and check again
          await new Promise(resolve => setTimeout(resolve, 1000));
          loginAttempts++;
        }

        // If still not logged in after attempts
        if (!liff.isLoggedIn()) {
          // Try to get profile anyway (sometimes works even when isLoggedIn returns false)
          try {
            setInitStep('กำลังดึงข้อมูลโปรไฟล์...');
            const profile = await liff.getProfile();
            const idToken = liff.getIDToken();
            
            if (profile && idToken) {
              console.log('Got profile despite login status:', profile);
              
              // Set cookie
              Cookies.set('authToken', idToken, { 
                secure: window.location.protocol === 'https:', 
                sameSite: 'Strict', 
                expires: 1 
              });

              if (!isMounted) return;

              // Set profile and sync data
              setUserInfo(prev => ({ ...prev, profile }));
              await syncData(profile);
              return;
            }
          } catch (profileErr) {
            console.error('Failed to get profile:', profileErr);
          }
          
          throw new Error('ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง');
        }

        setInitStep('กำลังดึงข้อมูลโปรไฟล์...');

        // Get ID token and profile
        const idToken = liff.getIDToken();
        if (!idToken) {
          throw new Error('ไม่สามารถดึง ID Token ได้');
        }

        // Set cookie
        Cookies.set('authToken', idToken, { 
          secure: window.location.protocol === 'https:', 
          sameSite: 'Strict', 
          expires: 1 
        });

        // Get user profile
        const profile = await liff.getProfile();
        console.log('Profile obtained:', profile);

        if (!isMounted) return;

        // Set profile first
        setUserInfo(prev => ({ ...prev, profile }));

        // Then sync data
        await syncData(profile);

      } catch (err) {
        console.error('LIFF initialization error:', err);
        if (!isMounted) return;
        
        setError(`การเริ่มต้นล้มเหลว: ${err.message}`);
        
        // Auto retry after 5 seconds for specific errors
        if (err.name === 'AbortError' || 
            err.message.includes('network') || 
            err.message.includes('ไม่สามารถเข้าสู่ระบบได้')) {
          setTimeout(() => {
            if (isMounted) {
              window.location.reload();
            }
          }, 5000);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeLiff();

    return () => {
      isMounted = false;
    };
  }, [syncData]);

  const safeName = useMemo(() => {
    const name = userInfo.name || userInfo.profile?.displayName || 'ผู้ใช้งาน';
    return DOMPurify.sanitize(name);
  }, [userInfo.name, userInfo.profile?.displayName]);

  const user = useMemo(() => ({
    uid: userInfo.uid,
    name: safeName,
    userpoint: userInfo.userpoint,
    profile: userInfo.profile,
    pictureUrl: userInfo.profile?.pictureUrl
  }), [userInfo, safeName]);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#f5f5f5] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-[#8d6e63]/30">
          <div className="mb-6">
            <Icons.Spinner className="w-12 h-12 mx-auto text-[#5d4037]" />
          </div>
          <h2 className="text-xl font-bold text-[#3e2723] mb-2" style={{ fontFamily: 'Kanit, sans-serif' }}>
            กำลังโหลด
          </h2>
          <p className="text-[#5d4037] text-sm">{initStep}</p>
          <div className="mt-4 bg-[#f5f5f5] rounded-lg p-3">
            <div className="w-full bg-[#e0e0e0] rounded-full h-2">
              <div className="bg-gradient-to-r from-[#5d4037] to-[#3e2723] h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-[#f5f5f5] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-[#8d6e63]/30">
          <div className="text-red-500 mb-4 inline-block">
            <Icons.Error />
          </div>
          <h2 className="text-xl font-bold text-[#3e2723] mb-2" style={{ fontFamily: 'Kanit, sans-serif' }}>
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-[#5d4037] mb-6 text-sm">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-gradient-to-r from-[#5d4037] to-[#3e2723] text-[#f5f5f5] py-3 rounded-xl hover:from-[#3e2723] hover:to-[#2e1912] transition-all duration-300"
            >
              รีเฟรชหน้า
            </button>
            <button 
              onClick={() => {
                Cookies.remove('authToken');
                window.location.reload();
              }}
              className="w-full bg-[#f5f5f5] text-[#5d4037] py-3 rounded-xl border-2 border-[#8d6e63]/30 hover:bg-[#e0e0e0] transition-all duration-300"
            >
              เข้าสู่ระบบใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col" style={{ fontFamily: 'Prompt, sans-serif' }}>
      <Navbar user={user} safeName={safeName} />
      <Toast {...toast} />

      <main className="flex-1 p-4 sm:p-6 flex items-start justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#8d6e63]/30 overflow-hidden">
            <ProfileHeader 
              user={user} 
              safeName={safeName} 
              copyToClipboard={copyToClipboard} 
            />
            
            <div className="p-4 sm:p-6 space-y-4">
              <PointsCard 
                userpoint={userInfo.userpoint} 
                pointsAnimation={pointsAnimation} 
              />
              
              <UserIdAccordion 
                uid={userInfo.uid} 
                copyToClipboard={copyToClipboard} 
              />
              
              <RefreshButton 
                onClick={handleRefresh} 
                isUpdating={isUpdating} 
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}