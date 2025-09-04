// src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function Register() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    firstname_emp: '',
    lastname_emp: '',
    name_emp: '',
    pincode_emp: '',
    password_emp: '',
    email_emp: '',
    phone_emp: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Function to get cookie value
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // Function to decode JWT token
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  };

  // Check authorization on component mount
  useEffect(() => {
    const checkAuthorization = () => {
      try {
        const authToken = getCookie('AuthToken');
        
        if (!authToken) {
          setIsAuthorized(false);
          setIsCheckingAuth(false);
          return;
        }

        const decodedToken = decodeJWT(authToken);
        
        if (!decodedToken) {
          setIsAuthorized(false);
          setIsCheckingAuth(false);
          return;
        }

        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp && decodedToken.exp < currentTime) {
          setIsAuthorized(false);
          setIsCheckingAuth(false);
          return;
        }

        // Check if user has admin role (check both 'role' and 'empid' for flexibility)
        const userRole = decodedToken.role;
        const empId = decodedToken.empid;
        
        if (userRole !== 'admin' && empId !== 'admin') {
          setIsAuthorized(false);
          setIsCheckingAuth(false);
          return;
        }

        setIsAuthorized(true);
        setIsCheckingAuth(false);
      } catch (error) {
        setIsAuthorized(false);
        setIsCheckingAuth(false);
      }
    };

    checkAuthorization();
  }, []);

  // Redirect if not authorized
  useEffect(() => {
    if (!isCheckingAuth && !isAuthorized) {
      navigate('/auth/login', { 
        replace: true,
        state: { message: 'คุณไม่มีสิทธิเข้าถึงหน้านี้' }
      });
    }
  }, [isCheckingAuth, isAuthorized, navigate]);

  // Validation rules
  const validateForm = () => {
    const newErrors = {};

    // First name validation
    if (!formData.firstname_emp.trim()) {
      newErrors.firstname_emp = 'กรุณากรอกชื่อจริง';
    } else if (formData.firstname_emp.trim().length < 2) {
      newErrors.firstname_emp = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    // Last name validation
    if (!formData.lastname_emp.trim()) {
      newErrors.lastname_emp = 'กรุณากรอกนามสกุล';
    } else if (formData.lastname_emp.trim().length < 2) {
      newErrors.lastname_emp = 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    // Display name validation
    if (!formData.name_emp.trim()) {
      newErrors.name_emp = 'กรุณากรอกชื่อที่ใช้แสดง';
    } else if (formData.name_emp.trim().length < 2) {
      newErrors.name_emp = 'ชื่อที่ใช้แสดงต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    // PIN code validation
    if (!formData.pincode_emp) {
      newErrors.pincode_emp = 'กรุณากรอกรหัส PIN';
    } else if (!/^\d{4}$/.test(formData.pincode_emp)) {
      newErrors.pincode_emp = 'รหัส PIN ต้องเป็นตัวเลข 4 หลัก';
    }

    // Password validation
    if (!formData.password_emp) {
      newErrors.password_emp = 'กรุณากรอกรหัสผ่าน';
    } else if (formData.password_emp.length < 6) {
      newErrors.password_emp = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email_emp) {
      newErrors.email_emp = 'กรุณากรอกอีเมล';
    } else if (!emailRegex.test(formData.email_emp)) {
      newErrors.email_emp = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    // Phone validation
    const phoneRegex = /^[0-9]{9,10}$/;
    if (!formData.phone_emp) {
      newErrors.phone_emp = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (!phoneRegex.test(formData.phone_emp.replace(/[-\s]/g, ''))) {
      newErrors.phone_emp = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Apply input formatting based on field type
    let formattedValue = value;
    
    if (name === 'pincode_emp') {
      // Only allow numbers for PIN, limit to 4 digits
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    } else if (name === 'phone_emp') {
      // Only allow numbers and common phone separators
      formattedValue = value.replace(/[^\d-\s]/g, '').slice(0, 10);
    } else if (name === 'email_emp') {
      // Convert email to lowercase
      formattedValue = value.toLowerCase();
    }

    setFormData({
      ...formData,
      [name]: formattedValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const authToken = getCookie('AuthToken');
      const response = await axios.post(`${API_URL}/auth/register`, formData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      alert('ลงทะเบียนสำเร็จ');
      
      // Reset form
      setFormData({
        firstname_emp: '',
        lastname_emp: '',
        name_emp: '',
        pincode_emp: '',
        password_emp: '',
        email_emp: '',
        phone_emp: '',
      });
      setErrors({});

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาด';
      alert(`ลงทะเบียนไม่สำเร็จ: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking authorization
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-slate-600 mx-auto mb-6"></div>
          <p className="text-slate-600 text-lg">กำลังตรวจสอบสิทธิการเข้าถึง...</p>
        </div>
      </div>
    );
  }

  // Main render - only shows if authorized
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">สร้างบัญชีผู้ใช้งาน</h1>
          <p className="text-slate-600 text-lg">เพิ่มผู้ใช้งานใหม่เข้าสู่ระบบ</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-base font-semibold text-slate-700">ชื่อจริง</label>
                <input
                  type="text"
                  name="firstname_emp"
                  value={formData.firstname_emp}
                  onChange={handleChange}
                  className={`w-full px-4 py-4 text-base border-2 rounded-xl focus:outline-none focus:border-slate-500 transition-all duration-200 bg-slate-50 focus:bg-white ${
                    errors.firstname_emp 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-200'
                  }`}
                  placeholder="กรอกชื่อจริง"
                />
                {errors.firstname_emp && (
                  <p className="text-sm text-red-500 mt-1">{errors.firstname_emp}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-base font-semibold text-slate-700">นามสกุล</label>
                <input
                  type="text"
                  name="lastname_emp"
                  value={formData.lastname_emp}
                  onChange={handleChange}
                  className={`w-full px-4 py-4 text-base border-2 rounded-xl focus:outline-none focus:border-slate-500 transition-all duration-200 bg-slate-50 focus:bg-white ${
                    errors.lastname_emp 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-200'
                  }`}
                  placeholder="กรอกนามสกุล"
                />
                {errors.lastname_emp && (
                  <p className="text-sm text-red-500 mt-1">{errors.lastname_emp}</p>
                )}
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-base font-semibold text-slate-700">ชื่อที่ใช้แสดง</label>
              <input
                type="text"
                name="name_emp"
                value={formData.name_emp}
                onChange={handleChange}
                className={`w-full px-4 py-4 text-base border-2 rounded-xl focus:outline-none focus:border-slate-500 transition-all duration-200 bg-slate-50 focus:bg-white ${
                  errors.name_emp 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-slate-200'
                }`}
                placeholder="ชื่อที่จะแสดงในระบบ"
              />
              {errors.name_emp && (
                <p className="text-sm text-red-500 mt-1">{errors.name_emp}</p>
              )}
            </div>

            {/* PIN Code and Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-base font-semibold text-slate-700">รหัส PIN</label>
                <input
                  type="text"
                  name="pincode_emp"
                  value={formData.pincode_emp}
                  onChange={handleChange}
                  maxLength="4"
                  className={`w-full px-4 py-4 text-base border-2 rounded-xl focus:outline-none focus:border-slate-500 transition-all duration-200 bg-slate-50 focus:bg-white text-center text-2xl tracking-widest ${
                    errors.pincode_emp 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-200'
                  }`}
                  placeholder="----"
                />
                {errors.pincode_emp && (
                  <p className="text-sm text-red-500 mt-1">{errors.pincode_emp}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-base font-semibold text-slate-700">รหัสผ่าน</label>
                <input
                  type="password"
                  name="password_emp"
                  value={formData.password_emp}
                  onChange={handleChange}
                  className={`w-full px-4 py-4 text-base border-2 rounded-xl focus:outline-none focus:border-slate-500 transition-all duration-200 bg-slate-50 focus:bg-white ${
                    errors.password_emp 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-200'
                  }`}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                />
                {errors.password_emp && (
                  <p className="text-sm text-red-500 mt-1">{errors.password_emp}</p>
                )}
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-base font-semibold text-slate-700">อีเมล</label>
                <input
                  type="email"
                  name="email_emp"
                  value={formData.email_emp}
                  onChange={handleChange}
                  className={`w-full px-4 py-4 text-base border-2 rounded-xl focus:outline-none focus:border-slate-500 transition-all duration-200 bg-slate-50 focus:bg-white ${
                    errors.email_emp 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-200'
                  }`}
                  placeholder="example@email.com"
                />
                {errors.email_emp && (
                  <p className="text-sm text-red-500 mt-1">{errors.email_emp}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-base font-semibold text-slate-700">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  name="phone_emp"
                  value={formData.phone_emp}
                  onChange={handleChange}
                  className={`w-full px-4 py-4 text-base border-2 rounded-xl focus:outline-none focus:border-slate-500 transition-all duration-200 bg-slate-50 focus:bg-white ${
                    errors.phone_emp 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-slate-200'
                  }`}
                  placeholder="08x-xxx-xxxx"
                />
                {errors.phone_emp && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone_emp}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-8 py-5 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                isLoading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              } focus:outline-none focus:ring-4 focus:ring-slate-300`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-500 border-t-transparent mr-3"></div>
                  กำลังสร้างบัญชี...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  สร้างบัญชีผู้ใช้งาน
                </div>
              )}
            </button>
          </form>

          {/* Navigation Links */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/auth/employee')}
              className="flex items-center justify-center px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors duration-200 rounded-lg hover:bg-slate-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              กลับสู่แดชบอร์ด
            </button>
            <button
              onClick={() => navigate('/auth/employee/employees')}
              className="flex items-center justify-center px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors duration-200 rounded-lg hover:bg-slate-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              จัดการผู้ใช้งาน
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 mt-6 text-sm">
          หน้านี้สำหรับผู้ดูแลระบบเท่านั้น • ระบบจะตรวจสอบสิทธิ์อัตโนมัติ
        </p>
      </div>
    </div>
  );
}

export default Register;