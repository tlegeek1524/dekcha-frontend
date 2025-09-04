import React, { useState } from "react";
import axios from "axios";
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';
import '../index.css';

function AdminLogin() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ user: false, password: false });
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({ user: false, password: false });

    // Simple validation - check if fields are empty
    let hasError = false;
    const errors = { user: false, password: false };

    if (!user.trim()) {
      errors.user = true;
      hasError = true;
    }

    if (!password) {
      errors.password = true;
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(errors);
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setLoading(true);

    try {
      // Determine whether user input is empid or phone_emp
      const requestData = {
        password_emp: password,
      };

      // Check if the user input is a phone number or empid
      if (/^\d{10}$/.test(user)) { // Regular expression to check if it's a phone number (10 digits)
        requestData.phone_emp = user;
      } else {
        requestData.empid = user;
      }

      const response = await axios.post(`${API_URL}/auth/login`, requestData);

      if (response.data.status === "OK") {
        // Set token in localStorage
        localStorage.setItem("AuthToken", response.data.token);
        localStorage.setItem("userData", JSON.stringify(response.data.empuser));

        // Set token in cookie with 12 hour expiry
        Cookies.set('AuthToken', response.data.token, {
          expires: 0.5, // 0.5 days = 12 hours
          secure: true, // Use secure in production (HTTPS)
          sameSite: 'strict', // CSRF protection
        });

        navigate("/auth/employee");
      } else {
        setError(response.data.message || "รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง");
      } else if (err.response && err.response.status === 404) {
        setError("ไม่พบข้อมูลพนักงาน");
      } else if (err.response && err.response.status === 500) {
        setError("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
      } else if (!err.response) {
        setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      } else {
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  };


  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  // Clear field error when user starts typing
  const handleUserChange = (value) => {
    setUser(value);
    if (fieldErrors.user) {
      setFieldErrors(prev => ({ ...prev, user: false }));
    }
    if (error) setError("");
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: false }));
    }
    if (error) setError("");
  };

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        .shake-animation {
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { 
            opacity: 0;
            transform: translateY(-5px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4" style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
        <div className="w-full max-w-sm">
          {/* Logo/Title Section */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <img
                src="https://mhpetiaaadwsvrtbkmue.supabase.co/storage/v1/object/public/menu-images//dekcha_logo-01.png"
                alt="Dekcha Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-medium text-gray-900 tracking-tight">ยินดีต้อนรับ</h1>
            <p className="text-sm text-gray-500 mt-1 font-light">เข้าสู่ระบบเพื่อเริ่มใช้งาน</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className={`bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 fade-in ${error ? 'shake-animation' : ''}`}>
                <AlertCircle size={16} className="flex-shrink-0" />
                <span className="font-light">{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-700 font-medium">รหัสพนักงาน หรือ เบอร์โทรศัพท์</label>
              <input
                type="text"
                placeholder="เช่น EMP001 หรือ 0891234567"
                value={user}
                onChange={(e) => handleUserChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-200 font-light ${fieldErrors.user
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100'
                  }`}
              />
              {fieldErrors.user && (
                <p className="text-xs text-red-500 font-light fade-in">กรุณากรอกรหัสพนักงาน หรือ เบอร์โทรศัพท์</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-700 font-medium">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-200 pr-12 font-light ${fieldErrors.password
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100'
                    }`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-500 font-light fade-in">กรุณากรอกรหัสผ่าน</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : "เข้าสู่ระบบ"}
            </button>

            {/* Role Toggle */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                className="text-sm text-gray-900 font-medium"
              >
                ผู้ดูแลระบบ
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-light"
              >
                พนักงาน
              </button>
            </div>
          </form>


          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8 font-light">
            © 2025 Company Name. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}

export default AdminLogin;