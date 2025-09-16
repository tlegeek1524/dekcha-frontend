// components/ReceiptModal.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import Icons from './Icons'; // Assuming Icons are exported from the same file

const ReceiptModal = React.memo(({ show, onClose, receipt }) => {
  if (!show || !receipt) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full transform transition-all duration-300 animate-scale-in border border-gray-100 relative" 
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors duration-200 border border-gray-300 rounded-full p-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">รายละเอียดใบเสร็จ</h2>
          <p className="text-sm text-gray-600">รหัสคูปอง: {receipt.code_coupon}</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Icons.Gift className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-800">รายการ</p>
              <p className="text-sm text-gray-600">{receipt.menu_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Icons.Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-medium text-gray-800">คะแนนที่ใช้</p>
              <p className="text-sm text-gray-600">{receipt.point_coupon} คะแนน</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Icons.User className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-gray-800">ผู้ทำรายการ</p>
              <p className="text-sm text-gray-600">{receipt.name_emp}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Icons.Clock className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-800">วันที่ใช้งาน</p>
              <p className="text-sm text-gray-600">{formatDate(receipt.create_date)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});

export default ReceiptModal;