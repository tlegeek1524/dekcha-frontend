import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickActions from '../quickaction';

// ✅ อ่าน URL จาก .env
const API_URL = import.meta.env.VITE_API_URL;

export default function Employeeindex() {
  const [empuser, setEmpuser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const verifyAuthToken = async (token) => {
    try {
      if (!token) throw new Error('ไม่พบโทเค็นการยืนยันตัวตน');

      const response = await fetch(`${API_URL}/auth/verify-token`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('TOKEN_EXPIRED');
        throw new Error('การยืนยันตัวตนล้มเหลว');
      }

      const data = await response.json();
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const handleTokenExpired = () => {
    localStorage.removeItem('AuthToken');
    alert('Token Expire โปรด login ใหม่อีกครั้ง');
    navigate('/auth/login');
  };

  useEffect(() => {
    const authToken = localStorage.getItem('AuthToken');
    if (!authToken) {
      setError('กรุณาเข้าสู่ระบบ');
      navigate('/auth/login');
      return;
    }

    const authenticateUser = async () => {
      try {
        const user = await verifyAuthToken(authToken);
        setEmpuser(user);
      } catch (error) {
        if (error.message === 'TOKEN_EXPIRED') {
          handleTokenExpired();
        } else {
          setError(error.message || 'ไม่สามารถยืนยันตัวตนได้');
        }
      } finally {
        setLoading(false);
      }
    };

    authenticateUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('AuthToken');
    navigate('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">กำลังตรวจสอบการยืนยันตัวตน...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-700 mb-6 text-lg">{error}</p>
          <button 
            onClick={() => navigate('/auth/login')}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 w-full"
          >
            เข้าสู่ระบบใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b-2 border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl sm:text-2xl font-bold text-amber-800">
              ระบบจัดการร้าน Dekcha
            </h1>
            <div className="flex items-center space-x-2">
              <div className="hidden sm:block text-sm text-gray-600">
                {empuser?.name}
              </div>
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {empuser?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">
                    {empuser?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">ยินดีต้อนรับ</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto rounded-full"></div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">ชื่อ</p>
                  <p className="text-lg font-semibold text-gray-800">{empuser?.name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">รหัสพนักงาน</p>
                  <p className="text-lg font-semibold text-gray-800">{empuser?.empid}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 mb-1">สถานะ</p>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <p className="text-lg font-semibold text-green-700">เข้าสู่ระบบแล้ว</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Component */}
        <QuickActions navigate={navigate} handleLogout={handleLogout} />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-600">
            © DekCha เมืองตาก | {new Date().toLocaleDateString('th-TH')}
          </p>
        </div>
      </div>
    </div>
  );
}