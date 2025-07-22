import React, { useState , useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User, AlertCircle , Coffee } from "lucide-react";
import '../index.css'; // Ensure you have the correct path to your CSS file
function AdminLogin() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  // Helper function to set cookie
  const setCookie = (name, value, days = 7, secure = true, httpOnly = false) => {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    
    let cookieString = `${name}=${value || ""}${expires}; path=/`;
    
    if (secure) {
      cookieString += "; Secure";
    }
    
    if (httpOnly) {
      cookieString += "; HttpOnly";
    }
    
    // เพิ่ม SameSite สำหรับความปลอดภัย
    cookieString += "; SameSite=Strict";
    
    document.cookie = cookieString;
  };

  // Helper function to get cookie
  const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  // Helper function to delete cookie
  const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };

  // Helper function to clear both cookie and localStorage
  const clearAuthData = () => {
    deleteCookie("AuthToken");
    deleteCookie("userData");
    localStorage.removeItem("AuthToken");
    localStorage.removeItem("userData");
  };

  // Helper function to get token from either cookie or localStorage
  const getAuthToken = () => {
    const cookieToken = getCookie("AuthToken");
    const localToken = localStorage.getItem("AuthToken");
    
    // Return cookie token first, fallback to localStorage
    return cookieToken || localToken;
  };

    useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ส่งคำขอล็อกอินไปที่ API
      const response = await axios.post(`${API_URL}/auth/login`, {
        empid: user,
        password_emp: password,
      });

      console.log(response.data);

      // ตรวจสอบผลลัพธ์จาก API
      if (response.data.status === "OK") {
        // เก็บ token ใน Cookie และ localStorage ควบคู่กัน
        setCookie("AuthToken", response.data.token, 1, true, false); // เก็บไว้ 7 วัน
        localStorage.setItem("AuthToken", response.data.token); // เก็บใน localStorage ด้วย
        
        // เก็บข้อมูลผู้ใช้เพิ่มเติมใน Cookie และ localStorage (ถ้ามี)
        if (response.data.user) {
          setCookie("userData", JSON.stringify(response.data.user), 7, true, false);
          localStorage.setItem("userData", JSON.stringify(response.data.user));
        }
        
        console.log("Token saved to cookie:", getCookie("AuthToken"));
        console.log("Token saved to localStorage:", localStorage.getItem("AuthToken"));
        
        // ใช้ navigate สำหรับ redirect ไปยังหน้าถัดไป
        navigate("/auth/employee");
      } else {
        setError(response.data.message || "Login failed");
      }

    } catch (err) {
      console.error("Login error:", err);
      
      // จัดการ error ที่ละเอียดมากขึ้น
      if (err.response) {
        // เซิร์ฟเวอร์ตอบกลับด้วย status code ที่ไม่ใช่ 2xx
        const statusCode = err.response.status;
        
        if (statusCode === 401) {
          setError("Invalid username or password");
        } else if (statusCode === 403) {
          setError("Access denied");
        } else if (statusCode === 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(`Server error: ${statusCode}`);
        }
      } else if (err.request) {
        // คำขอถูกส่งแต่ไม่ได้รับการตอบกลับ
        setError("Network error. Please check your connection.");
      } else {
        // เกิดข้อผิดพลาดอื่นๆ
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md sm:max-w-lg">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl mb-4 sm:mb-6 shadow-lg transform hover:scale-105 transition-transform duration-300"
               style={{ backgroundColor: '#8d6e63' }}>
            <Coffee className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3" 
              style={{ 
                color: '#3e2723',
                fontFamily: 'Kanit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: '700'
              }}>
            เข้าสู่ระบบ
          </h1>
          <p className="text-base sm:text-lg font-medium" 
             style={{ 
               color: '#5d4037',
               fontFamily: 'Prompt, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
             }}>
            สำหรับผู้ดูแลระบบ
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl border-2 p-6 sm:p-8 lg:p-10 transform hover:shadow-3xl transition-shadow duration-300"
             style={{ borderColor: '#a1887f' }}>
          <div className="space-y-6 sm:space-y-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 animate-pulse">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm sm:text-base font-medium"
                   style={{ fontFamily: 'Prompt, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {error}
                </p>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2 sm:space-y-3">
              <label className="text-sm sm:text-base font-semibold block ml-1"
                     style={{ 
                       color: '#3e2723',
                       fontFamily: 'Kanit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                     }}>
                ชื่อผู้ใช้
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 transition-all duration-300 group-hover:scale-110">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300"
                       style={{ backgroundColor: '#fff8e1' }}>
                    <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#8d6e63' }} />
                  </div>
                </div>
                <input
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="w-full pl-14 sm:pl-16 pr-4 sm:pr-6 py-4 sm:py-5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:border-transparent transition-all duration-300 text-base sm:text-lg font-medium placeholder:font-normal backdrop-blur-sm shadow-lg hover:shadow-xl group-hover:shadow-2xl"
                  style={{ 
                    backgroundColor: '#fff8e1',
                    borderColor: '#a1887f',
                    color: '#3e2723',
                    fontFamily: 'Prompt, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    boxShadow: '0 4px 20px rgba(141, 110, 99, 0.15)'
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = '#f5f5f5';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 30px rgba(141, 110, 99, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = '#fff8e1';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 20px rgba(141, 110, 99, 0.15)';
                  }}
                  placeholder="กรอกชื่อผู้ใช้"
                  required
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2 sm:space-y-3">
              <label className="text-sm sm:text-base font-semibold block ml-1"
                     style={{ 
                       color: '#3e2723',
                       fontFamily: 'Kanit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                     }}>
                รหัสผ่าน
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 transition-all duration-300 group-hover:scale-110">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300"
                       style={{ backgroundColor: '#fff8e1' }}>
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#8d6e63' }} />
                  </div>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 sm:pl-16 pr-14 sm:pr-16 py-4 sm:py-5 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:border-transparent transition-all duration-300 text-base sm:text-lg font-medium placeholder:font-normal backdrop-blur-sm shadow-lg hover:shadow-xl group-hover:shadow-2xl"
                  style={{ 
                    backgroundColor: '#fff8e1',
                    borderColor: '#a1887f',
                    color: '#3e2723',
                    fontFamily: 'Prompt, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    boxShadow: '0 4px 20px rgba(141, 110, 99, 0.15)'
                  }}
                  onFocus={(e) => {
                    e.target.style.backgroundColor = '#f5f5f5';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 30px rgba(141, 110, 99, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.backgroundColor = '#fff8e1';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 20px rgba(141, 110, 99, 0.15)';
                  }}
                  placeholder="กรอกรหัสผ่าน"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 hover:scale-110 active:scale-95 p-2 rounded-full hover:bg-white hover:bg-opacity-50"
                  style={{ color: '#8d6e63' }}
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                </button>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 sm:py-4 px-6 sm:px-8 rounded-2xl font-bold text-base sm:text-lg text-white focus:outline-none focus:ring-4 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 sm:gap-4 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              style={{ 
                backgroundColor: '#8d6e63',
                fontFamily: 'Kanit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#5d4037'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#8d6e63'}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 sm:border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
                  เข้าสู่ระบบ
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-sm sm:text-base font-medium"
             style={{ 
               color: '#5d4037',
               fontFamily: 'Prompt, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
             }}>
            เข้าถึงได้เฉพาะผู้ดูแลระบบเท่านั้น
          </p>
        </div>
        
        {/* Demo Info */}
        <div className="mt-4 sm:mt-6 p-4 sm:p-6 rounded-2xl border-2 shadow-lg"
             style={{ 
               backgroundColor: '#fff8e1',
               borderColor: '#a1887f'
             }}>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <Coffee className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#8d6e63' }} />
            <span className="text-sm sm:text-base font-bold"
                  style={{ 
                    color: '#3e2723',
                    fontFamily: 'Kanit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
              ตัวอย่างการใช้งาน
            </span>
          </div>
          <p className="text-sm sm:text-base text-center font-medium"
             style={{ 
               color: '#5d4037',
               fontFamily: 'Prompt, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
             }}>
            ชื่อผู้ใช้: <span className="font-bold text-amber-800">"admin"</span><br />
            รหัสผ่าน: <span className="font-bold text-amber-800">"password"</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;