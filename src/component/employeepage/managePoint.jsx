import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickActions from '../quickaction';

const ManagePoint = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ customer_info: '', userpoint: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Starting auth check...');
      
      const authToken = getCookie('AuthToken');
      const pinToken = getCookie('pinToken');
      
      console.log('🍪 AuthToken:', authToken ? 'Found' : 'Not found');
      console.log('🍪 PinToken:', pinToken ? 'Found' : 'Not found');
      
      // ตรวจสอบว่ามี AuthToken หรือไม่
      if (!authToken || !pinToken) {
        console.log('❌ Missing tokens, redirecting to login...');
        // ลบ cookies ทั้งหมด
        document.cookie = 'AuthToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        document.cookie = 'pinToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        navigate('/auth/login');
        return;
      }
      
      try {
        console.log('📞 Calling getUserInfo with token...');
        // ดึงข้อมูลผู้ใช้จาก Token
        const userResponse = await getUserInfo(authToken);
        console.log('👤 User info response:', userResponse);
        
        // ตรวจสอบ response structure
        if (!userResponse || userResponse.status !== 'OK' || !userResponse.user) {
          console.log('🚫 Invalid response structure or status not OK');
          alert('ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้');
          // ลบ cookies และ redirect
          document.cookie = 'AuthToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
          document.cookie = 'pinToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
          navigate('/auth/login');
          return;
        }

        const userData = userResponse.user;
        console.log('👤 User data:', userData);
        console.log('🔐 User role:', userData.role);
        
        // ตรวจสอบสิทธิ์ (สามารถปรับเป็น role อื่นได้ตามต้องการ)
        const allowedRoles = ['admin', 'employee']; // เพิ่ม employee เข้าไปด้วย
        if (!allowedRoles.includes(userData.role)) {
          console.log('🚫 User role not allowed:', userData.role);
          alert('คุณไม่มีสิทธิเข้าถึงหน้านี้');
          // ลบ cookies และ redirect
          document.cookie = 'AuthToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
          document.cookie = 'pinToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
          navigate('/auth/login');
          return;
        }
        
        console.log('✅ Auth successful, setting user data');
        // ตั้งค่าข้อมูลผู้ใช้
        const userInfo = {
          id: userData.empid,
          name: userData.name,
          firstname: userData.firstname,
          lastname: userData.lastname,
          empid: userData.empid,
          role: userData.role,
          pincode: userData.pincode
        };
        
        setCurrentUser(userInfo);
        setLoading(false);
        
      } catch (error) {
        console.error('❌ Auth error:', error);
        // ลบ cookies เมื่อ token ไม่ถูกต้อง
        document.cookie = 'AuthToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        document.cookie = 'pinToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        navigate('/auth/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const getUserInfo = async (token) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      console.log('🌐 API URL:', API_URL);
      console.log('🔑 Using token:', token.substring(0, 10) + '...' + token.substring(token.length - 10));
      
      const response = await fetch(`${API_URL}/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
        throw new Error(`Failed to get user info: ${response.status} ${errorText}`);
      }

      const userInfo = await response.json();
      console.log('📄 User info received:', JSON.stringify(userInfo, null, 2));
      
      // ตรวจสอบว่า response มี structure ที่ถูกต้องหรือไม่
      if (userInfo.status === 'OK' && userInfo.user) {
        console.log('✅ Valid response structure');
        return userInfo;
      } else {
        console.log('❌ Invalid response structure');
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('💥 Error fetching user info:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    // ลบ cookies ทั้งหมด
    document.cookie = 'AuthToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
    document.cookie = 'pinToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
    navigate('/auth/login');
  };

  const handleAddPoints = async (e) => {
    if (e) e.preventDefault();
    if (submitLoading) return;
    
    console.log('🎯 Starting add points process...');
    setSubmitLoading(true);
    setErrors({});

    const pointNumber = Number(formData.userpoint);
    console.log('📝 Form data:', { customer_info: formData.customer_info, userpoint: pointNumber });

    // Validation
    if (!formData.customer_info.trim()) {
      console.log('❌ Validation failed: customer_info empty');
      setErrors({ customer_info: 'กรุณากรอกข้อมูลลูกค้า' });
      setSubmitLoading(false);
      return;
    }

    if (!formData.userpoint || pointNumber <= 0 || isNaN(pointNumber)) {
      console.log('❌ Validation failed: invalid userpoint');
      setErrors({ userpoint: 'กรุณากรอกจำนวนแต้มที่ถูกต้อง' });
      setSubmitLoading(false);
      return;
    }

    const requestData = {
      customer_info: formData.customer_info.trim(),
      userpoint: parseInt(pointNumber)
    };
    console.log('📤 Request data:', JSON.stringify(requestData, null, 2));

    try {
      const authToken = getCookie('AuthToken');
      if (!authToken) {
        console.log('❌ No auth token found');
        alert('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        navigate('/auth/login');
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL;
      console.log('🌐 Calling API:', `${API_URL}/points/add`);
      console.log('🔑 Using token:', authToken.substring(0, 10) + '...' + authToken.substring(authToken.length - 10));
      
      const response = await fetch(`${API_URL}/points/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestData)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const result = await response.json();
      console.log('📄 Response data:', JSON.stringify(result, null, 2));

      if (response.ok) {
        console.log('✅ Points added successfully');
        alert('เพิ่มแต้มสำเร็จ!');
        setFormData({ customer_info: '', userpoint: '' });
      } else {
        console.log('❌ API returned error');
        // หาก token หมดอายุหรือไม่ถูกต้อง
        if (response.status === 401) {
          console.log('🚫 Token expired or invalid (401)');
          alert('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
          handleLogout();
          return;
        }

        if (result.errors) {
          console.log('📝 Setting field errors:', result.errors);
          setErrors(result.errors);
        } else if (result.error) {
          console.log('📝 Setting general error:', result.error);
          setErrors({ general: result.error });
        } else {
          console.log('📝 Unknown error format');
          alert(result.message || 'เกิดข้อผิดพลาดในการเพิ่มแต้ม');
        }
      }
    } catch (error) {
      console.error('💥 Network or other error:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ API');
    } finally {
      console.log('🏁 Add points process completed');
      setSubmitLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === 'userpoint' ? (value === '' ? '' : Number(value)) : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังตรวจสอบสิทธิ...</p>
        </div>
      </div>
    );
  }

  // ถ้าไม่มี currentUser ให้แสดง loading หรือ redirect
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จัดการแต้มสะสม</h1>
              <p className="text-sm text-gray-500">เพิ่มแต้มสะสมให้ลูกค้า</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser.firstname} {currentUser.lastname} ({currentUser.name})
                </p>
                <p className="text-xs text-gray-500">
                  {currentUser.empid} • {currentUser.role}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {currentUser.firstname ? currentUser.firstname.charAt(0).toUpperCase() : currentUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuickActions
          userId={currentUser.id}
          onLogout={handleLogout}
          showLogout={true}
        />

        {/* Main Content */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">เพิ่มแต้มสะสม</h2>
            
            <div className="space-y-4">
              {errors.general && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {errors.general}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ข้อมูลลูกค้า
                </label>
                <input
                  type="text"
                  name="customer_info"
                  value={formData.customer_info}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.customer_info ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="รหัสลูกค้า, เบอร์โทร, หรือชื่อลูกค้า"
                  required
                />
                {errors.customer_info && (
                  <p className="mt-1 text-sm text-red-600">{errors.customer_info}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนแต้ม
                </label>
                <input
                  type="number"
                  name="userpoint"
                  value={formData.userpoint}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.userpoint ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="จำนวนแต้มที่ต้องการเพิ่ม"
                  min="1"
                  required
                />
                {errors.userpoint && (
                  <p className="mt-1 text-sm text-red-600">{errors.userpoint}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleAddPoints}
                disabled={submitLoading || !formData.customer_info || !formData.userpoint}
                className={`w-full px-4 py-3 text-white rounded-md font-medium transition-colors ${
                  submitLoading || !formData.customer_info || !formData.userpoint
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    กำลังเพิ่มแต้ม...
                  </div>
                ) : (
                  'เพิ่มแต้ม'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagePoint;