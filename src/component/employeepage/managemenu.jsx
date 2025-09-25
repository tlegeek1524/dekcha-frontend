import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

// Lazy load components
const QuickActions = lazy(() => import('../quickaction'));

// Environment variables with fallbacks
const API_URL = import.meta.env.VITE_API_URL || '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase client only if config is available
const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// Constants - moved to top level to prevent recreation
const CATEGORIES = ['ชามุกลาวา', 'ชา', 'ชาพ่นไฟ'];
const STATUS_OPTIONS = [
  { value: '2', label: 'ใช้งาน' },
  { value: '1', label: 'ไม่ได้ใช้งาน' },
  { value: '0', label: 'หมดอายุ' },
  { value: '3', label: 'ไม่หมดอายุ' }
];

const STATUS_CONFIG = {
  '2': { color: 'bg-green-100 text-green-800', bgColor: 'bg-green-500', label: 'ใช้งาน' },
  '1': { color: 'bg-red-100 text-red-800', bgColor: 'bg-yellow-400', label: 'ไม่ได้ใช้งาน' },
  '0': { color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-red-500', label: 'หมดอายุ' },
  '3': { color: 'bg-blue-100 text-blue-800', bgColor: 'bg-blue-500', label: 'ไม่หมดอายุ' },
  default: { color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-400', label: 'ไม่ระบุ' }
};

const INITIAL_FORM_DATA = { 
  name: '', 
  point: '', 
  category: '', 
  date: '', 
  exp: '', 
  status: '2', 
  image: null 
};

const SORT_OPTIONS = [
  { value: 'all', label: 'ทั้งหมด', icon: '🌍' },
  { value: 'active', label: 'ใช้งาน', icon: '✅' },
  { value: 'inactive', label: 'ไม่ได้ใช้งาน', icon: '❌' },
  { value: 'expired', label: 'หมดอายุ', icon: '⏰' }
];

const STATUS_MAP = {
  active: 2,
  inactive: 1,
  expired: 0
};

const DEFAULT_IMAGE = 'https://uibaorxgziixlbslvlcm.supabase.co/storage/v1/object/public/menu-images/dekcha_logo-01.png';

// Utility functions - pure functions extracted
const generateMenuId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return `TEA_${Array.from({ length: 6 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')}`;
};

const formatDateForDisplay = (dateString) => 
  dateString ? new Date(dateString).toLocaleDateString('th-TH') : '';

const formatDateForInput = (dateString) => 
  dateString ? new Date(dateString).toISOString().split('T')[0] : '';

// Image utilities with better error handling
const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    initialQuality: 0.7
  };
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('ไม่สามารถบีบอัดรูปภาพได้');
  }
};

// Image upload cache with LRU implementation
class LRUCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

const imageUploadCache = new LRUCache();

const uploadImageToSupabase = async (file, menuId) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
  const cached = imageUploadCache.get(cacheKey);
  if (cached) return cached;

  const fileExt = file.name.split('.').pop();
  const fileName = `${menuId}_${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('menu-images')
    .upload(fileName, file, { upsert: false });
  
  if (error) throw new Error(`Upload failed: ${error.message}`);
  
  const { data: publicUrlData } = supabase.storage
    .from('menu-images')
    .getPublicUrl(fileName);
  
  imageUploadCache.set(cacheKey, publicUrlData.publicUrl);
  return publicUrlData.publicUrl;
};

const deleteImageFromSupabase = async (imageUrl) => {
  if (!supabase || !imageUrl?.includes('supabase')) return;
  
  try {
    const fileName = imageUrl.split('/').pop();
    await supabase.storage.from('menu-images').remove([fileName]);
  } catch (error) {
    console.error('Delete error:', error);
  }
};

// Inject animations only once
const injectAnimations = (() => {
  let injected = false;
  return () => {
    if (injected || typeof document === 'undefined') return;
    
    const style = document.createElement('style');
    style.id = 'menu-animations';
    style.textContent = `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .fade-in-up { 
        animation: fadeInUp 0.6s ease-out forwards; 
      }
      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      .notification {
        animation: slideIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    injected = true;
  };
})();

// Notification system
const showNotification = (message, type = 'success') => {
  const notification = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 notification`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

// Optimized Loading Component
const LoadingSpinner = React.memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
      <p className="text-gray-700 text-lg">กำลังโหลดเมนู...</p>
    </div>
  </div>
));

// Error Display Component
const ErrorDisplay = React.memo(({ error, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
    <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
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

// Sort and Filter Controls - Optimized for mobile
const SortFilterControls = React.memo(({ 
  selectedCategory, 
  onCategoryChange, 
  selectedSort, 
  onSortChange, 
  showLatestOnly, 
  onShowLatestToggle,
  latestUpdateCount 
}) => (
  <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6 border border-gray-100 w-full max-w-7xl mx-auto sticky top-0 z-10">
    <div className="grid gap-4">
      {/* Category Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => onCategoryChange('')}
          className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
            selectedCategory === '' 
              ? 'bg-amber-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ทั้งหมด
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
              selectedCategory === category 
                ? 'bg-amber-500 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Latest Updates Toggle */}
        <button
          onClick={onShowLatestToggle}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
            showLatestOnly 
              ? 'bg-green-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          อัพเดทล่าสุด
          {latestUpdateCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {latestUpdateCount}
            </span>
          )}
        </button>

        {/* Status Filter Dropdown */}
        <div className="relative flex-1 sm:max-w-xs">
          <select
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
));

// Enhanced MenuCard with better performance
const MenuCard = React.memo(({ 
  menu, 
  onEdit, 
  onDelete, 
  index = 0, 
  isLastUpdated = false, 
  isRecentUpdate = false 
}) => {
  const [imageError, setImageError] = useState(false);
  const statusConfig = STATUS_CONFIG[menu.status] || STATUS_CONFIG.default;
  const imageUrl = menu.image || DEFAULT_IMAGE;

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleEdit = useCallback(() => {
    onEdit(menu);
  }, [onEdit, menu]);

  const handleDelete = useCallback(() => {
    onDelete(menu);
  }, [onDelete, menu]);

  return (
    <div 
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border overflow-hidden ${
        isLastUpdated 
          ? 'border-green-400 ring-2 ring-green-200' 
          : isRecentUpdate 
          ? 'border-blue-400 ring-2 ring-blue-200' 
          : 'border-gray-100'
      } opacity-0 fade-in-up relative`} 
      style={{ 
        animationDelay: `${Math.min(index * 0.1, 2)}s`, 
        animationFillMode: 'forwards' 
      }}
    >
      {/* Update Badge */}
      {(isLastUpdated || isRecentUpdate) && (
        <div className={`absolute top-3 right-3 ${isLastUpdated ? 'bg-green-500' : 'bg-blue-500'} text-white px-2 py-1 rounded-full text-xs font-medium shadow-md z-10`}>
          {isLastUpdated ? 'ล่าสุด' : 'ใหม่'}
        </div>
      )}

      {/* Image Container */}
      <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-200 overflow-hidden">
        {!imageError ? (
          <img 
            src={imageUrl}
            alt={menu.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-amber-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-10V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-4z" />
              </svg>
              <p className="text-amber-600 text-sm font-medium">{menu.name}</p>
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-sm ${statusConfig.color}`}>
            <div className={`w-2 h-2 rounded-full ${statusConfig.bgColor}`}></div>
            {statusConfig.label}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-2">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{menu.name}</h3>
            <p className="text-xs text-gray-500 mt-1">ID: {menu.idmenu}</p>
          </div>
          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg shrink-0">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-sm font-bold text-yellow-700">{menu.point}</span>
          </div>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500">หมวดหมู่</p>
            <p className="text-sm font-medium text-gray-700">{menu.category}</p>
          </div>
        </div>

        {/* Dates */}
        {(menu.date || menu.exp) && (
          <div className="border-t border-gray-100 pt-3 mb-4">
            <div className="space-y-2 text-xs">
              {menu.date && (
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">เริ่ม: {formatDateForDisplay(menu.date)}</span>
                </div>
              )}
              {menu.exp && (
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">หมดอายุ: {formatDateForDisplay(menu.exp)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={handleEdit}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2.5 px-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            แก้ไข
          </button>
          <button 
            onClick={handleDelete}
            className="bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2.5 px-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            ลบ
          </button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Enhanced comparison for better memoization
  return (
    prevProps.menu.idmenu === nextProps.menu.idmenu &&
    prevProps.menu.status === nextProps.menu.status &&
    prevProps.menu.name === nextProps.menu.name &&
    prevProps.menu.point === nextProps.menu.point &&
    prevProps.menu.image === nextProps.menu.image &&
    prevProps.isLastUpdated === nextProps.isLastUpdated &&
    prevProps.isRecentUpdate === nextProps.isRecentUpdate
  );
});

// Enhanced Modal Component
const Modal = React.memo(({ 
  isOpen, 
  onClose, 
  isEditing, 
  formData, 
  onInputChange, 
  onSubmit, 
  formErrors, 
  uploading 
}) => {
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (formData.image && typeof formData.image === 'object') {
      const url = URL.createObjectURL(formData.image);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    if (formData.image && typeof formData.image === 'string') {
      setImagePreview(formData.image);
    } else {
      setImagePreview('');
    }
  }, [formData.image]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, GIF, WebP)', 'error');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      showNotification('ขนาดไฟล์ต้องไม่เกิน 10MB', 'error');
      return;
    }
    
    onInputChange({ target: { name: 'image', value: file } });
  }, [onInputChange]);

  const removeImage = useCallback(() => {
    setImagePreview('');
    onInputChange({ target: { name: 'image', value: null } });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onInputChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {isEditing ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">รูปภาพเมนู</label>
              
              {imagePreview && (
                <div className="mb-4 relative">
                  <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  id="image-upload" 
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600 mb-1 font-medium">
                      {imagePreview ? 'เปลี่ยนรูปภาพ' : 'เลือกรูปภาพ'}
                    </p>
                    <p className="text-xs text-gray-400 text-center">
                      รองรับ JPG, PNG, GIF, WebP<br/>
                      ขนาดไม่เกิน 10MB • ความละเอียด 800x600px
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อเมนู <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                    formErrors?.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ใส่ชื่อเมนู"
                  required
                />
                {formErrors?.name && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คะแนน <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="point"
                  value={formData.point}
                  onChange={onInputChange}
                  min="1"
                  step="1"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                    formErrors?.point ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ใส่คะแนน"
                  required
                />
                {formErrors?.point && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.point}</p>
                )}
              </div>
            </div>

            {/* Category and Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมวดหมู่ <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={onInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะ <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={onInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                  required
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่เริ่มใช้ <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={onInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                    formErrors?.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {formErrors?.date && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันหมดอายุ <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="exp"
                  value={formData.exp}
                  onChange={onInputChange}
                  min={formData.date}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                    formErrors?.exp ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {formErrors?.exp && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.exp}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                type="submit"
                disabled={uploading}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    กำลังบันทึก...
                  </>
                ) : (
                  isEditing ? 'อัพเดตเมนู' : 'เพิ่มเมนูใหม่'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

// Main Component
export default function MainMenuPage() {
  // State management
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [lastUpdatedId, setLastUpdatedId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  
  // Filter and sort states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSort, setSelectedSort] = useState('all');
  const [showLatestOnly, setShowLatestOnly] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState(new Set());

  // Refs for performance optimization
  const menuItemsRef = useRef([]);
  const updateTimeoutRef = useRef(null);

  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('AuthToken');
    if (!token) {
      navigate('/auth/login');
      return;
    }
    injectAnimations();
  }, [navigate]);

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

  // Form input handler
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [formErrors]);

  // Update menu status in DB
  const updateMenuStatus = useCallback(async (menu, newStatus) => {
    try {
      const updatedMenu = { 
        ...menu, 
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      const response = await fetch(`${API_URL}/menu/update/${menu.idmenu}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('AuthToken')}`
        },
        body: JSON.stringify(updatedMenu),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Status update error:', err);
      // Optionally show notification or revert local change
    }
  }, []);

  // Fetch menus with error handling, status parsing, and automatic expiration check
  const fetchMenus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/menu/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('AuthToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const currentDate = new Date();
      const menuList = Array.isArray(data) ? data.map(menu => ({
        ...menu,
        status: parseInt(menu.status, 10)
      })) : [];

      // Check and update expired menus
      menuList.forEach(menu => {
        if (menu.status !== 3 && menu.exp && new Date(menu.exp) < currentDate) {
          menu.status = 0;
          // Update in DB asynchronously
          updateMenuStatus(menu, 0);
        }
      });
      
      menuItemsRef.current = menuList;
      setMenuItems(menuList);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'ไม่สามารถโหลดเมนูได้');
    } finally {
      setLoading(false);
    }
  }, [updateMenuStatus]);

  // Modal handlers
  const openEditModal = useCallback((menu) => {
    setSelectedMenu(menu);
    setIsEditing(true);
    setFormData({
      name: menu.name || '',
      point: String(menu.point) || '',
      category: menu.category || '',
      date: formatDateForInput(menu.date) || '',
      exp: formatDateForInput(menu.exp) || '',
      status: String(menu.status) || '2',
      image: menu.image || null
    });
    setFormErrors({});
    setShowModal(true);
  }, []);

  const openAddModal = useCallback(() => {
    setSelectedMenu(null);
    setIsEditing(false);
    setFormData({ 
      ...INITIAL_FORM_DATA, 
      date: new Date().toISOString().split('T')[0] 
    });
    setFormErrors({});
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setFormErrors({});
    setUploading(false);
  }, []);

  // Optimistic updates
  const updateMenuItemsOptimistically = useCallback((action, data) => {
    setMenuItems(prevItems => {
      let newItems = [...prevItems];
      
      switch (action) {
        case 'add':
          newItems.unshift(data);
          break;
        case 'update':
          const updateIndex = newItems.findIndex(item => item.idmenu === data.idmenu);
          if (updateIndex !== -1) {
            newItems[updateIndex] = { ...newItems[updateIndex], ...data };
          }
          break;
        case 'delete':
          newItems = newItems.filter(item => item.idmenu !== data.idmenu);
          break;
        default:
          break;
      }
      
      menuItemsRef.current = newItems;
      return newItems;
    });
  }, []);

  // Handle form submission
  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setUploading(true);
    
    try {
      // For editing, use existing ID; for new menu, will get from API response
      const tempMenuId = isEditing && selectedMenu ? selectedMenu.idmenu : generateMenuId();
      let imageUrl = formData.image && typeof formData.image === 'string' ? formData.image : null;
      
      // Handle image upload for new menu (use temp ID for now)
      if (formData.image && typeof formData.image === 'object') {
        try {
          const compressedFile = await compressImage(formData.image);
          imageUrl = await uploadImageToSupabase(compressedFile, tempMenuId);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          showNotification('อัปโหลดภาพไม่สำเร็จ กรุณาลองใหม่', 'error');
          setUploading(false);
          return;
        }
      }

      const menuData = {
        name: formData.name.trim(),
        point: parseInt(formData.point),
        category: formData.category.trim(),
        date: new Date(formData.date).toISOString(),
        exp: new Date(formData.exp).toISOString(),
        status: parseInt(formData.status),
        updatedAt: new Date().toISOString(),
        image: imageUrl
      };

      // Add idmenu only for editing
      if (isEditing && selectedMenu) {
        menuData.idmenu = selectedMenu.idmenu;
      }

      // Show different message for creating new menu
      if (!isEditing) {
        setShowModal(false);
        showNotification('กำลังสร้างไอดีเมนู...', 'success');
      }

      // API call
      const url = isEditing ? `${API_URL}/menu/update/${selectedMenu.idmenu}` : `${API_URL}/menu/`;
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('AuthToken')}`
        },
        body: JSON.stringify(menuData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      if (isEditing) {
        // For editing, update optimistically
        const updatedMenuData = { ...selectedMenu, ...menuData };
        updateMenuItemsOptimistically('update', updatedMenuData);
        setLastUpdatedId(selectedMenu.idmenu);
        setRecentUpdates(prev => new Set([...prev, selectedMenu.idmenu]));
        setShowModal(false);
        
        showNotification('อัพเดตเมนูสำเร็จ', 'success');
        
        // Clear recent update indicator after 5 seconds
        setTimeout(() => {
          setRecentUpdates(prev => {
            const newSet = new Set(prev);
            newSet.delete(selectedMenu.idmenu);
            return newSet;
          });
        }, 5000);
      } else {
        // For new menu, show success and refresh page
        showNotification('สร้างเมนูใหม่สำเร็จ กำลังรีเฟรชหน้า...', 'success');
        
        // Refresh page after short delay to show success message
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }

    } catch (error) {
      console.error('Submit error:', error);
      showNotification('เกิดข้อผิดพลาด: ' + error.message, 'error');
      
      // Revert optimistic update on error (only for editing)
      if (isEditing) {
        updateMenuItemsOptimistically('update', selectedMenu);
      }
    } finally {
      if (isEditing) {
        setUploading(false);
      }
      // For new menu, uploading state will be reset by page refresh
    }
  }, [formData, isEditing, selectedMenu, validateForm, updateMenuItemsOptimistically]);

  // Handle delete with confirmation
  const handleDelete = useCallback(async (menu) => {
    if (!window.confirm(`ต้องการลบเมนู "${menu.name}" หรือไม่?`)) return;
    
    try {
      // Optimistic update
      updateMenuItemsOptimistically('delete', menu);
      
      // Delete image if exists
      if (menu.image && menu.image.includes('supabase')) {
        deleteImageFromSupabase(menu.image).catch(console.error);
      }
      
      // API call
      const response = await fetch(`${API_URL}/menu/${menu.idmenu}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('AuthToken')}`
        }
      });
      
      if (!response.ok) {
        // Revert on API error
        updateMenuItemsOptimistically('add', menu);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      showNotification('ลบเมนูสำเร็จ', 'success');
      
    } catch (err) {
      console.error('Delete error:', err);
      showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
  }, [updateMenuItemsOptimistically]);

  // Logout handler
  const handleLogout = useCallback(() => {
    localStorage.removeItem('AuthToken');
    navigate('/auth/login');
  }, [navigate]);

  // Filtered and sorted menu items
  const filteredAndSortedMenuItems = useMemo(() => {
    let filtered = [...menuItems];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(menu => menu.category === selectedCategory);
    }

    // Status filter
    if (selectedSort !== 'all') {
      const statusValue = STATUS_MAP[selectedSort];
      if (statusValue !== undefined) {
        filtered = filtered.filter(menu => menu.status === statusValue);
      }
    }

    // Latest only filter
    if (showLatestOnly) {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      filtered = filtered.filter(menu => {
        const menuDate = new Date(menu.updatedAt || menu.date);
        return menuDate > oneDayAgo || recentUpdates.has(menu.idmenu) || menu.idmenu === lastUpdatedId;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      // Prioritize recently updated items
      if (a.idmenu === lastUpdatedId) return -1;
      if (b.idmenu === lastUpdatedId) return 1;
      
      if (recentUpdates.has(a.idmenu) && !recentUpdates.has(b.idmenu)) return -1;
      if (recentUpdates.has(b.idmenu) && !recentUpdates.has(a.idmenu)) return 1;

      // Default sort by newest
      return new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date);
    });

    return filtered;
  }, [menuItems, selectedCategory, selectedSort, showLatestOnly, lastUpdatedId, recentUpdates]);

  // Calculate latest update count
  const latestUpdateCount = useMemo(() => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return menuItems.filter(menu => {
      const menuDate = new Date(menu.updatedAt || menu.date);
      return menuDate > oneDayAgo || recentUpdates.has(menu.idmenu) || menu.idmenu === lastUpdatedId;
    }).length;
  }, [menuItems, recentUpdates, lastUpdatedId]);

  // Initialize data
  useEffect(() => {
    fetchMenus();
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [fetchMenus]);

  // Render loading state
  if (loading) return <LoadingSpinner />;
  
  // Render error state
  if (error) return <ErrorDisplay error={error} onRetry={fetchMenus} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b-2 border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-amber-800">
                จัดการเมนูทั้งหมด
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                แสดง: {filteredAndSortedMenuItems.length} จาก {menuItems.length} รายการ
                {selectedCategory && (
                  <span className="text-amber-600"> | หมวดหมู่: {selectedCategory}</span>
                )}
                {showLatestOnly && (
                  <span className="text-green-600"> | รายการล่าสุดเท่านั้น</span>
                )}
              </p>
            </div>
            <button 
              onClick={openAddModal}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2 w-full sm:w-auto shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>เพิ่มเมนูใหม่</span>
            </button>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <Suspense fallback={<div className="h-20 bg-white rounded-lg animate-pulse"></div>}>
          <QuickActions 
            userId="user123" 
            onLogout={handleLogout} 
            showLogout={true} 
          />
        </Suspense>
      </div>

      {/* Sort and Filter Controls */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mt-6">
        <SortFilterControls
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
          showLatestOnly={showLatestOnly}
          onShowLatestToggle={() => setShowLatestOnly(!showLatestOnly)}
          latestUpdateCount={latestUpdateCount}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredAndSortedMenuItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-6">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-3">
              {selectedCategory || showLatestOnly || selectedSort !== 'all' ? 'ไม่พบเมนูที่ตรงตามเงื่อนไข' : 'ยังไม่มีเมนู'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {selectedCategory || showLatestOnly || selectedSort !== 'all'
                ? 'ลองเปลี่ยนตัวกรองหรือเพิ่มเมนูใหม่' 
                : 'เริ่มต้นเพิ่มเมนูแรกของคุณ'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              {(selectedCategory || showLatestOnly || selectedSort !== 'all') && (
                <button 
                  onClick={() => {
                    setSelectedCategory('');
                    setShowLatestOnly(false);
                    setSelectedSort('all');
                  }} 
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  แสดงทั้งหมด
                </button>
              )}
              <button 
                onClick={openAddModal}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg"
              >
                เพิ่มเมนูใหม่
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedMenuItems.map((menu, index) => (
              <MenuCard 
                key={`${menu.idmenu}-${menu.status}-${menu.updatedAt || menu.date}`}
                menu={menu} 
                onEdit={openEditModal} 
                onDelete={handleDelete} 
                index={index} 
                isLastUpdated={menu.idmenu === lastUpdatedId}
                isRecentUpdate={recentUpdates.has(menu.idmenu)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={closeModal} 
        isEditing={isEditing} 
        formData={formData} 
        onInputChange={handleInputChange} 
        onSubmit={handleSubmit} 
        formErrors={formErrors} 
        uploading={uploading} 
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © DekCha เมืองตาก | {new Date().toLocaleDateString('th-TH')}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              ระบบจัดการเมนู - เวอร์ชัน 2.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
