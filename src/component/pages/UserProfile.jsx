import React, { useState, useEffect, useCallback } from 'react';
import liff from '@line/liff';
import DOMPurify from 'dompurify';
import Cookies from 'js-cookie';
import Navbar from '../navbar';
import Spinner from '../util/LoadSpinner';
const Icons = {
  Error: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  User: () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Star: ({ className = "w-6 h-6 text-yellow-400" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Copy: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Eye: ({ open }) => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
      )}
    </svg>
  ),
  Spinner: () => (
    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
};

const LIFF_ID = import.meta.env.VITE_LIFF_ID;
const API_URL = import.meta.env.VITE_API_URL;

const LoadingSpinner = () => (
  <Spinner/>
);

const ErrorMessage = ({ message }) => (
  <div className="fixed inset-0 bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full border border-red-200">
      <div className="text-red-500 mb-4 flex justify-center">
        <Icons.Error />
      </div>
      <p className="text-slate-700 text-center mb-6">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="w-full bg-[#5d4037] hover:bg-[#3e2723] text-white py-3 rounded-xl font-medium transition-colors duration-200"
      >
        รีเฟรช
      </button>
    </div>
  </div>
);

const Toast = ({ message, type, show }) => {
  if (!show) return null;

  const styles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-[#5d4037] text-white'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${styles[type]} px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in`}>
      {type === 'success' && <Icons.Check />}
      {type === 'error' && <Icons.Error />}
      {type === 'info' && <Icons.Spinner />}
      <span className="font-medium">{message}</span>
    </div>
  );
};

export default function UserProfile() {
  const [userInfo, setUserInfo] = useState({ uid: '', name: '', userpoint: 0, profile: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showUserId, setShowUserId] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  }, []);

  const syncUserData = useCallback(async (profileData, isPolling = false) => {
    try {
      const token = Cookies.get('authToken');
      if (!token) throw new Error('Token not found');

      if (!isPolling) {
        showToast('กำลังซิงค์ข้อมูล...', 'info');
        setIsUpdating(true);
      }

      const response = await fetch(`${API_URL}/users/${profileData.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // Create new user
        const createResponse = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        });

        if (!createResponse.ok) throw new Error('Failed to create user');

        // Fetch updated data
        const updatedResponse = await fetch(`${API_URL}/users/${profileData.userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await updatedResponse.json();
        setUserInfo(prev => ({ ...prev, ...userData }));
      } else {
        // Update existing user
        const userData = await response.json();
        setUserInfo(prev => ({ ...prev, ...userData }));
      }

      if (!isPolling) showToast('ข้อมูลอัปเดตเรียบร้อย', 'success');
    } catch (err) {
      console.error('Sync error:', err);
      if (!isPolling) showToast('เกิดข้อผิดพลาดในการซิงค์', 'error');
    } finally {
      setIsUpdating(false);
    }
  }, [showToast]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('คัดลอกแล้ว!', 'success');
    } catch (err) {
      showToast('ไม่สามารถคัดลอกได้', 'error');
    }
  };

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const idToken = liff.getIDToken();
        if (!idToken) throw new Error('ไม่สามารถดึง Token ได้');

        Cookies.set('authToken', idToken, { secure: true, sameSite: 'Strict', expires: 1 });

        const profileData = await liff.getProfile();
        setUserInfo(prev => ({ ...prev, profile: profileData }));
        await syncUserData(profileData);
      } catch (err) {
        console.error('LIFF error:', err);
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeLiff();
  }, [syncUserData]);

  // Auto-sync every 2.5 minutes
  useEffect(() => {
    if (!userInfo.profile) return;

    const interval = setInterval(() => {
      syncUserData(userInfo.profile, true);
    }, 150000);

    return () => clearInterval(interval);
  }, [userInfo.profile, syncUserData]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const { profile } = userInfo;
  const safeName = DOMPurify.sanitize(userInfo.name || profile?.displayName || '');
  const user = {
    uid: userInfo.uid,
    name: safeName,
    userpoint: userInfo.userpoint,
    profile,
    pictureUrl: profile?.pictureUrl
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar user={user} safeName={safeName} />
      <Toast {...toast} />

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">

          {/* Hero Section */}
          <div className="bg-gradient-to-br from-[#6d4c41] to-[#3C2415] px-8 py-12 text-white relative overflow-hidden">
            {/* Subtle texture overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-pixels.png')] opacity-10"></div>

            {/* Coffee Bean Icon 1 */}
            <div className="absolute w-12 h-12 opacity-15 pointer-events-none animate-float1" style={{ top: '15%', left: '20%' }}>
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <defs>
                  <linearGradient id="bean-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#4A2F1F', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#2C1A10', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <ellipse cx="12" cy="12" rx="8" ry="6" fill="url(#bean-dark)" />
                <path d="M12 6 Q16 12 12 18 Q8 12 12 6" stroke="#FFF" strokeWidth="0.5" opacity="0.4" fill="none" />
              </svg>
            </div>

            {/* Coffee Bean Icon 2 */}
            <div className="absolute w-10 h-10 opacity-15 pointer-events-none animate-float2" style={{ top: '70%', left: '75%' }}>
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <defs>
                  <linearGradient id="bean-light" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#F5DEB3', stopOpacity: 1 }} />
                    <stop offset="30%" style={{ stopColor: '#D2B48C', stopOpacity: 1 }} />
                    <stop offset="70%" style={{ stopColor: '#A0522D', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <ellipse cx="12" cy="12" rx="7" ry="5" fill="url(#bean-light)" />
                <path d="M12 7 Q15 12 12 17 Q9 12 12 7" stroke="#FFF" strokeWidth="0.5" opacity="0.4" fill="none" />
              </svg>
            </div>

            {/* Coffee Cup Icon (Enhanced) */}
            <div className="absolute w-14 h-14 opacity-15 pointer-events-none animate-float3" style={{ top: '35%', left: '65%' }}>
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <defs>
                  <linearGradient id="cup-enhanced" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#D2B48C', stopOpacity: 1 }} />
                    <stop offset="30%" style={{ stopColor: '#A0522D', stopOpacity: 1 }} />
                    <stop offset="70%" style={{ stopColor: '#4A2F1F', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#2C1A10', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path fill="url(#cup-enhanced)" d="M7 20h10a2 2 0 002-2v-6H5v6a2 2 0 002 2z" />
                <path stroke="#FFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" d="M7 20h10a2 2 0 002-2v-6H5v6a2 2 0 002 2zm8-12H9a2 2 0 00-2 2v1h10v-1a2 2 0 00-2-2z" />
                <path stroke="#FFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" d="M19 11h2a2 2 0 012 2v1a2 2 0 01-2 2h-2" />
                <path stroke="#FFF" strokeWidth="0.5" strokeLinecap="round" d="M10 15s1-2 2-2 2 2 2 2" opacity="0.6" />
              </svg>
            </div>

            {/* Coffee Cup Icon 2 */}
            <div className="absolute w-12 h-12 opacity-15 pointer-events-none animate-float4" style={{ top: '60%', left: '25%' }}>
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <defs>
                  <linearGradient id="cup-soft" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#A0522D', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#F5DEB3', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path fill="url(#cup-soft)" d="M7 20h10a2 2 0 002-2v-6H5v6a2 2 0 002 2z" />
                <path stroke="#FFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" d="M7 20h10a2 2 0 002-2v-6H5v6a2 2 0 002 2zm8-12H9a2 2 0 00-2 2v1h10v-1a2 2 0 00-2-2z" />
                <path stroke="#FFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" d="M19 11h2a2 2 0 012 2v1a2 2 0 01-2 2h-2" />
                <path stroke="#FFF" strokeWidth="0.5" strokeLinecap="round" d="M10 15s1-2 2-2 2 2 2 2" opacity="0.6" />
              </svg>
            </div>

            <div className="relative z-10 text-center">
              {/* Profile Picture */}
              <div className="mb-6">
                {user.pictureUrl ? (
                  <img
                    src={user.pictureUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full mx-auto shadow-2xl ring-4 ring-amber-200/30"
                  />
                ) : (
                  <div className="w-24 h-24 bg-amber-100/20 rounded-full mx-auto flex items-center justify-center shadow-2xl ring-4 ring-amber-200/30">
                    <User />
                  </div>
                )}
              </div>

              {/* Name */}
              <h1 className="text-3xl font-bold mb-2 font-serif text-amber-50">{safeName}</h1>

              {/* Status */}
              <div className="flex items-center justify-center gap-2 text-sm opacity-90">
                <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                <span className="font-light">{isUpdating ? 'กำลังอัปเดต...' : 'ออนไลน์'}</span>
              </div>
            </div>

            {/* Enhanced smooth animation keyframes */}
            <style jsx>{`
        @keyframes float1 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.15; }
          25% { transform: translate(15px, -20px) rotate(90deg) scale(1.1); opacity: 0.3; }
          50% { transform: translate(-10px, -35px) rotate(180deg) scale(1.05); opacity: 0.25; }
          75% { transform: translate(20px, -15px) rotate(270deg) scale(1.1); opacity: 0.3; }
          100% { transform: translate(0, 0) rotate(360deg) scale(1); opacity: 0.15; }
        }
        @keyframes float2 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.15; }
          33% { transform: translate(20px, -25px) rotate(120deg) scale(1.15); opacity: 0.3; }
          66% { transform: translate(-15px, -30px) rotate(240deg) scale(1.1); opacity: 0.25; }
          100% { transform: translate(0, 0) rotate(360deg) scale(1); opacity: 0.15; }
        }
        @keyframes float3 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.15; }
          20% { transform: translate(25px, -20px) rotate(15deg) scale(1.15); opacity: 0.3; }
          40% { transform: translate(-15px, -35px) rotate(-10deg) scale(1.1); opacity: 0.25; }
          60% { transform: translate(20px, -30px) rotate(20deg) scale(1.15); opacity: 0.3; }
          80% { transform: translate(-10px, -25px) rotate(-15deg) scale(1.1); opacity: 0.25; }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.15; }
        }
        @keyframes float4 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.15; }
          30% { transform: translate(-20px, -25px) rotate(-10deg) scale(1.15); opacity: 0.3; }
          60% { transform: translate(15px, -40px) rotate(8deg) scale(1.1); opacity: 0.25; }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.15; }
        }
        
        .animate-float1 { animation: float1 6s หinfinite cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-float2 { animation: float2 8s infinite cubic-bezier(0.4, 0, 0.2, 1) 0.5s; }
        .animate-float3 { animation: float3 7s infinite cubic-bezier(0.4, 0, 0.2, 1) 1s; }
        .animate-float4 { animation: float4 9s infinite cubic-bezier(0.4, 0, 0.2, 1) 1.5s; }
      `}</style>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Points Card */}
            <div className="bg-gradient-to-r from-[#8d6e63] to-[#6d4c41] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">คะแนนสะสมของคุณ</p>
                  <p className="text-4xl font-bold">{userInfo.userpoint}</p>
                </div>
                <Icons.Star className="w-12 h-12 text-white/80" />
              </div>
            </div>

            {/* User ID Section */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <button
                onClick={() => setShowUserId(!showUserId)}
                className="w-full flex items-center justify-between text-left hover:text-[#5d4037] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#8d6e63] to-[#6d4c41] rounded-lg flex items-center justify-center text-white">
                    <Icons.Eye open={showUserId} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">รหัสผู้ใช้งาน</p>
                    <p className="text-sm text-slate-500">
                      {showUserId ? 'คลิกเพื่อซ่อน' : 'คลิกเพื่อแสดง'}
                    </p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform ${showUserId ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserId && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm text-slate-600 font-mono flex-1 break-all">
                      {userInfo.uid || 'ไม่พบข้อมูล'}
                    </code>
                    <button
                      onClick={() => copyToClipboard(userInfo.uid)}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#5d4037] to-[#3e2723] hover:from-[#4a2c2a] hover:to-[#2e1912] text-white px-3 py-2 rounded-lg text-sm transition-all duration-200"
                    >
                      <Icons.Copy />
                      คัดลอก
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* System Info */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">อัปเดตล่าสุด</span>
                <span className="text-slate-500 font-mono">
                  {new Date().toLocaleString('th-TH', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}