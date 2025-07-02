import React, { useState, useEffect, useRef } from 'react';
import './css/PointChangeNotifier.css'; // สไตล์สำหรับการแจ้งเตือนคะแนน

const PointChangeNotifier = ({ currentPoint }) => {
  const [visible, setVisible] = useState(false);
  const [difference, setDifference] = useState(0);
  const [operationType, setOperationType] = useState(''); // เพิ่มสถานะสำหรับเก็บประเภทการดำเนินการ (บวก/ลบ)
  const previousPointRef = useRef(currentPoint); // เริ่มต้นด้วยค่าปัจจุบันเพื่อหลีกเลี่ยงการแสดงผลในครั้งแรก

  useEffect(() => {
    // ตรวจสอบให้แน่ใจว่า currentPoint เป็นตัวเลข
    if (typeof currentPoint !== 'number') return;

    // ไม่ทำงานในครั้งแรกที่ component ถูกโหลด
    if (previousPointRef.current === currentPoint) return;

    // คำนวณผลต่างระหว่างค่าปัจจุบันและค่าก่อนหน้า
    const diff = currentPoint - previousPointRef.current;

    // หากผลต่างไม่เท่ากับ 0 ให้แสดงการแจ้งเตือน
    if (diff !== 0) {
      // เก็บค่าผลต่าง
      setDifference(diff);
      
      // กำหนดประเภทการดำเนินการ
      if (diff > 0) {
        // กรณีเพิ่มขึ้น: จาก previousPoint เพิ่มขึ้นเป็น currentPoint
        setOperationType('increase');
      } else {
        // กรณีลดลง: จาก previousPoint ลดลงเป็น currentPoint
        setOperationType('decrease');
      }
      
      // แสดงการแจ้งเตือน
      setVisible(true);

      // ซ่อนการแจ้งเตือนหลังจาก 3 วินาที
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      // ทำความสะอาด timer เมื่อ component ถูก unmount หรือก่อน effect รอบถัดไป
      return () => clearTimeout(timer);
    }
  }, [currentPoint]);

  // อัปเดตค่าอ้างอิงหลังจากที่เราได้ประมวลผลการเปลี่ยนแปลงแล้ว
  useEffect(() => {
    // บันทึกค่าปัจจุบันเป็นค่าก่อนหน้าสำหรับการเปรียบเทียบครั้งถัดไป
    previousPointRef.current = currentPoint;
  }, [currentPoint]);

  if (!visible) return null;

  const isPositive = difference > 0;

  return (
    <div className={`point-change-notification ${isPositive ? 'positive' : 'negative'}`}>
      <div className="notification-content">
        {isPositive ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="notification-icon">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="notification-icon">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        )}
        <span className="point-difference">
          {isPositive ? '+' : ''}{difference}
        </span>
        <span className="point-text">แต้ม</span>
      </div>
    </div>
  );
};

export default PointChangeNotifier;