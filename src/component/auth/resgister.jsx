// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstname_emp: '',
    lastname_emp: '',
    name_emp: '',
    pincode_emp: '',
    password_emp: '',
    email_emp: '',
    phone_emp: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, formData);
      console.log('Register success:', response.data);
      alert('Register success');
      
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

      // Navigate to login page after successful registration
      navigate('/auth/login');
    } catch (error) {
      console.error('Register error:', error.response ? error.response.data : error.message);
      alert(`Register failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">สร้างบัญชี</h1>
          <p className="text-slate-500 text-sm">เริ่มต้นใช้งานกับเรา</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">ชื่อจริง</label>
                <input
                  type="text"
                  name="firstname_emp"
                  value={formData.firstname_emp}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                  placeholder="ชื่อ"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">นามสกุล</label>
                <input
                  type="text"
                  name="lastname_emp"
                  value={formData.lastname_emp}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                  placeholder="นามสกุล"
                />
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">ชื่อที่ใช้แสดง</label>
              <input
                type="text"
                name="name_emp"
                value={formData.name_emp}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                placeholder="ชื่อที่ใช้แสดง"
              />
            </div>

            {/* PIN Code */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">รหัส PIN</label>
              <input
                type="text"
                name="pincode_emp"
                value={formData.pincode_emp}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                placeholder="รหัส PIN"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">รหัสผ่าน</label>
              <input
                type="password"
                name="password_emp"
                value={formData.password_emp}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                placeholder="รหัสผ่าน"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">อีเมล</label>
              <input
                type="email"
                name="email_emp"
                value={formData.email_emp}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                placeholder="example@email.com"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                name="phone_emp"
                value={formData.phone_emp}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                placeholder="08x-xxx-xxxx"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-6 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                isLoading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white shadow-sm hover:shadow'
              } focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  กำลังสร้างบัญชี...
                </div>
              ) : (
                'สร้างบัญชี'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-center text-sm text-slate-500">
              มีบัญชีอยู่แล้ว?{' '}
              <button
                onClick={() => navigate('/auth/login')}
                className="text-slate-800 hover:text-slate-600 font-medium transition-colors duration-200 underline underline-offset-2"
              >
                เข้าสู่ระบบ
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          การสร้างบัญชีแสดงว่าคุณยอมรับเงื่อนไขการใช้งาน
        </p>
      </div>
    </div>
  );
}

export default Register;