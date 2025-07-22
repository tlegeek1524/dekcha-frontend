import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickActions from '../quickaction';

const API_URL = import.meta.env.VITE_API_URL;

// Constants
const CATEGORIES = ['ชามุกลาวา', 'ชา', 'ชาพ่นไฟ'];
const STATUS_OPTIONS = [
  { value: '2', label: 'ใช้งาน' },
  { value: '1', label: 'ไม่ใช้งาน' },
  { value: '0', label: 'สินค้าหมด' }
];

const STATUS_CONFIG = {
  '2': { color: 'bg-green-100 text-green-800', bgColor: 'bg-green-500', label: 'ใช้งาน' },
  '1': { color: 'bg-red-100 text-red-800', bgColor: 'bg-yellow-400', label: 'ไม่ใช้งาน' },
  '0': { color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-red-500', label: 'สินค้าหมด' },
  default: { color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-400', label: 'ไม่ระบุ' }
};

const INITIAL_FORM_DATA = {
  idmenu: '',
  name: '',
  point: '',
  category: '',
  date: '',
  exp: '',
  status: '2',
  image: ''
};

// Helper function to generate unique menu ID
const generateMenuId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `menu_${timestamp}_${random}`;
};

// Helper function to format date for display
const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH');
  } catch (error) {
    return dateString;
  }
};

// Helper function to format date for input
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
};

// Add fade-in animation styles
const fadeInKeyframes = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
  }
`;

if (typeof document !== 'undefined' && !document.querySelector('#menu-animations')) {
  const style = document.createElement('style');
  style.id = 'menu-animations';
  style.textContent = fadeInKeyframes;
  document.head.appendChild(style);
}

const LoadingSpinner = React.memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
      <p className="text-gray-700 text-lg">กำลังโหลดเมนู...</p>
    </div>
  </div>
));

const ErrorDisplay = React.memo(({ error, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
    <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-red-600 mb-2">เกิดข้อผิดพลาด</h2>
      <p className="text-gray-700 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        ลองใหม่
      </button>
    </div>
  </div>
));

const MenuCard = React.memo(({ menu, onEdit, onDelete, index = 0, isLastUpdated = false }) => {
  const statusConfig = STATUS_CONFIG[menu.status] || STATUS_CONFIG.default;
  const [imageError, setImageError] = useState(false);

  const handleEdit = useCallback(() => onEdit(menu), [onEdit, menu]);
  const handleDelete = useCallback(() => onDelete(menu), [onDelete, menu]);
  const handleImageError = useCallback(() => setImageError(true), []);

  const imageUrl = menu.image || `https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop&auto=format`;
  
  return (
    <div
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border overflow-hidden ${
        isLastUpdated ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-100'
      } opacity-0 fade-in-up relative`}
      style={{
        animationDelay: `${index * 0.1}s`,
        animationFillMode: 'forwards'
      }}
    >
      {isLastUpdated && (
        <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-md animate-pulse z-10">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            อัพเดตล่าสุด
          </div>
        </div>
      )}

      <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-200 overflow-hidden">
        {!imageError ? (
          <img
            src={imageUrl}
            alt={menu.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-amber-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-amber-600 text-sm font-medium">{menu.name}</p>
            </div>
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-sm ${statusConfig.color}`}>
            <div className={`w-2 h-2 rounded-full ${statusConfig.bgColor}`}></div>
            {statusConfig.label}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-2">
            <h3 className="text-lg font-bold text-gray-900 truncate">{menu.name}</h3>
            <p className="text-xs text-gray-500 mt-1">ID: {menu.idmenu}</p>
          </div>
          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-sm font-bold text-yellow-700">{menu.point}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500">หมวดหมู่</p>
            <p className="text-sm font-medium text-gray-700">{menu.category}</p>
          </div>
        </div>

        {(menu.date || menu.exp) && (
          <div className="border-t border-gray-100 pt-3 mb-4">
            <div className="grid grid-cols-1 gap-2 text-xs">
              {menu.date && (
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">วันที่เพิ่ม: {formatDateForDisplay(menu.date)}</span>
                </div>
              )}
              {menu.exp && (
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">หมดอายุ: {formatDateForDisplay(menu.exp)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2.5 px-3 rounded-lg transition-colors duration-200 text-sm flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            แก้ไข
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2.5 px-3 rounded-lg transition-colors duration-200 text-sm flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            ลบ
          </button>
        </div>
      </div>
    </div>
  );
});

const Modal = React.memo(({ isOpen, onClose, isEditing, formData, onInputChange, onSubmit, formErrors }) => {
  const [imagePreview, setImagePreview] = useState(formData.image || '');

  useEffect(() => {
    setImagePreview(formData.image || '');
  }, [formData.image]);

  const handleImageChange = (e) => {
    const { value } = e.target;
    setImagePreview(value);
    onInputChange(e);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {isEditing ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Menu ID Field - แสดงเฉพาะตอนแก้ไข */}
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสเมนู</label>
                <input
                  type="text"
                  name="idmenu"
                  value={formData.idmenu}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">รหัสเมนูไม่สามารถแก้ไขได้</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสเมนู</label>
                <input
                  type="text"
                  value="(จะสร้างอัตโนมัติเมื่อบันทึก)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-500"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">รหัสเมนูจะถูกสร้างอัตโนมัติ</p>
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">ตัวอย่างรูปภาพ</label>
                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full hidden items-center justify-center bg-gray-100">
                    <span className="text-gray-500">ไม่สามารถโหลดรูปภาพได้</span>
                  </div>
                </div>
              </div>
            )}

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL รูปภาพ (ไม่บังคับ)</label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleImageChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-xs text-gray-500 mt-1">ใส่ URL รูปภาพของเมนู หากไม่ใส่จะใช้รูปเริ่มต้น</p>
            </div>

            {/* Menu Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อเมนู <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  formErrors?.name ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {formErrors?.name && (
                <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                คะแนน <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="point"
                value={formData.point}
                onChange={onInputChange}
                min="1"
                step="1"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  formErrors?.point ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {formErrors?.point && (
                <p className="text-xs text-red-500 mt-1">{formErrors.point}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">จำนวนคะแนนที่ใช้แลกเมนูนี้</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={onInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  formErrors?.category ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">เลือกหมวดหมู่</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {formErrors?.category && (
                <p className="text-xs text-red-500 mt-1">{formErrors.category}</p>
              )}
            </div>

            {/* Date fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่เริ่มใช้ <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={onInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    formErrors?.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {formErrors?.date && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันหมดอายุ <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="exp"
                  value={formData.exp}
                  onChange={onInputChange}
                  min={formData.date} // ป้องกันเลือกวันหมดอายุก่อนวันที่เริ่มใช้
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    formErrors?.exp ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {formErrors?.exp && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.exp}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                สถานะ <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">สถานะการใช้งานของเมนู</p>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={onSubmit}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {isEditing ? 'อัพเดตเมนู' : 'เพิ่มเมนูใหม่'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function MainMenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [lastUpdatedId, setLastUpdatedId] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();

  // Mock user data
  const currentUser = {
    id: "user123",
    name: "พนักงาน Admin",
    role: "admin"
  };

  useEffect(() => {
    const token = localStorage.getItem('AuthToken');
    if (!token) {
      navigate('/auth/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('AuthToken');
    navigate('/auth/login');
  };

  // Form validation
  const validateForm = useCallback((data) => {
    const errors = {};

    if (!data.name.trim()) {
      errors.name = 'กรุณาใส่ชื่อเมนู';
    }

    if (!data.point.trim()) {
      errors.point = 'กรุณาใส่คะแนน';
    } else if (isNaN(data.point) || parseInt(data.point) <= 0) {
      errors.point = 'คะแนนต้องเป็นตัวเลขมากกว่า 0';
    }

    if (!data.category.trim()) {
      errors.category = 'กรุณาเลือกหมวดหมู่';
    }

    if (!data.date.trim()) {
      errors.date = 'กรุณาเลือกวันที่เริ่มใช้';
    }

    if (!data.exp.trim()) {
      errors.exp = 'กรุณาเลือกวันหมดอายุ';
    } else if (data.date && data.exp && new Date(data.exp) <= new Date(data.date)) {
      errors.exp = 'วันหมดอายุต้องหลังจากวันที่เริ่มใช้';
    }

    return errors;
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [formErrors]);

  const fetchMenus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/menu/`);
      if (!response.ok) throw new Error('ไม่สามารถโหลดเมนูได้');

      const data = await response.json();
      setMenuItems(data || []);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, []);

  const openEditModal = useCallback((menu) => {
    setSelectedMenu(menu);
    setIsEditing(true);
    setFormData({
      idmenu: menu.idmenu || '',
      name: menu.name || '',
      point: String(menu.point) || '',
      category: menu.category || '',
      date: formatDateForInput(menu.date) || '',
      exp: formatDateForInput(menu.exp) || '',
      status: String(menu.status) || '2',
      image: menu.image || ''
    });
    setFormErrors({});
    setShowModal(true);
  }, []);

  const openAddModal = useCallback(() => {
    setSelectedMenu(null);
    setIsEditing(false);
    setFormData({
      ...INITIAL_FORM_DATA,
      date: new Date().toISOString().split('T')[0] // Set today as default date
    });
    setFormErrors({});
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      // Validate form
      const errors = validateForm(formData);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      // Prepare data for API
      const menuData = {
        idmenu: isEditing ? selectedMenu.idmenu : generateMenuId(),
        name: formData.name.trim(),
        point: parseInt(formData.point),
        category: formData.category.trim(),
        date: new Date(formData.date).toISOString(),
        exp: new Date(formData.exp).toISOString(),
        status: parseInt(formData.status)
      };

      // Add image if provided
      if (formData.image.trim()) {
        menuData.image = formData.image.trim();
      }

      const url = isEditing
        ? `${API_URL}/menu/update/${selectedMenu.idmenu}`
        : `${API_URL}/menu/`;

      const method = isEditing ? 'PUT' : 'POST';

      console.log('Sending data to API:', menuData);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (isEditing) {
        setLastUpdatedId(selectedMenu.idmenu);
      } else {
        setLastUpdatedId(menuData.idmenu);
      }

      setTimeout(() => setLastUpdatedId(null), 5000);

      alert(isEditing ? 'อัพเดตเมนูสำเร็จ' : 'เพิ่มเมนูสำเร็จ');
      setShowModal(false);
      await fetchMenus();
    } catch (err) {
      console.error('Save Error:', err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }, [formData, isEditing, selectedMenu, fetchMenus, validateForm]);

  const sortedMenuItems = useMemo(() => {
    if (!lastUpdatedId) return menuItems;

    const sorted = [...menuItems].sort((a, b) => {
      if (a.idmenu === lastUpdatedId) return -1;
      if (b.idmenu === lastUpdatedId) return 1;
      return 0;
    });

    return sorted;
  }, [menuItems, lastUpdatedId]);

  const handleDelete = useCallback(async (menu) => {
    if (!confirm(`ต้องการลบเมนู "${menu.name}" หรือไม่?`)) return;

    try {
      const response = await fetch(`${API_URL}/menu/${menu.idmenu}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      alert('ลบเมนูสำเร็จ');
      await fetchMenus();
    } catch (err) {
      console.error('Delete Error:', err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }, [fetchMenus]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setFormErrors({});
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchMenus} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b-2 border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-amber-800">จัดการเมนูทั้งหมด</h1>
              <p className="text-gray-600 mt-1">จำนวนเมนูทั้งหมด: {menuItems.length} รายการ</p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>เพิ่มเมนูใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <QuickActions
          userId={currentUser.id}
          onLogout={handleLogout}
          showLogout={true}
        />
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {menuItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">ยังไม่มีเมนู</h3>
            <p className="text-gray-500 mb-4">เริ่มต้นเพิ่มเมนูแรกของคุณ</p>
            <button
              onClick={openAddModal}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              เพิ่มเมนูใหม่
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedMenuItems.map((menu, index) => (
              <MenuCard
                key={menu.idmenu}
                menu={menu}
                onEdit={openEditModal}
                onDelete={handleDelete}
                index={index}
                isLastUpdated={menu.idmenu === lastUpdatedId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        isEditing={isEditing}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        formErrors={formErrors}
      />

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-600">
            © DekCha เมืองตาก | {new Date().toLocaleDateString('th-TH')}
          </p>
        </div>
      </div>
    </div>
  );
}