import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickActions from '../quickaction';
import { User, Shield, Store, Heart, XCircle } from 'lucide-react';

// Constants
const API_URL = import.meta.env.VITE_API_URL;
const AUTH_TOKEN_KEY = 'AuthToken';
const PIN_TOKEN_KEY = 'pinToken';

// Custom hooks
const useAuth = () => {
  const navigate = useNavigate();

  const deleteCookie = useCallback((cookieName) => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }, []);

  const handleTokenExpired = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    deleteCookie(PIN_TOKEN_KEY);
    alert('Token หมดอายุ โปรดเข้าสู่ระบบใหม่อีกครั้ง');
    navigate('/auth/login');
  }, [navigate, deleteCookie]);

  const verifyAuthToken = useCallback(async (token) => {
    if (!token) throw new Error('ไม่พบโทเค็นการยืนยันตัวตน');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(`${API_URL}/auth/verify-token`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) throw new Error('TOKEN_EXPIRED');
        if (response.status >= 500) throw new Error('เซิร์ฟเวอร์ไม่สามารถตอบสนองได้ กรุณาลองใหม่อีกครั้ง');
        throw new Error('การยืนยันตัวตนล้มเหลว');
      }

      const data = await response.json();
      return data.user;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง');
      }
      throw err;
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    deleteCookie(PIN_TOKEN_KEY);
    navigate('/auth/login');
  }, [navigate, deleteCookie]);

  return { verifyAuthToken, handleTokenExpired, handleLogout };
};

const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return currentTime;
};

// Main component
export default function Employeeindex() {
  const [empuser, setEmpuser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const currentTime = useCurrentTime();
  const { verifyAuthToken, handleTokenExpired, handleLogout } = useAuth();

  // Memoized values
  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'สวัสดีตอนเช้า ☀️';
    if (hour < 17) return 'สวัสดีตอนบ่าย 🌤️';
    return 'สวัสดีตอนเย็น 🌙';
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }, [currentTime]);

  const loginDate = useMemo(() => {
    return currentTime.toLocaleDateString('th-TH');
  }, [currentTime]);

  // Authentication effect
  useEffect(() => {
    const authToken = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!authToken) {
      setError('กรุณาเข้าสู่ระบบ');
      navigate('/auth/login');
      return;
    }

    let isMounted = true;

    const authenticateUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const user = await verifyAuthToken(authToken);

        if (isMounted) {
          setEmpuser(user);
        }
      } catch (error) {
        if (isMounted) {
          if (error.message === 'TOKEN_EXPIRED') {
            handleTokenExpired();
          } else {
            setError(error.message || 'ไม่สามารถยืนยันตัวตนได้');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    authenticateUser();

    return () => {
      isMounted = false;
    };
  }, [navigate, verifyAuthToken, handleTokenExpired]);

  // Retry function for error state
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // Loading component
  const LoadingComponent = useMemo(() => (
    <div className="w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-8 w-full max-w-sm text-center">
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-3 border-blue-100 border-t-blue-500 mx-auto"></div>
          <Store className="absolute inset-0 w-8 h-8 m-auto text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">กำลังเข้าสู่ระบบ</h3>
        <p className="text-gray-600 text-base">เตรียมระบบร้านให้คุณ...</p>
      </div>
    </div>
  ), []);

  // Error component
  const ErrorComponent = useMemo(() => (
    <div className="w-full h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-red-100 p-8 w-full max-w-md text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">เกิดข้อผิดพลาด</h2>
        <p className="text-gray-600 mb-8 leading-relaxed text-base">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] text-base"
          >
            ลองใหม่อีกครั้ง
          </button>
          <button
            onClick={() => navigate('/auth/login')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] text-base"
          >
            เข้าสู่ระบบใหม่
          </button>
        </div>
      </div>
    </div>
  ), [error, handleRetry, navigate]);

  // Employee info cards component
  const EmployeeInfoCards = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">ชื่อพนักงาน</p>
            <p className="text-base font-semibold text-gray-800 truncate">{empuser?.name}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">รหัสพนักงาน</p>
            <p className="text-base font-semibold text-gray-800">{empuser?.empid}</p>
          </div>
        </div>
      </div>
    </div>
  ), [empuser]);

  // Render conditions
  if (loading) return LoadingComponent;
  if (error) return ErrorComponent;

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <style>{`
          @keyframes blob {
            0% { transform: scale(1) translate(0, 0); }
            33% { transform: scale(1.1) translate(20px, -30px); }
            66% { transform: scale(0.9) translate(-10px, 15px); }
            100% { transform: scale(1) translate(0, 0); }
          }
          .animate-blob {
            animation: blob 7s infinite cubic-bezier(0.4, 0, 0.6, 1);
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
        `}</style>
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 flex-shrink-0">
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg lg:text-xl font-semibold text-gray-800 truncate">
                  ร้าน Dekcha เมืองตาก
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">ระบบจัดการร้านค้า</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 w-full overflow-auto">
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Welcome & Info Section */}
            <div className="lg:col-span-1">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
                <div className="relative p-6 lg:p-8">
                  <div className="relative">
                    <h2 className="text-2xl lg:text-3xl font-semibold text-gray-800 mb-2">
                      {greeting}
                    </h2>
                    <p className="text-gray-600 text-base lg:text-lg flex items-center mb-4">
                      <Heart className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" />
                      ยินดีต้อนรับคุณ {empuser?.name}
                    </p>

                    {/* Employee Info Cards */}
                    {EmployeeInfoCards}

                    {/* Status Bar */}
                    <div className="pt-6 mt-6 border-t border-gray-200/50">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                          <span>ระบบพร้อมใช้งาน</span>
                        </div>
                        <div className="text-gray-500">
                          เข้าสู่ระบบ: {loginDate}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-4 lg:mb-6">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full mr-3"></div>
                <h3 className="text-lg lg:text-xl font-semibold text-gray-800">เมนูจัดการร้าน</h3>
              </div>
              <QuickActions navigate={navigate} handleLogout={handleLogout} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative bg-white/80 backdrop-blur-lg border-t border-gray-200/50 flex-shrink-0">
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-gray-500 space-y-2 sm:space-y-0">
            <p className="flex items-center">
              <Store className="w-4 h-4 mr-1 text-gray-400" />
              © 2024 DekCha เมืองตาก - ระบบจัดการร้านค้า
            </p>
            <p className="text-center sm:text-right">
              {formattedDate}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}