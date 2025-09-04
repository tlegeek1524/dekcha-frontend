import React, { useState, useEffect } from 'react';
import { QRCode } from 'react-qr-code'; // ต้องติดตั้งไลบรารีนี้

// Component สำหรับแสดงทักษะและเปอร์เซ็นต์
const SkillBar = ({ skill, finalPercentage }) => {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    // ใช้ setInterval เพื่อเพิ่มเปอร์เซ็นต์ทีละ 1% ทุก 20ms
    const interval = setInterval(() => {
      setPercentage((prev) => {
        if (prev >= finalPercentage) {
          clearInterval(interval); // หยุดเมื่อถึงเปอร์เซ็นต์สุดท้าย
          return finalPercentage;
        }
        return prev + 1; // เพิ่มเปอร์เซ็นต์ทีละ 1%
      });
    }, 20);

    // ทำการ clean-up เมื่อคอมโพเนนต์ unmount
    return () => clearInterval(interval);
  }, [finalPercentage]);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-800 font-semibold">{skill}</span>
        <span className="text-gray-600">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// ส่วนของ Report
const Report = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-6">
      {/* ส่วน 1: ชื่อ */}
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">รายงานทักษะของคุณ</h1>

      {/* ส่วน 2: ทักษะที่มี */}
      <div className="w-full max-w-3xl mb-6">
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">ทักษะที่คุณมี</h2>
        <SkillBar skill="React" finalPercentage={90} />
        <SkillBar skill="JavaScript" finalPercentage={80} />
        <SkillBar skill="CSS" finalPercentage={75} />
        <SkillBar skill="HTML" finalPercentage={95} />
      </div>

      {/* ส่วน 3: คำอธิบายทักษะ */}
      <div className="w-full max-w-3xl mb-6 bg-white shadow-md rounded-lg p-6">
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">คำอธิบายทักษะ</h3>
        <p className="text-gray-600">ทักษะที่เรามีเป็นผลจากการฝึกฝนและเรียนรู้ผ่านโครงการต่างๆ โดยทักษะที่เราเชี่ยวชาญที่สุดคือ React ซึ่งเราใช้ในการพัฒนาเว็บแอปพลิเคชันอย่างต่อเนื่อง</p>
      </div>

      {/* ส่วน 4: ทักษะที่ต้องพัฒนา */}
      <div className="w-full max-w-3xl mb-6">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">ทักษะที่ต้องพัฒนา</h3>
        <ul className="list-disc pl-6 text-gray-600">
          <li>TypeScript</li>
          <li>Testing (Jest, Mocha)</li>
          <li>Node.js</li>
        </ul>
      </div>

      {/* ส่วน 5: QR Code */}
      <div className="w-full max-w-xs mb-6">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">QR Code</h3>
        <div className="flex justify-center">
          <QRCode value="https://www.example.com" />
        </div>
      </div>
    </div>
  );
};

export default Report;
