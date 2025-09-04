import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import liff from '@line/liff';
import DOMPurify from 'dompurify';
import Cookies from 'js-cookie';
import Navbar from '../navbar';
import Spinner from '../util/LoadSpinner';

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    return new Promise(resolve => {
      timeout = setTimeout(() => resolve(func(...args)), wait);
    });
  };
};

const API_URL = import.meta.env.VITE_API_URL;
const LIFF_ID = import.meta.env.VITE_LIFF_ID;

const Icons = {
  Error: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Spinner: () => <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
  Activity: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Phone: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
};

const cache = new Map();
const getCached = (key, maxAge = 90000) => {
  const item = cache.get(key);
  return item && Date.now() - item.time < maxAge ? item.data : null;
};
const setCache = (key, data) => cache.set(key, { data, time: Date.now() });

const api = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const backgroundFetch = async (url, options = {}) => {
  try {
    return await api(url, options);
  } catch {
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

const useSmartPolling = (callback, interval = 45000, enabled = true) => {
  const savedCallback = useRef();
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    let intervalId;
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(intervalId);
      } else {
        savedCallback.current?.();
        intervalId = setInterval(() => savedCallback.current?.(), interval);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility, { passive: true });
    if (!document.hidden) {
      savedCallback.current?.();
      intervalId = setInterval(() => savedCallback.current?.(), interval);
    }
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalId);
    };
  }, [interval, enabled]);
};

const UserInfo = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [lastSync, setLastSync] = useState(Date.now());
  const [syncCount, setSyncCount] = useState(0);
  const [dataAnimation, setDataAnimation] = useState(false);
  const abortRef = useRef();
  const ongoingRequests = useRef(new Set());

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500);
  }, []);

  const debouncedBackgroundSync = useMemo(() => debounce(async () => {
    if (!profile?.userId) return;
    const token = Cookies.get('authToken');
    if (!token) return;
    const requestKey = `user_${profile.userId}`;
    if (ongoingRequests.current.has(requestKey)) return;
    ongoingRequests.current.add(requestKey);
    try {
      const userData = await backgroundFetch(`${API_URL}/users/${profile.userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userData) {
        setUser(prev => {
          if (!prev || JSON.stringify(prev) === JSON.stringify(userData)) return prev;
          setDataAnimation(true);
          setTimeout(() => setDataAnimation(false), 1200);
          const pointsChanged = userData.userpoint !== prev.userpoint;
          if (pointsChanged) {
            const diff = userData.userpoint - prev.userpoint;
            showToast(`คะแนน${diff > 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(diff).toFixed(2)} แต้ม`, 'update');
          }
          setLastSync(Date.now());
          setSyncCount(p => p + 1);
          setCache(`user_${profile.userId}`, userData);
          return userData;
        });
      }
    } finally {
      ongoingRequests.current.delete(requestKey);
    }
  }, 1000), [profile, showToast]);

  useSmartPolling(
    debouncedBackgroundSync,
    syncCount > 5 ? 60000 : 45000,
    !!user && !isEditing && !loading
  );

  const debouncedFetchUserData = useMemo(() => debounce(async (silent = false) => {
    if (!profile?.userId) return;
    const cacheKey = `user_${profile.userId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setUser(cached);
      setPhoneNumber(cached.phonenumber || '');
      if (silent) return;
    }
    const requestKey = `user_${profile.userId}`;
    if (ongoingRequests.current.has(requestKey)) return;
    ongoingRequests.current.add(requestKey);
    try {
      if (!silent) {
        setLoading(true);
        showToast('กำลังโหลดข้อมูล...', 'info');
      }
      const token = Cookies.get('authToken');
      if (!token) throw new Error('No token');
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      let userData = await api(`${API_URL}/users/${profile.userId}`, {
        signal: abortRef.current.signal,
        headers: { Authorization: `Bearer ${token}` }
      }).catch(async err => {
        if (err.message.includes('404') || err.message.includes('400')) {
          const userDataToSend = {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl
          };
          if (!silent) showToast('กำลังสร้างบัญชี...', 'info');
          await api(`${API_URL}/users`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(userDataToSend)
          });
          await new Promise(r => setTimeout(r, 1000));
          return api(`${API_URL}/users/${profile.userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        throw err;
      });
      setCache(cacheKey, userData);
      setUser(userData);
      setPhoneNumber(userData.phonenumber || '');
      setLastSync(Date.now());
      if (!silent) showToast('โหลดข้อมูลสำเร็จ', 'success');
    } catch (err) {
      if (err.name !== 'AbortError') {
        if (!silent) showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
      }
    } finally {
      ongoingRequests.current.delete(requestKey);
      if (!silent) setLoading(false);
    }
  }, 1000), [profile, showToast]);

  const handleUpdatePhoneNumber = useCallback(async () => {
    if (!phoneNumber.trim()) return showToast('กรุณาใส่เบอร์โทรศัพท์', 'error');
    const phoneRegex = /^[0-9]{9,10}$/;
    if (!phoneRegex.test(phoneNumber)) return showToast('กรุณาใส่เบอร์โทรศัพท์ที่ถูกต้อง (9-10 หลัก)', 'error');
    const requestKey = `update_phone_${user.uid}`;
    if (ongoingRequests.current.has(requestKey)) return;
    ongoingRequests.current.add(requestKey);
    try {
      setUpdating(true);
      showToast('กำลังอัปเดต...', 'info');
      const token = Cookies.get('authToken');
      if (!token) throw new Error('No token');
      await api(`${API_URL}/users/phonenumber/${user.uid}`, {
        method: 'POST',
        body: JSON.stringify({ phonenumber: phoneNumber }),
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedUser = { ...user, phonenumber: phoneNumber };
      setUser(updatedUser);
      setCache(`user_${profile.userId}`, updatedUser);
      showToast('อัปเดตเบอร์โทรศัพท์สำเร็จ', 'success');
      setIsEditing(false);
      setLastSync(Date.now());
    } catch (err) {
      showToast('ไม่สามารถอัปเดตเบอร์โทรศัพท์ได้', 'error');
    } finally {
      ongoingRequests.current.delete(requestKey);
      setUpdating(false);
    }
  }, [phoneNumber, user, profile, showToast]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setPhoneNumber(user?.phonenumber || '');
  }, [user]);

  const prefetchData = useCallback(() => {
    if (profile?.userId && !isEditing) debouncedBackgroundSync();
  }, [debouncedBackgroundSync, profile, isEditing]);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) return liff.login();
        const idToken = liff.getIDToken();
        if (!idToken) throw new Error('No token');
        Cookies.set('authToken', idToken, { secure: true, sameSite: 'Strict', expires: 1 });
        setProfile(await liff.getProfile());
      } catch (err) {
        showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
      }
    };
    initLiff();
    return () => abortRef.current?.abort();
  }, [showToast]);

  useEffect(() => {
    if (profile) debouncedFetchUserData();
  }, [profile, debouncedFetchUserData]);

  useEffect(() => {
    const handler = debounce(() => {
      if (Date.now() - lastSync > 120000) prefetchData();
    }, 1000);
    const events = ['click', 'scroll', 'keydown'];
    const eventsOptions = { passive: true };
    events.forEach(e => document.addEventListener(e, handler, eventsOptions));
    return () => events.forEach(e => document.removeEventListener(e, handler));
  }, [lastSync, prefetchData]);

  const getRoleDisplay = useCallback(role => 
    role === 'admin' ? 'ผู้ดูแลระบบ' : role === 'user' ? 'ผู้ใช้งาน' : role, 
  );

  const getStatusDisplay = useCallback(isActive => 
    isActive ? 'ใช้งานได้' : 'ไม่ใช้งาน', 
  );

  const safeName = useMemo(() => 
    DOMPurify.sanitize(user?.displayName || profile?.displayName || ''), 
    [user, profile]
  );

  const navbarUser = useMemo(() => ({
    uid: user?.uid || profile?.userId,
    name: safeName,
    userpoint: user?.userpoint || 0,
    profile,
    pictureUrl: user?.pictureurl || profile?.pictureUrl
  }), [user, profile, safeName]);

  const formatLastSync = useMemo(() => {
    const diff = Date.now() - lastSync;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    if (seconds < 30) return 'เมื่อสักครู่นี้';
    if (minutes < 1) return `${seconds} วินาทีที่แล้ว`;
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    return new Date(lastSync).toLocaleString('th-TH', { timeStyle: 'short' });
  }, [lastSync]);

  const handlePhoneInput = useCallback((e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPhoneNumber(value);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Spinner />
        <Navbar user={navbarUser} safeName={safeName} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar user={navbarUser} safeName={safeName} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-8 text-center">
              <Icons.Error />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">ไม่พบข้อมูลผู้ใช้</h2>
              <button 
                onClick={() => debouncedFetchUserData()} 
                className="bg-gradient-to-r from-[#6d4c41] to-[#3e2723] hover:from-[#5d4037] hover:to-[#2e1912] text-white px-6 py-3 rounded-xl transition-all active:scale-95"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={navbarUser} safeName={safeName} />
      <Toast {...toast} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden"> {/* เปลี่ยน border เป็น gray-200 */}
            <div className="bg-gradient-to-br from-[#8d6e63] to-[#3e2723] px-8 py-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white/30 bg-white/20 flex items-center justify-center shadow-2xl">
                    {user.pictureurl ? (
                      <img
                        src={user.pictureurl}
                        alt={user.displayName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={e => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-xl font-bold" style={{ display: user.pictureurl ? 'none' : 'flex' }}>
                      {user.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold font-serif">{user.displayName}</h1>
                    <p className="text-amber-50 text-sm">รหัสผู้ใช้: {user.uid}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200"> {/* เปลี่ยน bg และ border เป็น white/gray */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">User ID</h3>
                    <code className="text-sm text-gray-600 font-mono bg-gray-50 px-3 py-1 rounded-lg border"> {/* เปลี่ยน bg เป็น gray-50 */}
                      {user.uid}
                    </code>
                  </div>
                  <button
                    onClick={prefetchData}
                    className="p-2 bg-[#6d4c41] hover:bg-[#5d4037] text-white rounded-lg transition-all active:scale-95"
                    title="รีเฟรชข้อมูล"
                  >
                    <Icons.Refresh />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200"> {/* เปลี่ยน bg และ border เป็น white/gray */}
                  <h3 className="font-medium text-gray-700 mb-2">สถานะ</h3>
                  <span className={`px-3 py-2 rounded-full text-sm font-medium inline-flex items-center ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800' // เปลี่ยน bg เป็น gray-100
                  }`}>
                    {getRoleDisplay(user.role)}
                  </span>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200"> {/* เปลี่ยน bg และ border เป็น white/gray */}
                  <h3 className="font-medium text-gray-700 mb-2">การใช้งาน</h3>
                  <span className={`px-3 py-2 rounded-full text-sm font-medium inline-flex items-center ${
                    user.isactive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {getStatusDisplay(user.isactive)}
                  </span>
                </div>
              </div>

              <div 
                className={`bg-gradient-to-r from-[#6d4c41] to-[#3e2723] rounded-2xl p-6 text-white shadow-lg transition-all duration-700 cursor-pointer ${
                  dataAnimation ? 'scale-105 ring-4 ring-gray-400/50 shadow-2xl' : 'hover:scale-102' // เปลี่ยน ring เป็น gray-400/50
                }`}
                onClick={prefetchData}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">คะแนนสะสม</p>
                    <p className={`text-3xl font-bold transition-all duration-500 ${
                      dataAnimation ? 'text-white scale-110' : '' // เปลี่ยน text-amber-100 เป็น text-white
                    }`}>
                      {user.userpoint?.toFixed(2)} แต้ม
                    </p>
                  </div>
                  <Icons.Activity />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200"> {/* เปลี่ยน bg และ border เป็น white/gray */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#6d4c41] to-[#3e2723] rounded-lg flex items-center justify-center text-white">
                      <Icons.Phone />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700">เบอร์โทรศัพท์</h3>
                      <p className="text-sm text-gray-500">
                        {isEditing ? 'กรอกเบอร์โทรศัพท์' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneInput}
                      pattern="[0-9]*"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-[#6d4c41] focus:ring-2 focus:ring-[#8d6e63] transition-all" // เปลี่ยน focus:border และ focus:ring
                      placeholder="เบอร์โทรศัพท์ (9-10 หลัก)"
                      disabled={updating}
                      maxLength="10"
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleUpdatePhoneNumber}
                        disabled={updating}
                        className="flex-1 bg-gradient-to-r from-[#6d4c41] to-[#3e2723] hover:from-[#5d4037] hover:to-[#2e1912] disabled:opacity-50 text-white py-3 px-4 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        {updating ? <Icons.Spinner /> : <Icons.Check />}
                        {updating ? 'กำลังบันทึก...' : 'บันทึก'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={updating}
                        className="px-6 bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-all active:scale-95"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-lg text-gray-800 font-mono">
                      {user.phonenumber || 'ไม่ระบุ'}
                    </span>
                    {!user.phonenumber && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-[#6d4c41] to-[#3e2723] hover:from-[#5d4037] hover:to-[#2e1912] text-white px-4 py-2 rounded-lg font-medium transition-all active:scale-95"
                      >
                        <Icons.Edit />
                        แก้ไข
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => debouncedFetchUserData()}
                disabled={updating || loading}
                className="w-full bg-gradient-to-r from-[#6d4c41] to-[#3e2723] hover:from-[#5d4037] hover:to-[#2e1912] disabled:opacity-50 text-white py-4 px-4 rounded-xl font-medium transition-all active:scale-95 hover:shadow-lg flex items-center justify-center gap-2"
              >
                <div className={`transition-transform ${updating || loading ? 'animate-spin' : 'hover:rotate-180'}`}>
                  {updating || loading ? <Icons.Spinner /> : <Icons.Refresh />}
                </div>
                {updating || loading ? 'กำลังรีเฟรช...' : 'รีเฟรชทันที'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;