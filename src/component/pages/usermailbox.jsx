import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import liff from '@line/liff';
import DOMPurify from 'dompurify';
import Cookies from 'js-cookie';
import QRCode from 'react-qr-code'; // Added import for QR code library
import Navbar from '../navbar';
import Spinner from '../util/LoadSpinner';

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    return new Promise(resolve => {
      timeout = setTimeout(() => resolve(func(...args)), wait);
    });
  };
};

// Optimized Icons with React.memo
const Icons = {
  Error: React.memo(() => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Error">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  )),
  User: React.memo(() => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="User">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )),
  Mail: React.memo(() => (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Mail">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )),
  Star: React.memo(({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-label="Star">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )),
  Check: React.memo(() => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Check">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )),
  Refresh: React.memo(() => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Refresh">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )),
  Plus: React.memo(() => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Plus">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  )),
  Minus: React.memo(() => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Minus">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  )),
  Clock: React.memo(() => (
    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Clock">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )),
  Spinner: React.memo(() => (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-label="Loading">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )),
  ChevronRight: React.memo(() => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Next">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )),
  ChevronLeft: React.memo(() => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Previous">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )),
  Gift: React.memo(() => (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Gift">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )),
  Copy: React.memo(() => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Copy">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )),
  QrCode: React.memo(() => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="QR Code">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h.01v.01H14V17zm3 0h.01v.01H17V17zm3 0h.01v.01H20V17zm-3-3h.01v.01H17V14zm-3 3h.01v.01H14V17zm0-3h.01v.01H14V14zm3 0h.01v.01H17V14zm0-3h.01v.01H17V11zm-3 0h.01v.01H14V11z"/>
    </svg>
  ))
};

// Configuration constants
const CONFIG = {
  LIFF_ID: import.meta.env.VITE_LIFF_ID,
  API_URL: import.meta.env.VITE_API_URL,
  TOAST_DURATION: 3000,
  POLLING_INTERVAL: 300000, // 5 minutes
  PAGE_SIZE: 20,
  CACHE_DURATION: 90000 // 90 seconds
};

// In-memory cache
const cache = new Map();
const getCached = (key, maxAge = CONFIG.CACHE_DURATION) => {
  const item = cache.get(key);
  return item && Date.now() - item.time < maxAge ? item.data : null;
};
const setCache = (key, data) => cache.set(key, { data, time: Date.now() });

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorMessage 
          message="เกิดข้อผิดพลาดในการแสดงผล กรุณารีเฟรชหน้าใหม่" 
        />
      );
    }
    return this.props.children;
  }
}

// Optimized components with React.memo
const LoadingSpinner = React.memo(() => <Spinner />);

const ErrorMessage = React.memo(({ message }) => (
  <div className="fixed inset-0 bg-[#8d6e63]/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full border border-[#5d4037]/20">
      <div className="text-[#5d4037] mb-4 flex justify-center">
        <div className="w-12 h-12 bg-[#5d4037]/10 rounded-xl sm:rounded-2xl flex items-center justify-center">
          <Icons.Error />
        </div>
      </div>
      <p className="text-[#5d4037] text-center mb-6 text-base sm:text-lg">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="w-full bg-gradient-to-r from-[#5d4037] to-[#6d4c41] hover:from-[#4a2c20] hover:to-[#5d4037] text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] text-sm sm:text-base"
        aria-label="รีเฟรชหน้า"
      >
        รีเฟรช
      </button>
    </div>
  </div>
));

const Toast = React.memo(({ message, type, show }) => {
  if (!show) return null;

  const styles = {
    success: 'bg-green-500 text-white shadow-green-500/25',
    error: 'bg-[#5d4037] text-white shadow-[#5d4037]/25',
    info: 'bg-[#6d4c41] text-white shadow-[#6d4c41]/25'
  };

  const IconComponent = type === 'success' ? Icons.Check : 
                       type === 'error' ? Icons.Error : Icons.Spinner;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 ${styles[type]} px-4 py-3 rounded-xl sm:rounded-2xl shadow-lg flex items-center gap-2 animate-slide-in backdrop-blur-md max-w-xs`}
      role="alert"
      aria-live="polite"
    >
      <IconComponent />
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
});

// QR Code Modal component
const QrCodeModal = React.memo(({ show, onClose, value, title }) => {
  if (!show) return null;

  return (
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{title || 'QR Code'}</h2>
          <p className="text-sm text-gray-600">สแกนเพื่อใช้คูปองนี้</p>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-inner">
            <QRCode 
              value={value} 
              size={240}
              bgColor="transparent"
              fgColor="#1f2937"
              level="H"
            />
          </div>
        </div>
        
        <div className="text-center">
          <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-200">
            <p className="font-mono text-base font-semibold text-gray-800 tracking-wide">{value}</p>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scale-in {
          from { 
            opacity: 0; 
            transform: scale(0.9); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
});
// Optimized CouponItem with proper memoization
const CouponItem = React.memo(({ coupon, onShowQrCode }) => {
  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const copyCodeToClipboard = useCallback(async (code) => {
    if (!code || !navigator.clipboard) return;
    
    try {
      await navigator.clipboard.writeText(code);
      // Could add a mini toast here for copy success
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch {
        // Silently fail
      }
      document.body.removeChild(textArea);
    }
  }, []);

  const formattedDate = useMemo(() => formatDate(coupon.exp), [coupon.exp, formatDate]);

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
            {coupon.image_menu ? (
              <img
                src={coupon.image_menu}
                alt={coupon.menuname}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icons.Gift className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
              {coupon.name_cop}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5 truncate">
              {coupon.menuname}
            </p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          coupon.status
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {coupon.status ? 'ใช้งานได้' : 'หมดอายุ'}
        </div>
      </div>
      
      {coupon.code_cop && (
        <div className="p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-1">รหัสคูปอง</p>
              <div className="font-mono text-lg font-bold text-gray-900 tracking-wider">
                {coupon.code_cop}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => copyCodeToClipboard(coupon.code_cop)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 text-white text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="คัดลอกรหัสคูปอง"
              >
                <Icons.Copy />
                คัดลอก
              </button>
              <button
                onClick={() => onShowQrCode(coupon)}
                className="px-3 py-2 bg-[#6d4c41] hover:bg-[#5d4037] active:bg-[#4a2c20] active:scale-95 text-white text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#5d4037] focus:ring-offset-2"
                aria-label="แสดง QR Code"
              >
                <Icons.QrCode />
                QR Code
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">จำนวนคงเหลือ</span>
          <span className="font-semibold text-gray-900">{coupon.unit}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">วันหมดอายุ</span>
          <span className="font-semibold text-gray-900">{formattedDate}</span>
        </div>
      </div>
    </div>
  );
});

const PointLogItem = React.memo(({ log, index }) => {
  const isPositive = log.pointStatus === 'เพิ่ม';

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-[#8d6e63]/20 hover:border-[#6d4c41]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#8d6e63]/10 hover:scale-[1.01] overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 flex-shrink-0 ${
            isPositive
              ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md shadow-green-500/20'
              : 'bg-gradient-to-br from-[#6d4c41] to-[#5d4037] text-white shadow-md shadow-[#5d4037]/20'
          }`}>
            {isPositive ? <Icons.Plus /> : <Icons.Minus />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#5d4037] text-sm sm:text-base mb-2 line-clamp-2">
              {log.description || 'รายการไม่ระบุ'}
            </h3>
            <div className="flex items-center gap-2 mb-3 text-[#6d4c41] text-xs sm:text-sm">
              <Icons.Clock />
              <span className="truncate">{log.formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-1 bg-[#8d6e63]/15 text-[#5d4037] rounded-lg font-medium text-xs">
                {log.input}
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-[#6d4c41]/10 text-[#6d4c41] rounded-lg text-xs">
                {log.addedBy}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-xl sm:text-2xl font-bold transition-all duration-300 ${
              isPositive ? 'text-green-600' : 'text-[#5d4037]'
            }`}>
              {isPositive ? '+' : '-'}{log.point}
            </div>
            <div className="text-xs text-[#6d4c41] font-medium">คะแนน</div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Custom hooks for better state management
const useToast = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), CONFIG.TOAST_DURATION);
  }, []);

  return { toast, showToast };
};

const useApiCall = () => {
  const ongoingRequests = useRef(new Set());

  const makeApiCall = useCallback(async (url, options = {}) => {
    const requestKey = `${url}_${JSON.stringify(options)}`;
    if (ongoingRequests.current.has(requestKey)) return null;
    ongoingRequests.current.add(requestKey);

    try {
      const token = Cookies.get('authToken');
      if (!token) throw new Error('Token not found');

      const cacheKey = `api_${requestKey}`;
      const cached = getCached(cacheKey);
      if (cached) return cached;

      const response = await fetch(`${CONFIG.API_URL}${url}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      setCache(cacheKey, data);
      return data;
    } finally {
      ongoingRequests.current.delete(requestKey);
    }
  }, []);

  return { makeApiCall };
};

// Main component with optimizations
export default function UserMailbox() {
  // State management
  const [userInfo, setUserInfo] = useState({ 
    uid: '', 
    name: '', 
    userpoint: 0, 
    profile: null 
  });
  const [pointLogs, setPointLogs] = useState([]);
  const [logsSummary, setLogsSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [activeTab, setActiveTab] = useState('coupons');
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  // New state for QR Code modal
  const [qrModal, setQrModal] = useState({ show: false, value: '', title: '' });

  // Custom hooks
  const { toast, showToast } = useToast();
  const { makeApiCall } = useApiCall();

  // Memoized computed values
  const activeCoupons = useMemo(() => 
    coupons.filter(coupon => coupon?.status === true), 
    [coupons]
  );

  const safeName = useMemo(() => 
    DOMPurify.sanitize(userInfo.name || userInfo.profile?.displayName || ''),
    [userInfo.name, userInfo.profile?.displayName]
  );

  const user = useMemo(() => ({
    uid: userInfo.uid,
    name: safeName,
    userpoint: userInfo.userpoint,
    profile: userInfo.profile,
    pictureUrl: userInfo.profile?.pictureUrl
  }), [userInfo.uid, safeName, userInfo.userpoint, userInfo.profile]);

  // Calculate point summary from logs data
  const pointSummary = useMemo(() => {
    if (!pointLogs || pointLogs.length === 0) return null;
    
    return pointLogs.reduce((acc, log) => {
      const point = parseFloat(log.point) || 0;
      if (log.pointStatus === 'เพิ่ม' || log.pointStatus?.trim() === 'เพิ่ม') {
        acc.totalAdded += point;
        acc.addedCount += 1;
      } else if (log.pointStatus === 'ลด' || log.pointStatus?.trim() === 'ลด') {
        acc.totalDeducted += point;
        acc.deductedCount += 1;
      }
      return acc;
    }, {
      totalAdded: 0,
      totalDeducted: 0,
      addedCount: 0,
      deductedCount: 0
    });
  }, [pointLogs]);

  // Optimized API functions
  const fetchCoupons = useMemo(() => debounce(async (uid) => {
    if (!uid) return;
    
    try {
      setCouponsLoading(true);
      const result = await makeApiCall(`/coupon/${uid}`);
      
      if (result.validCoupons && typeof result.validCoupons === 'object') {
        const allCoupons = Object.values(result.validCoupons);
        const activeCoupons = allCoupons.filter(coupon => coupon?.status === true);
        setCoupons(activeCoupons);
        
        if (activeCoupons.length > 0) {
          showToast(`โหลดคูปอง ${activeCoupons.length} ใบเรียบร้อย`, 'success');
        }
      } else {
        setCoupons([]);
      }
    } catch (err) {
      if (err.message.includes('404')) {
        setCoupons([]);
      } else {
        showToast('ไม่สามารถดึงข้อมูลคูปองได้', 'error');
        setCoupons([]);
      }
    } finally {
      setCouponsLoading(false);
    }
  }, 1000), [makeApiCall, showToast]);

  const fetchPointLogs = useMemo(() => debounce(async (uid, page = 1, limit = CONFIG.PAGE_SIZE) => {
    if (!uid) return;
    
    try {
      setLogsLoading(true);
      const result = await makeApiCall(`/points/get-point-log/${uid}?page=${page}&limit=${limit}`);
      
      if (result.success && result.data) {
        setPointLogs(result.data.logs || []);
        setLogsSummary(result.summary || null);
        setPagination(result.pagination || null);
        setCurrentPage(page);
        
        if (result.message && page === 1) {
          showToast(result.message, 'success');
        }
      } else {
        setPointLogs([]);
        setLogsSummary(null);
        setPagination(null);
      }
    } catch (err) {
      if (err.message.includes('404')) {
        setPointLogs([]);
        setLogsSummary(null);
        setPagination(null);
      } else {
        showToast('ไม่สามารถดึงข้อมูลประวัติคะแนนได้', 'error');
      }
    } finally {
      setLogsLoading(false);
    }
  }, 1000), [makeApiCall, showToast]);

  const syncUserData = useMemo(() => debounce(async (profileData, isPolling = false) => {
    try {
      if (!isPolling) {
        showToast('กำลังซิงค์ข้อมูล...', 'info');
      }

      let userData;
      try {
        userData = await makeApiCall(`/users/${profileData.userId}`);
      } catch (err) {
        if (err.message.includes('404')) {
          await makeApiCall('/users', {
            method: 'POST',
            body: JSON.stringify(profileData),
          });
          userData = await makeApiCall(`/users/${profileData.userId}`);
        } else {
          throw err;
        }
      }

      setUserInfo(prev => ({ ...prev, ...userData }));
      
      await Promise.all([
        fetchPointLogs(userData.uid, currentPage),
        fetchCoupons(userData.uid)
      ]);

      if (!isPolling) showToast('ข้อมูลอัปเดตเรียบร้อย', 'success');
    } catch (err) {
      if (!isPolling) showToast('เกิดข้อผิดพลาดในการซิงค์', 'error');
    }
  }, 1000), [makeApiCall, showToast, fetchPointLogs, fetchCoupons, currentPage]);

  const refreshData = useCallback(async () => {
    if (userInfo.profile) {
      await syncUserData(userInfo.profile);
    }
  }, [userInfo.profile, syncUserData]);

  // Page navigation handlers
  const handlePreviousPage = useCallback(() => {
    if (pagination?.hasPrevPage && !logsLoading) {
      fetchPointLogs(userInfo.uid, pagination.currentPage - 1);
    }
  }, [pagination, logsLoading, fetchPointLogs, userInfo.uid]);

  const handleNextPage = useCallback(() => {
    if (pagination?.hasNextPage && !logsLoading) {
      fetchPointLogs(userInfo.uid, pagination.currentPage + 1);
    }
  }, [pagination, logsLoading, fetchPointLogs, userInfo.uid]);

  // Tab switching
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  // Handler functions for QR Modal
  const handleShowQrCode = useCallback((coupon) => {
    setQrModal({
      show: true,
      value: coupon.code_cop,
      title: coupon.name_cop,
    });
  }, []);

  const handleCloseQrCode = useCallback(() => {
    setQrModal({
      show: false,
      value: '',
      title: '',
    });
  }, []);

  // Initialize LIFF and user data
  useEffect(() => {
    let mounted = true;

    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: CONFIG.LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const idToken = liff.getIDToken();
        if (!idToken) throw new Error('ไม่สามารถดึง Token ได้');

        Cookies.set('authToken', idToken, { 
          secure: true, 
          sameSite: 'Strict', 
          expires: 1 
        });

        const profileData = await liff.getProfile();
        
        if (mounted) {
          setUserInfo(prev => ({ ...prev, profile: profileData }));
          await syncUserData(profileData);
        }
      } catch (err) {
        if (mounted) {
          setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeLiff();

    return () => {
      mounted = false;
    };
  }, [syncUserData]);

  // Polling for data updates
  useEffect(() => {
    if (!userInfo.profile) return;

    const interval = setInterval(() => {
      syncUserData(userInfo.profile, true);
    }, CONFIG.POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [userInfo.profile, syncUserData]);

  // Loading and error states
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50/30">
        <Navbar user={user} safeName={safeName} />
        <Toast {...toast} />

        <style jsx>{`
          @keyframes slide-in {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          .animate-slide-in {
            animation: slide-in 0.3s ease-out;
          }

          .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>

        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl pb-20">
          <div className="mb-6">
            <h1 className="text-xl sm:text-3xl font-bold text-[#5d4037] mb-1 sm:mb-2">กล่องจดหมาย</h1>
            <p className="text-[#6d4c41] text-sm sm:text-base">คูปองและประวัติการได้รับคะแนน</p>
          </div>

          {/* Optimized Tab Navigation */}
          <div className="flex mb-6 bg-white/50 rounded-xl p-1 border border-[#8d6e63]/20" role="tablist">
            <button
              onClick={() => handleTabChange('coupons')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5d4037]/50 ${
                activeTab === 'coupons'
                  ? 'bg-gradient-to-r from-[#5d4037] to-[#6d4c41] text-white shadow-md'
                  : 'text-[#6d4c41] hover:bg-[#8d6e63]/10'
              }`}
              role="tab"
              aria-selected={activeTab === 'coupons'}
              aria-controls="coupons-panel"
            >
              คูปองของฉัน ({activeCoupons.length})
            </button>
            <button
              onClick={() => handleTabChange('logs')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5d4037]/50 ${
                activeTab === 'logs'
                  ? 'bg-gradient-to-r from-[#5d4037] to-[#6d4c41] text-white shadow-md'
                  : 'text-[#6d4c41] hover:bg-[#8d6e63]/10'
              }`}
              role="tab"
              aria-selected={activeTab === 'logs'}
              aria-controls="logs-panel"
            >
              ประวัติคะแนน
            </button>
          </div>

          <div className="space-y-6">
            {/* Coupons Tab Panel */}
            {activeTab === 'coupons' && (
              <div id="coupons-panel" role="tabpanel" aria-labelledby="coupons-tab">
                {couponsLoading ? (
                  <LoadingState 
                    icon={<Icons.Spinner />}
                    title="กำลังโหลดคูปอง"
                    description="โปรดรอสักครู่..."
                  />
                ) : activeCoupons.length === 0 ? (
                  <EmptyState
                    icon={<Icons.Gift />}
                    title="ยังไม่มีคูปอง"
                    description="สะสมคะแนนเพื่อแลกคูปองสุดคุ้ม"
                    actionButton={
                      <RefreshButton onClick={refreshData} />
                    }
                  />
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {activeCoupons.map((coupon) => (
                      <CouponItem
                        key={`coupon-${coupon.idcoupon}`}
                        coupon={coupon}
                        onShowQrCode={handleShowQrCode}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Point Logs Tab Panel */}
            {activeTab === 'logs' && (
              <div id="logs-panel" role="tabpanel" aria-labelledby="logs-tab">
                {logsLoading && currentPage === 1 ? (
                  <LoadingState 
                    icon={<Icons.Spinner />}
                    title="กำลังโหลดประวัติ"
                    description="โปรดรอสักครู่..."
                  />
                ) : pointLogs.length === 0 ? (
                  <EmptyState
                    icon={<Icons.Mail />}
                    title="ยังไม่มีประวัติคะแนน"
                    description="เริ่มใช้งานเพื่อสะสมคะแนนและดูประวัติได้ที่นี่"
                    actionButton={
                      <RefreshButton onClick={refreshData} />
                    }
                  />
                ) : (
                  <>
                    <div className="space-y-3 sm:space-y-4">
                      {pointLogs.map((log, index) => (
                        <PointLogItem
                          key={`log-${log.id || index}-${log.createdAt || index}`}
                          log={log}
                          index={index}
                        />
                      ))}
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                      <PaginationControls
                        pagination={pagination}
                        onPrevious={handlePreviousPage}
                        onNext={handleNextPage}
                        loading={logsLoading}
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>
        <QrCodeModal
          show={qrModal.show}
          onClose={handleCloseQrCode}
          value={qrModal.value}
          title={qrModal.title}
        />
      </div>
    </ErrorBoundary>
  );
}

// Optimized reusable components
const LoadingState = React.memo(({ icon, title, description }) => (
  <div className="flex justify-center py-12 sm:py-16">
    <div className="text-center">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#8d6e63]/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <div className="text-[#5d4037] text-base sm:text-lg font-medium mb-2">{title}</div>
      <div className="text-[#6d4c41] text-sm">{description}</div>
    </div>
  </div>
));

const EmptyState = React.memo(({ icon, title, description, actionButton }) => (
  <div className="text-center py-12 sm:py-16">
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-[#8d6e63]/20 shadow-lg shadow-[#8d6e63]/10">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#8d6e63]/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
        {icon}
      </div>
      <h3 className="text-lg sm:text-2xl font-bold text-[#5d4037] mb-2 sm:mb-3">{title}</h3>
      <p className="text-[#6d4c41] mb-6 sm:mb-8 text-sm sm:text-lg">{description}</p>
      {actionButton}
    </div>
  </div>
));

const RefreshButton = React.memo(({ onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5d4037] to-[#6d4c41] hover:from-[#4a2c20] hover:to-[#5d4037] text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#5d4037]/50"
    aria-label="รีเฟรชข้อมูล"
  >
    <Icons.Refresh />
    รีเฟรชข้อมูล
  </button>
));

const PaginationControls = React.memo(({ pagination, onPrevious, onNext, loading }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-[#8d6e63]/20 p-4 sm:p-6 shadow-lg shadow-[#8d6e63]/10">
    <div className="flex items-center justify-between">
      <div className="text-[#6d4c41] text-sm">
        หน้า {pagination.currentPage} จาก {pagination.totalPages}
        <span className="text-[#8d6e63] ml-2 hidden sm:inline">
          ({pagination.totalItems} รายการ)
        </span>
      </div>
      <div className="flex gap-2">
        {pagination.hasPrevPage && (
          <button
            onClick={onPrevious}
            disabled={loading}
            className={`inline-flex items-center gap-1 sm:gap-2 px-3 py-2 bg-[#8d6e63]/10 text-[#5d4037] rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#5d4037]/50 ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#8d6e63]/20'
            }`}
            aria-label="หน้าก่อนหน้า"
          >
            <Icons.ChevronLeft />
            <span className="hidden sm:inline">ก่อนหน้า</span>
          </button>
        )}
        {pagination.hasNextPage && (
          <button
            onClick={onNext}
            disabled={loading}
            className={`inline-flex items-center gap-1 sm:gap-2 px-3 py-2 bg-gradient-to-r from-[#5d4037] to-[#6d4c41] text-white rounded-lg sm:rounded-xl transition-all duration-200 font-medium shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5d4037]/50 ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:from-[#4a2c20] hover:to-[#5d4037]'
            }`}
            aria-label="หน้าถัดไป"
          >
            <span className="hidden sm:inline">ถัดไป</span>
            <Icons.ChevronRight />
          </button>
        )}
      </div>
    </div>
  </div>
));