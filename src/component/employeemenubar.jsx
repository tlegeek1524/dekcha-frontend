import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'tailwindcss/tailwind.css';
export default function MenuPage() {
  
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">เมนูหลัก</h1>
      <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        <button
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          onClick={() => navigate('/auth/employee/menu')}
        >
          ไปที่หน้า 1
        </button>
        <button
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          onClick={() => navigate('/auth/historycupon')}
        >
          ไปที่หน้า 2
        </button>
        <button
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          onClick={() => navigate('/auth/employee')}
        >
          ไปที่หน้า 3
        </button>
      </div>
    </div>
  );
}