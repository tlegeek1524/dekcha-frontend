import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import liff from '@line/liff';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';
import CounterAnimation from '../CounterAnimation';
import Navbar from '../navbar';
import { Coffee, Star, Gift, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Spinner from '../util/LoadSpinner';
const LIFF_ID = import.meta.env.VITE_LIFF_ID;
const API_URL = import.meta.env.VITE_API_URL;

// API helper with better error handling but keeping original structure
const useApi = () => {
  const callApi = useCallback(async (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      
      const response = await fetch(url, { 
        ...options, 
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Handle auth errors
        if (response.status === 401) {
          localStorage.removeItem('authToken');
        }
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

// Memoized Loading Component
const LoadingSpinner = React.memo(() => (
  <Spinner/>
));

// Memoized Error Component  
const ErrorMessage = React.memo(({ message }) => (
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
));

// Optimized Menu Item Component - keeping original props exactly
const MenuItem = React.memo(({ id, name, description, point, userPoint, onRedeemCoupon, image }) => {
  const canRedeem = userPoint >= point;
  const progress = Math.min(100, (userPoint / point) * 100);
  
  // Keep original fallback logic but add error handling
  const handleImageError = useCallback((e) => {
    const fallbackImages = [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80',
      'https://image.makewebeasy.net/makeweb/m_1920x0/W7OuxZEpB/DefaultData/%E0%B8%8A%E0%B8%B2%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%A7%E0%B8%B1%E0%B8%95%E0%B8%96%E0%B8%B8%E0%B8%94%E0%B8%B4%E0%B8%9A_60.jpg?v=202405291424',
      'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80',
    ];
    const randomIndex = Math.floor(Math.random() * fallbackImages.length);
    e.target.src = fallbackImages[randomIndex];
  }, []);
  
  return (
    <div className="bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200 rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex-shrink-0 w-72 min-w-72 border border-stone-200/50">
      <div className="relative">
        <img 
          src={image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80'} 
          alt={name}
          className="w-full h-48 object-cover"
          loading="lazy"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
        <div className="absolute top-3 right-3 bg-gradient-to-r from-[#3e2723]/85 to-[#5d4037]/95 text-stone-50 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Star className="w-4 h-4" />
          <span className="font-medium text-sm">{point.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="p-4 bg-gradient-to-b from-stone-50 to-stone-100">
        <h3 className="font-bold text-lg text-stone-800 mb-2">{name}</h3>
        <p className="text-stone-600 text-sm mb-4 line-clamp-2">{description}</p>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-stone-500">ความคืบหน้า</span>
            <span className="text-sm font-medium text-stone-700">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gradient-to-r from-stone-300 to-stone-200 rounded-full h-2 shadow-inner">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                canRedeem ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-amber-700 to-amber-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <button
          className={`w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            canRedeem 
              ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-md hover:shadow-lg focus:ring-green-500' 
              : 'bg-gradient-to-r from-stone-300 to-stone-200 text-stone-500 cursor-not-allowed'
          }`}
          disabled={!canRedeem}
          onClick={() => canRedeem && onRedeemCoupon(id, name, point)}
        >
          {canRedeem ? (
            <>
              <Gift className="w-5 h-5" />
              <span>แลกสิทธิ</span>
            </>
          ) : (
            <>
              <Star className="w-5 h-5" />
              <span>ต้องการ {point.toLocaleString()} แต้ม</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
});

// Optimized Horizontal Scroll Menu Component - keeping original props
const MenuHorizontalScroll = React.memo(({ menuItems, userPoint, onRedeemCoupon }) => {
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

  const scrollLeft = useCallback(() => {
    if (scrollRef.current) {
      const itemWidth = 288 + 16; // w-72 + gap-4
      scrollRef.current.scrollBy({
        left: -itemWidth,
        behavior: 'smooth'
      });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollRef.current) {
      const itemWidth = 288 + 16; // w-72 + gap-4
      scrollRef.current.scrollBy({
        left: itemWidth,
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

  return (
    <div className="relative">
      {/* Scroll Container */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto scroll-smooth gap-4 pb-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#8d6e63 #f5f5f5'
        }}
      >
        {menuItems.map((item, idx) => (
          <MenuItem
            key={item.id}
            id={item.id}
            name={item.name}
            description={item.description}
            point={item.point}
            userPoint={userPoint}
            onRedeemCoupon={onRedeemCoupon}
            image={item.image || [
              'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80',
              'https://image.makewebeasy.net/makeweb/m_1920x0/W7OuxZEpB/DefaultData/%E0%B8%8A%E0%B8%B2%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%A7%E0%B8%B1%E0%B8%95%E0%B8%96%E0%B8%B8%E0%B8%94%E0%B8%B4%E0%B8%9A_60.jpg?v=202405291424',
              'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80',
            ][idx % 4]}
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-stone-100 to-stone-50 hover:from-stone-200 hover:to-stone-100 text-amber-800 p-3 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 z-10 border border-stone-200/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-stone-100 to-stone-50 hover:from-stone-200 hover:to-stone-100 text-amber-800 p-3 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 z-10 border border-stone-200/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
});

// Main Component - keeping all original state and logic
export default function Usermenu() {
  const [user, setUser] = useState({ uid: '', name: '', userpoint: 0, profile: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const navigate = useNavigate();
  const { callApi } = useApi();

  // Keep original notification logic
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  }, []);

  // Keep original syncUserData logic
  const syncUserData = useCallback(async (profileData) => {
    if (!profileData) return;
    try {
      const userId = profileData.userId;
      const endpoint = `${API_URL}/users/${userId}`;
      const params = new URLSearchParams({
        name: profileData.displayName,
        picture: profileData.pictureUrl || '',
      });
      const userData = await callApi(`${endpoint}?${params.toString()}`);
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

  // Keep original fetchMenuItems logic
  const fetchMenuItems = useCallback(async () => {
    try {
      const data = await callApi(`${API_URL}/menu`);
      setMenuItems(data.filter(item => item.status === 2));
    } catch {
      setError('ไม่สามารถโหลดเมนูได้');
    }
  }, [callApi]);

  // Keep original handleRedeemCoupon logic
  const handleRedeemCoupon = useCallback((menuId, menuName, menuPoint) => {
    showNotification(`🎉 แลกคูปอง ${menuName} สำเร็จ!`, 'success');
    setUser(prevUser => ({
      ...prevUser,
      userpoint: prevUser.userpoint - menuPoint
    }));
  }, [showNotification]);

  // Keep original handleLogout logic
  const handleLogout = useCallback(() => {
    try {
      if (liff.isLoggedIn()) liff.logout();
      localStorage.removeItem('authToken');
      navigate('/');
    } catch (err) {
      console.error(err);
      navigate('/');
    }
  }, [navigate]);

  // Keep original useEffect logic
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

  // Keep original safeName logic
  const safeName = DOMPurify.sanitize(user.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200">
      {/* Keep original notification */}
      {notification.show && (
        <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-opacity ${
          notification.type === 'success' ? 'bg-gradient-to-r from-green-600 to-green-500 text-white' : 
          notification.type === 'error' ? 'bg-gradient-to-r from-red-600 to-red-500 text-white' : 
          'bg-gradient-to-r from-stone-700 to-stone-600 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification({ show: false, message: '', type: '' })}
              className="ml-4 text-white hover:text-gray-200 focus:outline-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Keep original Navbar */}
      <Navbar user={user} safeName={safeName} />

      {/* Keep original Main Content */}
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
          <MenuHorizontalScroll 
            menuItems={menuItems}
            userPoint={user.userpoint}
            onRedeemCoupon={handleRedeemCoupon}
          />
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