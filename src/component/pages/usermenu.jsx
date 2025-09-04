import React, { useState, useEffect, useCallback, useRef } from 'react';
import liff from '@line/liff';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';
import CounterAnimation from '../CounterAnimation';
import Navbar from '../navbar';
import { Coffee, Star, Gift, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, X, CheckCircle } from 'lucide-react';
import Spinner from '../util/LoadSpinner';

const LIFF_ID = import.meta.env.VITE_LIFF_ID;
const API_URL = import.meta.env.VITE_API_URL;

// ======================= HOOKS =======================
const useApi = () => {
  const callApi = useCallback(async (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(url, {
        ...options,
        headers: { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        if (response.status === 401) localStorage.removeItem('authToken');
        throw new Error('เกิดข้อผิดพลาด');
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') return null;
      throw error;
    }
  }, []);
  return { callApi };
};

const useNotification = () => {
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  }, []);
  const hideNotification = useCallback(() => setNotification({ show: false, message: '', type: '' }), []);
  return { notification, showNotification, hideNotification };
};

// ======================= COMPONENTS =======================
const ConfirmationModal = ({ isOpen, onClose, onConfirm, item, userPoint, isLoading }) => {
  if (!isOpen || !item) return null;
  const remainingPoints = userPoint - item.point;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!isLoading ? onClose : undefined} />
      <div className="relative bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200 rounded-2xl shadow-2xl max-w-md w-full border border-stone-200/50 overflow-hidden">
        {!isLoading && (
          <button onClick={onClose} className="absolute top-4 right-4 z-10 text-stone-400 hover:text-stone-600 transition-colors p-1 rounded-full hover:bg-stone-200/50">
            <X className="w-6 h-6" />
          </button>
        )}
        
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-amber-500 rounded-full flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-800">ยืนยันการแลกสิทธิ</h3>
              <p className="text-stone-600 text-sm">กรุณาตรวจสอบรายละเอียดก่อนยืนยัน</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="bg-gradient-to-br from-white/80 to-stone-50/80 rounded-xl p-4 border border-stone-200/30">
            {item.image && <img src={item.image} alt={item.name} className="w-full h-48 object-cover rounded-lg mb-3" />}
            <h4 className="font-semibold text-stone-800 mb-2">{item.name}</h4>
            <div className="space-y-2 text-sm">
              {[
                ['แต้มที่ใช้:', item.point, 'amber-700'],
                ['แต้มที่มี:', userPoint, 'green-700'],
                ['แต้มคงเหลือ:', remainingPoints, 'blue-700']
              ].map(([label, value, color], idx) => (
                <React.Fragment key={idx}>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-600">{label}</span>
                    <div className={`flex items-center gap-1 text-${color} font-medium`}>
                      <Star className="w-4 h-4" />
                      {value.toLocaleString()} แต้ม
                    </div>
                  </div>
                  {idx === 1 && <hr className="border-stone-200" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 bg-gradient-to-r from-stone-300 to-stone-200 hover:from-stone-400 hover:to-stone-300 text-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังแลกสิทธิ...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                ยืนยันแลกสิทธิ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const MenuItem = ({ item, userPoint, onRedeem }) => {
  const canRedeem = userPoint >= item.point;
  const progress = Math.min(100, (userPoint / item.point) * 100);
  
  const handleImageError = useCallback((e) => {
    e.target.src = 'https://image.makewebeasy.net/makeweb/m_1920x0/W7OuxZEpB/DefaultData/%E0%B8%8A%E0%B8%B2%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%A7%E0%B8%B1%E0%B8%95%E0%B8%96%E0%B8%B8%E0%B8%94%E0%B8%B4%E0%B8%9A_60.jpg?v=202405291424';
  }, []);

  const getExpiryInfo = useCallback(() => {
    if (!item.exp) return null;
    const expiryDate = new Date(item.exp);
    const daysRemaining = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    const thaiDate = expiryDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    return {
      daysRemaining,
      thaiDate,
      isExpired: daysRemaining <= 0,
      isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0
    };
  }, [item.exp]);

  const expiryInfo = getExpiryInfo();

  return (
    <div className="bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200 rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex-shrink-0 w-72 min-w-72 border border-stone-200/50">
      <div className="relative">
        <div className="w-full h-64 overflow-hidden rounded-t-2xl">
          <img
            src={item.image || 'https://uibaorxgziixlbslvlcm.supabase.co/storage/v1/object/public/menu-images/dekcha_logo-01.png'}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={handleImageError}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {expiryInfo && (
          <div className={`absolute top-3 left-3 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg text-xs font-medium backdrop-blur-sm ${
            expiryInfo.isExpired ? 'bg-gradient-to-r from-red-600/90 to-red-500/95 text-white' :
            expiryInfo.isExpiringSoon ? 'bg-gradient-to-r from-orange-600/90 to-orange-500/95 text-white' :
            'bg-gradient-to-r from-green-600/90 to-green-500/95 text-white'
          }`}>
            <span>{expiryInfo.isExpired ? 'หมดอายุแล้ว' : expiryInfo.daysRemaining <= 30 ? `เหลือ ${expiryInfo.daysRemaining} วัน` : `ถึง ${expiryInfo.thaiDate}`}</span>
          </div>
        )}

        <div className="absolute top-3 right-3 bg-gradient-to-r from-[#3e2723]/90 to-[#5d4037]/95 backdrop-blur-sm text-stone-50 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <Star className="w-4 h-4" />
          <span className="font-medium text-sm">{item.point.toLocaleString()}</span>
        </div>
      </div>

      <div className="p-4 bg-gradient-to-b from-stone-50 to-stone-100">
        <h3 className="font-bold text-lg text-stone-800 mb-2">{item.name}</h3>
        <p className="text-stone-600 text-sm mb-4 line-clamp-2">{item.description}</p>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-500">ความคืบหน้า</span>
            <span className="text-sm font-medium text-stone-700">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gradient-to-r from-stone-300 to-stone-200 rounded-full h-2 shadow-inner">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${canRedeem ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-amber-700 to-amber-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          className={`w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            expiryInfo?.isExpired ? 'bg-gradient-to-r from-gray-400 to-gray-300 text-gray-600 cursor-not-allowed' :
            canRedeem ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-md hover:shadow-lg focus:ring-green-500' :
            'bg-gradient-to-r from-stone-300 to-stone-200 text-stone-500 cursor-not-allowed'
          }`}
          disabled={!canRedeem || expiryInfo?.isExpired}
          onClick={() => canRedeem && !expiryInfo?.isExpired && onRedeem(item)}
        >
          {expiryInfo?.isExpired ? (
            <><X className="w-5 h-5" /><span>หมดอายุแล้ว</span></>
          ) : canRedeem ? (
            <><Gift className="w-5 h-5" /><span>แลกสิทธิ</span></>
          ) : (
            <><Star className="w-5 h-5" /><span>ต้องการ {item.point.toLocaleString()} แต้ม</span></>
          )}
        </button>
      </div>
    </div>
  );
};

const MenuHorizontalScroll = ({ menuItems, userPoint, onRedeem }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  const scroll = useCallback((direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -304 : 304, // w-72 + gap-4
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    checkScrollButtons();
    const handleScroll = () => checkScrollButtons();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [menuItems, checkScrollButtons]);

  if (menuItems.length === 0) return null;

  const ScrollButton = ({ direction, onClick, show }) => show && (
    <button
      onClick={onClick}
      className="absolute top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-stone-100 to-stone-50 hover:from-stone-200 hover:to-stone-100 text-amber-800 p-3 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 z-10 border border-stone-200/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
      style={{ [direction]: '8px' }}
    >
      {direction === 'left' ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
    </button>
  );

  return (
    <div className="relative">
      <div ref={scrollRef} className="flex overflow-x-auto scroll-smooth gap-4 pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#8d6e63 #f5f5f5' }}>
        {menuItems.map((item) => (
          <MenuItem key={`${item.idmenu}-${item.id}`} item={item} userPoint={userPoint} onRedeem={onRedeem} />
        ))}
      </div>
      <ScrollButton direction="left" onClick={() => scroll('left')} show={canScrollLeft} />
      <ScrollButton direction="right" onClick={() => scroll('right')} show={canScrollRight} />
    </div>
  );
};

const LoadingSpinner = () => <Spinner />;

const ErrorMessage = ({ message }) => (
  <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200 flex flex-col items-center justify-center p-6">
    <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
    <p className="text-red-800 text-lg font-medium mb-6 text-center">{message}</p>
    <button
      onClick={() => window.location.reload()}
      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      <RefreshCw className="w-5 h-5" />
      ลองใหม่
    </button>
  </div>
);

const NotificationBanner = ({ notification, onClose }) => {
  if (!notification.show) return null;
  const getStyle = (type) => ({
    success: 'bg-gradient-to-r from-green-600 to-green-500 text-white',
    error: 'bg-gradient-to-r from-red-600 to-red-500 text-white',
    info: 'bg-gradient-to-r from-stone-700 to-stone-600 text-white'
  }[type] || 'bg-gradient-to-r from-stone-700 to-stone-600 text-white');

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-opacity ${getStyle(notification.type)}`}>
      <div className="flex items-center justify-between">
        <span>{notification.message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200 focus:outline-none">×</button>
      </div>
    </div>
  );
};

// ======================= MAIN COMPONENT =======================
export default function Usermenu() {
  const [user, setUser] = useState({ uid: '', name: '', userpoint: 0, profile: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null, isLoading: false });

  const navigate = useNavigate();
  const { callApi } = useApi();
  const { notification, showNotification, hideNotification } = useNotification();

  const syncUserData = useCallback(async (profileData) => {
    if (!profileData) return;
    try {
      const userId = profileData.userId;
      const params = new URLSearchParams({
        name: profileData.displayName,
        picture: profileData.pictureUrl || '',
      });
      const userData = await callApi(`${API_URL}/users/${userId}?${params.toString()}`);
      setUser({
        uid: userData.uid,
        name: userData.displayName,
        userpoint: userData.userpoint || 0,
        profile: profileData,
      });
    } catch (error) {
      setError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    }
  }, [callApi]);

  const fetchMenuItems = useCallback(async () => {
    try {
      const data = await callApi(`${API_URL}/menu`);
      const now = new Date();
      const filtered = data.filter(item => {
        if (item.status !== 2) return false;
        if (!item.exp) return true;
        return new Date(item.exp).getTime() >= now.getTime();
      });
      setMenuItems(filtered);
    } catch {
      setError('ไม่สามารถโหลดเมนูได้');
    }
  }, [callApi]);

  const handleRedeemCoupon = useCallback((item) => {
    setConfirmModal({ isOpen: true, item: item, isLoading: false });
  }, []);

  const handleConfirmRedeem = useCallback(async () => {
    const { item } = confirmModal;
    if (!item || !user.profile) return;

    setConfirmModal(prev => ({ ...prev, isLoading: true }));
    try {
      const redeemPayload = {
        menu_id: item.idmenu,
        menu_name: item.name,
        menu_image: item.image,
        points_used: item.point,
        user_id: user.profile.userId,
        user_uid: user.uid,
        user_name: user.profile.displayName
      };

      const response = await callApi(`${API_URL}/coupon/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(redeemPayload)
      });

      setConfirmModal({ isOpen: false, item: null, isLoading: false });
      showNotification(`🎉 แลกคูปอง ${item.name} สำเร็จ!`, 'success');
      setUser(prevUser => ({
        ...prevUser,
        userpoint: response?.userpoint ?? (prevUser.userpoint - item.point)
      }));
    } catch (error) {
      setConfirmModal({ isOpen: false, item: null, isLoading: false });
      showNotification('เกิดข้อผิดพลาดในการแลกสิทธิ กรุณาลองใหม่อีกครั้ง', 'error');
      console.error('Redeem error:', error);
    }
  }, [confirmModal, showNotification, callApi, user.profile, user.uid]);

  const handleCancelRedeem = useCallback(() => {
    if (confirmModal.isLoading) return;
    setConfirmModal({ isOpen: false, item: null, isLoading: false });
  }, [confirmModal.isLoading]);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        const profileData = await liff.getProfile();
        await syncUserData(profileData);
        setLoading(false);
      } catch {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        setLoading(false);
      }
    };
    initializeLiff();
    fetchMenuItems();
  }, [syncUserData, fetchMenuItems]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const safeName = DOMPurify.sanitize(user.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200">
      <NotificationBanner notification={notification} onClose={hideNotification} />
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={handleCancelRedeem}
        onConfirm={handleConfirmRedeem}
        item={confirmModal.item}
        userPoint={user.userpoint}
        isLoading={confirmModal.isLoading}
      />
      <Navbar user={user} safeName={safeName} />

      <main className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Coffee className="w-6 h-6 text-amber-800" />
            <h3 className="text-xl font-bold text-stone-800">เมนูโปรโมชั่น</h3>
          </div>
          <button
            onClick={() => {
              showNotification('กำลังรีเฟรชเมนู...', 'info');
              fetchMenuItems();
            }}
            className="p-2 text-amber-800 hover:text-amber-900 transition-colors bg-gradient-to-r from-stone-100 to-stone-50 hover:from-stone-200 hover:to-stone-100 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {menuItems.length > 0 ? (
          <MenuHorizontalScroll menuItems={menuItems} userPoint={user.userpoint} onRedeem={handleRedeemCoupon} />
        ) : (
          <div className="text-center py-12 bg-gradient-to-b from-stone-50 to-stone-100 rounded-2xl shadow-sm">
            <Coffee className="w-16 h-16 text-stone-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-600 mb-2">ไม่พบเมนูโปรโมชั่น</h3>
            <p className="text-stone-500 mb-6">กรุณาลองใหม่อีกครั้งในภายหลัง</p>
            <button
              onClick={fetchMenuItems}
              className="flex items-center gap-2 mx-auto bg-gradient-to-r from-amber-800 to-amber-700 hover:from-amber-900 hover:to-amber-800 text-white px-6 py-3 rounded-full font-medium transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <RefreshCw className="w-5 h-5" />
              ลองใหม่
            </button>
          </div>
        )}
      </main>
    </div>
  );
}