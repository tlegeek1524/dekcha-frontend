import React, { useState } from 'react';
import '../css/Employeeindex.css';

export default function Employeeindex() {
  const [phone, setPhone] = useState('');
  const [price, setPrice] = useState('');
  const [coupon, setCoupon] = useState('');
  const [menu, setMenu] = useState('order'); // 'order', 'coupon', 'history'
  
  // ฝั่งซ้าย: handle เบอร์ + ราคา
  const handleSubmitInfo = () => {
    if (!phone || !price) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    alert(`บันทึกข้อมูลสำเร็จ\nเบอร์: ${phone}\nราคา: ${price} บาท`);
    setPhone('');
    setPrice('');
  };

  // ฝั่งขวา: handle โค้ดคูปอง
  const handleSubmitCoupon = () => {
    if (!coupon) {
      alert("กรุณากรอกรหัสคูปอง");
      return;
    }
    alert(`ใช้คูปองสำเร็จ: ${coupon}`);
    setCoupon('');
  };

  // สร้างรายการประวัติการขายตัวอย่าง
  const sampleHistory = [

  ];

  return (
    <div className="milk-tea-container">
      <div className="header">
        <h1>ระบบจัดการร้าน Dekcha</h1>
      </div>
      
      <div className="nav-menu">
        <button 
          className={`nav-button ${menu === 'order' ? 'active' : ''}`}
          onClick={() => setMenu('order')}
        >
          จ่ายแต้มสะสม
        </button>
        <button 
          className={`nav-button ${menu === 'coupon' ? 'active' : ''}`}
          onClick={() => setMenu('coupon')}
        >
          คูปองโปรโมชั่น
        </button>
        <button 
          className={`nav-button ${menu === 'history' ? 'active' : ''}`}
          onClick={() => setMenu('history')}
        >
          ประวัติ
        </button>
      </div>
      
      <div className="content-container">
        {menu === 'order' && (
          <div className="form-card wide-card">
            <div className="card-header">
              <h2>จ่ายแต้มสะสม</h2>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>รหัสผู้ใช้งาน</label>
                <input
                  type="text"
                  className="input-box"
                  placeholder="รหัสผู้ใช้งาน"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={4}
                />
              </div>
              <div className="form-group">
                <label>ราคารวม (บาท)</label>
                <input
                  type="number"
                  className="input-box"
                  placeholder="กรอกราคา"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="quick-buttons">
              <span>ราคาด่วน: </span>
              <button onClick={() => setPrice('45')} className="quick-price-btn">45฿</button>
              <button onClick={() => setPrice('55')} className="quick-price-btn">55฿</button>
              <button onClick={() => setPrice('65')} className="quick-price-btn">65฿</button>
              <button onClick={() => setPrice('75')} className="quick-price-btn">75฿</button>
            </div>
            <button onClick={handleSubmitInfo} className="submit-button">
              บันทึกแต้มสะสม
            </button>
          </div>
        )}

        {menu === 'coupon' && (
          <div className="form-card wide-card">
            <div className="card-header">
              <h2>คูปองโปรโมชั่น</h2>
            </div>
            <div className="form-group">
              <label>รหัสคูปอง</label>
              <input
                type="text"
                className="input-box"
                placeholder="กรอกรหัสคูปอง"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
            </div>
            <button onClick={handleSubmitCoupon} className="submit-button">
              ใช้คูปอง
            </button>
          </div>
        )}

        {menu === 'history' && (
          <div className="form-card wide-card">
            <div className="card-header">
              <h2>ประวัติ</h2>
            </div>
            <div className="history-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>เวลา</th>
                    <th>เบอร์โทร</th>
                    <th>รายการ</th>
                    <th>ราคา</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleHistory.map(item => (
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td>{item.phone}</td>
                      <td>{item.items}</td>
                      <td>{item.price} ฿</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <div className="footer">
        <p>© ร้านชานมหวานละมุน | วันที่: 01/05/2025</p>
      </div>
    </div>
  );
}