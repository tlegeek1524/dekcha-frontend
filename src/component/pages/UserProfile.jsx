import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import liff from '@line/liff';
import DOMPurify from 'dompurify';
import Cookies from 'js-cookie';
import Navbar from '../navbar'; // Make sure Navbar component is correctly imported
import Spinner from '../util/LoadSpinner';

// --- ICONS ---
// No visual changes, kept for functionality
const Icons = {
  Error: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" /></svg>,
  User: () => <svg className="w-10 h-10 text-[#f5f5f5]/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Star: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  Check: ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Copy: ({ className = "w-4 h-4" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Eye: ({ open, className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">{open ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />}</svg>,
  Spinner: ({ className = "w-5 h-5" }) => <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
  Activity: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7" /></svg>,
  Refresh: ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Chevron: ({ open }) => <svg className={`w-5 h-5 text-stone-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
};

// --- ENVIRONMENT & API / HOOKS --- (No changes to logic)
const LIFF_ID = import.meta.env.VITE_LIFF_ID;
const API_URL = import.meta.env.VITE_API_URL;
const cache = new Map();
const getCached = (key, maxAge = 90000) => { const item = cache.get(key); return item && Date.now() - item.time < maxAge ? item.data : null; };
const setCache = (key, data) => cache.set(key, { data, time: Date.now() });
const api = async (url, options = {}) => { const controller = new AbortController(); setTimeout(() => controller.abort(), 5000); const response = await fetch(url, { ...options, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...options.headers } }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); };
const backgroundFetch = async (url, options = {}) => { try { return await api(url, options); } catch (err) { console.warn('Background fetch failed:', err); return null; } };
const useSmartPolling = (callback, interval = 30000) => { const savedCallback = useRef(); const intervalRef = useRef(); const [isPolling, setIsPolling] = useState(false); useEffect(() => { savedCallback.current = callback; }); const startPolling = useCallback(() => { setIsPolling(true); intervalRef.current = setInterval(() => savedCallback.current?.(), interval); }, [interval]); const stopPolling = useCallback(() => { setIsPolling(false); clearInterval(intervalRef.current); }, []); useEffect(() => { const handleVisibilityChange = () => { if (document.hidden) { stopPolling(); } else { startPolling(); savedCallback.current?.(); } }; document.addEventListener('visibilitychange', handleVisibilityChange); if (!document.hidden) startPolling(); return () => { document.removeEventListener('visibilitychange', handleVisibilityChange); stopPolling(); }; }, [startPolling, stopPolling]); return isPolling; };

// --- UI SUB-COMPONENTS with new color theme ---

const Toast = React.memo(({ message, type, show }) => {
  if (!show) return null;
  const styles = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-[#3e2723]', // Dark Espresso
    update: 'bg-amber-600'
  };
  return (<div className={`fixed top-5 right-5 z-50 ${styles[type]} text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}><span className="font-medium text-sm" style={{fontFamily: 'Kanit, sans-serif'}}>{message}</span></div>);
});

const ProfileHeader = React.memo(({ user, safeName, isUpdating, isPolling, prefetchData }) => (
  <div className="bg-gradient-to-br from-[#5d4037] to-[#3e2723] px-6 py-8 text-[#f5f5f5] relative">
    <div className="text-center relative z-10">
      <div className="mb-4">
        {user.pictureUrl ? (
          <img src={user.pictureUrl} alt="Profile" className="w-24 h-24 rounded-full mx-auto shadow-2xl ring-4 ring-[#f5f5f5]/20 transition-transform duration-300 hover:scale-105 cursor-pointer" loading="lazy" onClick={prefetchData} />
        ) : (
          <div className="w-24 h-24 bg-gradient-to-br from-[#a1887f] to-[#8d6e63] rounded-full mx-auto flex items-center justify-center shadow-lg ring-4 ring-[#f5f5f5]/20"><Icons.User /></div>
        )}
      </div>
      <h1 className="text-2xl font-semibold mb-2 text-[#f5f5f5] tracking-wide" style={{fontFamily: 'Kanit, sans-serif'}}>{safeName}</h1>
      <div className="flex items-center justify-center gap-2 text-xs opacity-80">
        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${isUpdating ? 'bg-amber-400 animate-pulse' : isPolling ? 'bg-emerald-400' : 'bg-gray-400'}`}></div>
        <span className="font-light">{isUpdating ? 'กำลังอัปเดต...' : isPolling ? 'ออนไลน์' : 'ไม่ได้ใช้งาน'}</span>
      </div>
    </div>
  </div>
));

const PointsCard = React.memo(({ userpoint, pointsAnimation, prefetchData }) => (
  <div className={`bg-gradient-to-br from-[#5d4037] to-[#3e2723] rounded-2xl p-6 text-[#f5f5f5] shadow-xl transition-all duration-500 cursor-pointer relative overflow-hidden group ${pointsAnimation ? 'scale-105 shadow-2xl' : 'hover:scale-[1.02] hover:shadow-2xl'}`} onClick={prefetchData}>
    <div className={`absolute top-0 left-[-100%] h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ${pointsAnimation ? 'translate-x-[200%]' : ''}`}></div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm opacity-80 mb-1 tracking-wider" style={{fontFamily: 'Prompt, sans-serif'}}>คะแนนสะสม</p>
        <p className={`text-4xl font-bold transition-colors duration-500 ${pointsAnimation ? 'text-amber-300' : 'text-[#f5f5f5]'}`}>{userpoint.toLocaleString()}</p>
        <p className="text-xs opacity-60 mt-2 flex items-center gap-1.5 transition-opacity group-hover:opacity-100"><Icons.Refresh className="w-3 h-3" />คลิกเพื่อรีเฟรช</p>
      </div>
      <Icons.Star className={`w-12 h-12 text-amber-400/80 transition-all duration-500 ${pointsAnimation ? 'rotate-12 scale-125' : 'group-hover:rotate-6'}`} />
    </div>
  </div>
));

const UserIdAccordion = React.memo(({ uid, copyToClipboard }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = () => { if (!uid) return; copyToClipboard(uid); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); };
  
  return (
    <div className="bg-[#f5f5f5] rounded-2xl p-4 border border-[#8d6e63]/30 transition-all duration-300">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between text-left group">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#5d4037] to-[#3e2723] rounded-lg flex items-center justify-center text-[#f5f5f5] transition-transform duration-300 group-hover:scale-105"><Icons.Eye open={isOpen} /></div>
          <div>
            <p className="font-medium text-[#3e2723]" style={{fontFamily: 'Kanit, sans-serif'}}>รหัสผู้ใช้</p>
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
              {isCopied ? <Icons.Check /> : <Icons.Copy />}<span style={{fontFamily: 'Kanit, sans-serif'}}>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

const RefreshButton = React.memo(({ onClick, isUpdating }) => (
    <button onClick={onClick} disabled={isUpdating} className="w-full bg-gradient-to-r from-[#5d4037] to-[#3e2723] hover:from-[#3e2723] hover:to-[#2e1912] disabled:opacity-60 disabled:cursor-not-allowed text-[#f5f5f5] py-3 px-4 rounded-2xl transition-all duration-300 active:scale-95 hover:shadow-xl flex items-center justify-center gap-2.5">
      <div className={`transition-transform duration-500 ${isUpdating ? 'animate-spin' : 'group-hover:rotate-180'}`}>{isUpdating ? <Icons.Spinner /> : <Icons.Refresh />}</div>
      <span className="text-base font-medium" style={{fontFamily: 'Kanit, sans-serif'}}>{isUpdating ? 'กำลังอัปเดต...' : 'รีเฟรชตอนนี้'}</span>
    </button>
));

// --- MAIN COMPONENT ---

export default function UserProfile() {
  const [userInfo, setUserInfo] = useState({ uid: '', name: '', userpoint: 0, profile: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [lastSync, setLastSync] = useState(Date.now());
  const [pointsAnimation, setPointsAnimation] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const abortRef = useRef();
  
  // --- CORE LOGIC --- (No changes to logic)
  const showToast = useCallback((message, type = 'info') => { setToast({ show: true, message, type }); setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500); }, []);
  const copyToClipboard = (text) => { if (!text) return; navigator.clipboard.writeText(text).then(() => showToast('คัดลอกไปยังคลิปบอร์ดแล้ว', 'success')).catch(() => showToast('ไม่สามารถคัดลอกได้', 'error')); };
  const backgroundSync = useCallback(async (profile) => { if (!profile?.userId) return; try { const token = Cookies.get('authToken'); if (!token) return; const userData = await backgroundFetch(`${API_URL}/users/${profile.userId}`, { headers: { Authorization: `Bearer ${token}` } }); if (userData) { setUserInfo(prev => { const hasChanges = JSON.stringify(prev) !== JSON.stringify({ ...prev, ...userData }); if (hasChanges) { if (userData.userpoint !== prev.userpoint && prev.userpoint > 0) { setPointsAnimation(true); setTimeout(() => setPointsAnimation(false), 1200); const diff = userData.userpoint - prev.userpoint; showToast(`คะแนน ${diff > 0 ? '+' : ''}${diff.toLocaleString()}`, 'update'); } setLastSync(Date.now()); setSyncCount(c => c + 1); setCache(`user_${profile.userId}`, userData); } return hasChanges ? { ...prev, ...userData } : prev; }); } } catch (err) { console.warn('Background sync error:', err); } }, [showToast]);
  const isPolling = useSmartPolling(() => backgroundSync(userInfo.profile), syncCount > 10 ? 45000 : 30000);
  const syncData = useCallback(async (profile, silent = false) => { if (!profile?.userId) return; const cacheKey = `user_${profile.userId}`; const cached = getCached(cacheKey); if (cached && silent) { setUserInfo(prev => ({ ...prev, ...cached })); return; } try { const token = Cookies.get('authToken'); if (!token) throw new Error('No token'); if (!silent) { showToast('กำลังอัปเดต...', 'info'); setIsUpdating(true); } if (abortRef.current) abortRef.current.abort(); abortRef.current = new AbortController(); let userData; try { userData = await api(`${API_URL}/users/${profile.userId}`, { headers: { Authorization: `Bearer ${token}` } }); } catch (err) { if (err.message.includes('404') || err.message.includes('400')) { const userDataToSend = { userId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl }; if (!silent) showToast('กำลังสร้างบัญชี...', 'info'); try { await api(`${API_URL}/users`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(userDataToSend) }); await new Promise(r => setTimeout(r, 1000)); userData = await api(`${API_URL}/users/${profile.userId}`, { headers: { Authorization: `Bearer ${token}` } }); } catch (postError) { console.error('Failed to create user:', postError); userData = { uid: profile.userId, name: profile.displayName, userpoint: 0, displayName: profile.displayName, pictureUrl: profile.pictureUrl }; } } else throw err; } setCache(cacheKey, userData); setUserInfo(prev => ({ ...prev, ...userData })); setLastSync(Date.now()); if (!silent) showToast('อัปเดตสำเร็จ', 'success'); } catch (err) { console.error('Sync error:', err); if (!silent) showToast('เกิดข้อผิดพลาด', 'error'); } finally { setIsUpdating(false); } }, [showToast]);
  const prefetchData = useCallback(() => { if (userInfo.profile) backgroundSync(userInfo.profile); }, [backgroundSync, userInfo.profile]);
  useEffect(() => { const init = async () => { try { await liff.init({ liffId: LIFF_ID }); if (!liff.isLoggedIn()) { liff.login(); return; } const idToken = liff.getIDToken(); if (!idToken) throw new Error('No ID Token'); Cookies.set('authToken', idToken, { secure: true, sameSite: 'Strict', expires: 1 }); const profile = await liff.getProfile(); setUserInfo(prev => ({ ...prev, profile })); await syncData(profile); } catch (err) { console.error('LIFF error:', err); setError('การเริ่มต้นล้มเหลว: ' + err.message); } finally { setLoading(false); } }; init(); return () => abortRef.current?.abort(); }, [syncData]);
  useEffect(() => { const handler = () => { if (Date.now() - lastSync > 60000) prefetchData(); }; const events = ['click', 'scroll', 'keydown']; events.forEach(e => document.addEventListener(e, handler, { passive: true })); return () => events.forEach(e => document.removeEventListener(e, handler)); }, [lastSync, prefetchData]);
  const safeName = useMemo(() => DOMPurify.sanitize(userInfo.name || userInfo.profile?.displayName || 'ผู้ใช้งาน'), [userInfo.name, userInfo.profile?.displayName]);
  const user = useMemo(() => ({ uid: userInfo.uid, name: safeName, userpoint: userInfo.userpoint, profile: userInfo.profile, pictureUrl: userInfo.profile?.pictureUrl }), [userInfo, safeName]);

  // --- RENDER LOGIC ---
  if (loading) return <Spinner />;
  
  if (error) return (
    <div className="fixed inset-0 bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-[#8d6e63]/30">
        <div className="text-red-500 mb-4 inline-block"><Icons.Error /></div>
        <h2 className="text-xl font-bold text-[#3e2723] mb-2" style={{fontFamily: 'Kanit, sans-serif'}}>เกิดข้อผิดพลาด</h2>
        <p className="text-[#5d4037] mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="w-full bg-gradient-to-r from-[#5d4037] to-[#3e2723] text-[#f5f5f5] py-3 rounded-xl hover:from-[#3e2723] hover:to-[#2e1912] transition-all duration-300">รีเฟรชหน้า</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col" style={{fontFamily: 'Prompt, sans-serif'}}>
      <Navbar user={user} safeName={safeName} />
      <Toast {...toast} />

      <main className="flex-1 p-4 sm:p-6 flex items-start justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#8d6e63]/30 overflow-hidden">
            <ProfileHeader user={user} safeName={safeName} isUpdating={isUpdating} isPolling={isPolling} prefetchData={prefetchData} />
            <div className="p-4 sm:p-6 space-y-4">
              <PointsCard userpoint={userInfo.userpoint} pointsAnimation={pointsAnimation} prefetchData={prefetchData}/>
              <UserIdAccordion uid={userInfo.uid} copyToClipboard={copyToClipboard} />
              <RefreshButton onClick={() => syncData(userInfo.profile)} isUpdating={isUpdating} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}