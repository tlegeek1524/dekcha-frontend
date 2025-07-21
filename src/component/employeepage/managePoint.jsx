import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickActions from '../quickaction';

const ManagePoint = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ customer_info: '', userpoint: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const currentUser = {
    id: "user123",
    name: "พนักงาน Admin",
    role: "admin"
  };

  useEffect(() => {
    const checkAuth = () => {
      const pinToken = getCookie('pinToken');
      if (!pinToken) {
        navigate('/auth/login');
        return;
      }
      
      if (currentUser.role !== 'admin') {
        alert('คุณไม่มีสิทธิเข้าถึงหน้านี้');
        navigate('/');
        return;
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const handleLogout = () => {
    document.cookie = 'pinToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
    navigate('/auth/login');
  };

  const handleAddPoints = async (e) => {
    if (e) e.preventDefault();
    if (submitLoading) return;
    
    setSubmitLoading(true);
    setErrors({});

    const pointNumber = Number(formData.userpoint);

    // Validation
    if (!formData.customer_info.trim()) {
      setErrors({ customer_info: 'กรุณากรอกข้อมูลลูกค้า' });
      setSubmitLoading(false);
      return;
    }

    if (!formData.userpoint || pointNumber <= 0 || isNaN(pointNumber)) {
      setErrors({ userpoint: 'กรุณากรอกจำนวนแต้มที่ถูกต้อง' });
      setSubmitLoading(false);
      return;
    }

    const requestData = {
      customer_info: formData.customer_info.trim(),
      userpoint: parseInt(pointNumber)
    };

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/points/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('pinToken')}`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (response.ok) {
        alert('เพิ่มแต้มสำเร็จ!');
        setFormData({ customer_info: '', userpoint: '' });
      } else {
        if (result.errors) {
          setErrors(result.errors);
        } else if (result.error) {
          setErrors({ general: result.error });
        } else {
          alert(result.message || 'เกิดข้อผิดพลาดในการเพิ่มแต้ม');
        }
      }
    } catch (error) {
      console.error('Error adding points:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ API');
    } finally {
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
                <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.role}</p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {currentUser.name.charAt(0)}
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

            <div className="mt-8 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">ข้อมูล API</h3>
              <p className="text-xs text-gray-600 mb-1">
                <strong>Endpoint:</strong> POST {import.meta.env.VITE_API_URL}/points/add
              </p>
              <p className="text-xs text-gray-600">
                <strong>Authorization:</strong> Bearer Token
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagePoint;