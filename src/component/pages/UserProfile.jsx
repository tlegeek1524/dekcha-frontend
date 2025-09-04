import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import liff from '@line/liff';
import DOMPurify from 'dompurify';
import Cookies from 'js-cookie';
import Navbar from '../navbar';
import Spinner from '../util/LoadSpinner';

const Icons = {
  Error: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" /></svg>,
  User: () => <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Star: ({ className = "w-6 h-6 text-yellow-400" }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Copy: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Eye: ({ open }) => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{open ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />}</svg>,
  Spinner: () => <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
  Activity: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
};

const LIFF_ID = import.meta.env.VITE_LIFF_ID;
const API_URL = import.meta.env.VITE_API_URL;

// Enhanced cache with smart invalidation
const cache = new Map();
const getCached = (key, maxAge = 90000) => { // 1.5min default
  const item = cache.get(key);
  return item && Date.now() - item.time < maxAge ? item.data : null;
};
const setCache = (key, data) => cache.set(key, { data, time: Date.now() });
const invalidateCache = (key) => cache.delete(key);

// Smart API with background fetching
const api = async (url, options = {}) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);

  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

// Background fetch for silent updates
const backgroundFetch = async (url, options = {}) => {
  try {
    return await api(url, options);
  } catch (err) {
    console.warn('Background fetch failed:', err);
    return null;
  }
};

const Toast = React.memo(({ message, type, show }) => {
  if (!show) return null;
  const styles = { 
    success: 'bg-emerald-500', 
    error: 'bg-red-500', 
    info: 'bg-blue-500',
    update: 'bg-indigo-500'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${styles[type]} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 transition-all duration-300 transform ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      {type === 'success' && <Icons.Check />}
      {type === 'error' && <Icons.Error />}
      {type === 'info' && <Icons.Spinner />}
      {type === 'update' && <Icons.Activity />}
      <span className="font-medium">{message}</span>
    </div>
  );
});

// Smart polling hook
const useSmartPolling = (callback, interval = 30000) => {
  const savedCallback = useRef();
  const intervalRef = useRef();
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    savedCallback.current = callback;
  });

  const startPolling = useCallback(() => {
    setIsPolling(true);
    intervalRef.current = setInterval(() => {
      savedCallback.current?.();
    }, interval);
  }, [interval]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
        savedCallback.current?.(); // Immediate fetch when page becomes visible
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    if (!document.hidden) startPolling();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return isPolling;
};

export default function UserProfile() {
  const [userInfo, setUserInfo] = useState({ uid: '', name: '', userpoint: 0, profile: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showUserId, setShowUserId] = useState(false);
  const [lastSync, setLastSync] = useState(Date.now());
  const [pointsAnimation, setPointsAnimation] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const abortRef = useRef();
  const nextSyncRef = useRef();

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500);
  }, []);

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => showToast('คัดลอกเรียบร้อยแล้ว', 'success'))
      .catch(() => showToast('เกิดข้อผิดพลาดในการคัดลอก', 'error'));
  };

  // Background sync with change detection
  const backgroundSync = useCallback(async (profile) => {
    if (!profile?.userId) return;

    try {
      const token = Cookies.get('authToken');
      if (!token) return;

      const userData = await backgroundFetch(`${API_URL}/users/${profile.userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (userData) {
        setUserInfo(prev => {
          const hasChanges = JSON.stringify(prev) !== JSON.stringify({ ...prev, ...userData });
          
          if (hasChanges) {
            const pointsChanged = userData.userpoint !== prev.userpoint;
            
            if (pointsChanged && prev.userpoint > 0) {
              setPointsAnimation(true);
              setTimeout(() => setPointsAnimation(false), 1200);
              
              const diff = userData.userpoint - prev.userpoint;
              showToast(
                `คะแนน${diff > 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(diff).toLocaleString()} แต้ม`, 
                'update'
              );
            }

            setLastSync(Date.now());
            setSyncCount(prev => prev + 1);
            setCache(`user_${profile.userId}`, userData);
          }

          return hasChanges ? { ...prev, ...userData } : prev;
        });
      }
    } catch (err) {
      console.warn('Background sync error:', err);
    }
  }, [showToast]);

  // Smart polling with adaptive intervals
  const isPolling = useSmartPolling(
    () => backgroundSync(userInfo.profile),
    syncCount > 10 ? 45000 : 30000 // Slower polling after many syncs
  );

  const syncData = useCallback(async (profile, silent = false) => {
    if (!profile?.userId) return;

    const cacheKey = `user_${profile.userId}`;
    const cached = getCached(cacheKey);
    if (cached && silent) {
      setUserInfo(prev => ({ ...prev, ...cached }));
      return;
    }

    try {
      const token = Cookies.get('authToken');
      if (!token) throw new Error('No token');

      if (!silent) {
        showToast('กำลังอัปเดต...', 'info');
        setIsUpdating(true);
      }

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      let userData;
      try {
        userData = await api(`${API_URL}/users/${profile.userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        if (err.message.includes('404') || err.message.includes('400')) {
          const userDataToSend = {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl
          };

          if (!silent) showToast('กำลังสร้างบัญชี...', 'info');

          try {
            await api(`${API_URL}/users`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: JSON.stringify(userDataToSend)
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            userData = await api(`${API_URL}/users/${profile.userId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (postError) {
            console.error('Failed to create user:', postError);
            userData = {
              uid: profile.userId,
              name: profile.displayName,
              userpoint: 0,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl
            };
          }
        } else throw err;
      }

      setCache(cacheKey, userData);
      setUserInfo(prev => ({ ...prev, ...userData }));
      setLastSync(Date.now());
      if (!silent) showToast('อัปเดตสำเร็จ', 'success');

    } catch (err) {
      console.error('Sync error:', err);
      if (!silent) showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsUpdating(false);
    }
  }, [showToast]);

  // Prefetch on user interactions
  const prefetchData = useCallback(() => {
    if (userInfo.profile) {
      backgroundSync(userInfo.profile);
    }
  }, [backgroundSync, userInfo.profile]);

  // LIFF initialization
  useEffect(() => {
    const init = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const idToken = liff.getIDToken();
        if (!idToken) throw new Error('No token');

        Cookies.set('authToken', idToken, { secure: true, sameSite: 'Strict', expires: 1 });

        const profile = await liff.getProfile();
        setUserInfo(prev => ({ ...prev, profile }));
        await syncData(profile);

      } catch (err) {
        console.error('LIFF error:', err);
        setError('เกิดข้อผิดพลาด: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    init();
    return () => abortRef.current?.abort();
  }, [syncData]);

  // Add event listeners for user activity
  useEffect(() => {
    const events = ['click', 'scroll', 'keydown'];
    const handler = () => {
      if (Date.now() - lastSync > 60000) { // If last sync > 1min ago
        prefetchData();
      }
    };

    events.forEach(event => document.addEventListener(event, handler, { passive: true }));
    return () => events.forEach(event => document.removeEventListener(event, handler));
  }, [lastSync, prefetchData]);

  const safeName = useMemo(() =>
    DOMPurify.sanitize(userInfo.name || userInfo.profile?.displayName || ''),
    [userInfo.name, userInfo.profile?.displayName]
  );

  const user = useMemo(() => ({
    uid: userInfo.uid,
    name: safeName,
    userpoint: userInfo.userpoint,
    profile: userInfo.profile,
    pictureUrl: userInfo.profile?.pictureUrl
  }), [userInfo, safeName]);

  const formatLastSync = useMemo(() => {
    const diff = Date.now() - lastSync;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    
    if (seconds < 30) return 'เมื่อสักครู่นี้';
    if (minutes < 1) return `${seconds} วินาทีที่แล้ว`;
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    return new Date(lastSync).toLocaleString('th-TH', { timeStyle: 'short' });
  }, [lastSync]);

  if (loading) return <Spinner />;
  if (error) return (
    <div className="fixed inset-0 bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="text-red-500 mb-4 flex justify-center"><Icons.Error /></div>
        <p className="text-center mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="w-full bg-gradient-to-r from-[#6d4c41] to-[#3e2723] text-white py-3 rounded-xl hover:bg-gradient-to-r hover:from-[#5d4037] hover:to-[#2e1912] transition-colors">
          รีเฟรช
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar user={user} safeName={safeName} />
      <Toast {...toast} />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">

          {/* Hero Section */}
          <div className="bg-gradient-to-br from-[#8d6e63] to-[#3e2723] px-8 py-12 text-white relative">
            <div className="text-center">
              <div className="mb-6">
                {user.pictureUrl ? (
                  <img 
                    src={user.pictureUrl} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full mx-auto shadow-2xl ring-4 ring-amber-200/30 transition-transform hover:scale-105 cursor-pointer" 
                    loading="lazy" 
                    onClick={prefetchData}
                  />
                ) : (
                  <div className="w-24 h-24 bg-amber-100/20 rounded-full mx-auto flex items-center justify-center shadow-2xl ring-4 ring-amber-200/30">
                    <Icons.User />
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-2 font-serif text-amber-50">{safeName}</h1>

              <div className="flex items-center justify-center gap-3 text-sm opacity-90">
                <div className={`w-2 h-2 rounded-full transition-colors ${
                  isUpdating ? 'bg-amber-400 animate-pulse' : 
                  isPolling ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                }`}></div>
                <span className="font-light">
                  {isUpdating ? 'กำลังอัปเดต...' : 
                   isPolling ? 'กำลังออนไลน์' : 'พักพิง'}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Points with enhanced animation */}
            <div 
              className={`bg-gradient-to-r from-[#8d6e63] to-[#3e2723] rounded-2xl p-6 text-white shadow-lg transition-all duration-700 cursor-pointer ${pointsAnimation ? 'scale-105 ring-4 ring-emerald-400/50 shadow-2xl' : 'hover:scale-102'}`}
              onClick={prefetchData}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">คะแนนสะสม</p>
                  <p className={`text-4xl font-bold transition-all duration-500 ${pointsAnimation ? 'text-emerald-200 scale-110' : ''}`}>
                    {userInfo.userpoint.toLocaleString()}
                  </p>
                  <p className="text-xs opacity-75 mt-1 flex items-center gap-1">
                    <Icons.Refresh />
                    คลิกเพื่อรีเฟรช
                  </p>
                </div>
                <Icons.Star className={`w-12 h-12 text-white/80 transition-all duration-500 ${pointsAnimation ? 'text-emerald-200 rotate-12 scale-125' : 'hover:rotate-6'}`} />
              </div>
            </div>

            {/* User ID */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <button 
                onClick={() => setShowUserId(!showUserId)} 
                className="w-full flex items-center justify-between text-left hover:text-[#5d4037] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#8d6e63] to-[#3e2723] rounded-lg flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                    <Icons.Eye open={showUserId} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">รหัสผู้ใช้งาน</p>
                    <p className="text-sm text-slate-500">{showUserId ? 'คลิกเพื่อซ่อน' : 'คลิกเพื่อแสดง'}</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${showUserId ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserId && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm text-slate-600 font-mono flex-1 break-all">{userInfo.uid || 'ไม่พบข้อมูล'}</code>
                    <button 
                      onClick={() => copyToClipboard(userInfo.uid)} 
                      className="flex items-center gap-2 bg-gradient-to-r from-[#6d4c41] to-[#3e2723] hover:from-[#5d4037] hover:to-[#2e1912] text-white px-3 py-2 rounded-lg text-sm transition-all active:scale-95 hover:shadow-lg"
                    >
                      <Icons.Copy />คัดลอก
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced System Info */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">โหมดการทำงาน</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></div>
                    <span className={`font-mono ${isPolling ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {isPolling ? 'Smart Polling' : 'พักการทำงาน'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">อัปเดตล่าสุด</span>
                  <span className="text-slate-500 font-mono">{formatLastSync}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">ซิงค์แล้ว</span>
                  <span className="text-slate-500 font-mono">{syncCount} ครั้ง</span>
                </div>
              </div>
            </div>

            {/* Manual refresh button */}
            <button
              onClick={() => syncData(userInfo.profile)}
              disabled={isUpdating}
              className="w-full bg-gradient-to-r from-[#6d4c41] to-[#3e2723] hover:from-[#5d4037] hover:to-[#2e1912] disabled:opacity-50 text-white py-3 px-4 rounded-xl transition-all active:scale-95 hover:shadow-lg flex items-center justify-center gap-2"
            >
              <div className={`transition-transform ${isUpdating ? 'animate-spin' : 'hover:rotate-180'}`}>
                {isUpdating ? <Icons.Spinner /> : <Icons.Refresh />}
              </div>
              {isUpdating ? 'กำลังอัปเดต...' : 'รีเฟรชทันที'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}