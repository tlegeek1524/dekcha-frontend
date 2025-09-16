import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import liff from '@line/liff';
import DOMPurify from 'dompurify';
import Cookies from 'js-cookie';
import QRCode from 'react-qr-code';
import Navbar from '../navbar';
import Spinner from '../util/LoadSpinner';

// --- React Icons Imports ---
import {
  MdError,
  MdPerson,
  MdMail,
  MdCheck,
  MdRefresh,
  MdAdd,
  MdRemove,
  MdAccessTime,
  MdChevronRight,
  MdChevronLeft,
  MdCardGiftcard,
  MdContentCopy,
  MdQrCode,
  MdReceipt,
  MdClose
} from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

// --- Icons Components using react-icons ---
const Icons = {
  Error: React.memo(() => <MdError className="w-5 h-5" aria-label="Error" />),
  User: React.memo(() => <MdPerson className="w-12 h-12" aria-label="User" />),
  Mail: React.memo(() => <MdMail className="w-5 h-5 sm:w-6 sm:h-6" aria-label="Mail" />),
  Check: React.memo(() => <MdCheck className="w-4 h-4" aria-label="Check" />),
  Refresh: React.memo(() => <MdRefresh className="w-4 h-4" aria-label="Refresh" />),
  Plus: React.memo(() => <MdAdd className="w-4 h-4" aria-label="Plus" />),
  Minus: React.memo(() => <MdRemove className="w-4 h-4" aria-label="Minus" />),
  Clock: React.memo(() => <MdAccessTime className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-label="Clock" />),
  Spinner: React.memo(() => <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" aria-label="Loading" />),
  ChevronRight: React.memo(() => <MdChevronRight className="w-4 h-4" aria-label="Next" />),
  ChevronLeft: React.memo(() => <MdChevronLeft className="w-4 h-4" aria-label="Previous" />),
  Gift: React.memo(() => <MdCardGiftcard className="w-5 h-5 sm:w-6 sm:h-6" aria-label="Gift" />),
  Copy: React.memo(() => <MdContentCopy className="w-4 h-4" aria-label="Copy" />),
  QrCode: React.memo(() => <MdQrCode className="w-4 h-4" aria-label="QR Code" />),
  Receipt: React.memo(() => <MdReceipt className="w-5 h-5" aria-label="Receipt" />),
  Close: React.memo(() => <MdClose className="w-5 h-5" aria-label="Close" />)
};

// --- Configuration & Optimized Caching ---
const CONFIG = {
  LIFF_ID: import.meta.env.VITE_LIFF_ID,
  API_URL: import.meta.env.VITE_API_URL,
  TOAST_DURATION: 2500,
  POLLING_INTERVAL: 300000, // 5 minutes
  PAGE_SIZE: 20,
  CACHE_DURATION: 45000 // 45 seconds cache for better performance
};

// Optimized cache with WeakMap for better memory management
const cache = new Map();
const requestCache = new WeakMap();

const getCached = (key, maxAge = CONFIG.CACHE_DURATION) => {
  const item = cache.get(key);
  if (!item) return null;
  const isExpired = (Date.now() - item.time) > maxAge;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  return item.data;
};

const setCache = (key, data) => {
  // Prevent cache overflow
  if (cache.size > 50) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { data, time: Date.now() });
};

const invalidateCache = (keyPrefix) => {
  const keysToDelete = [];
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
};

// --- Error Boundary & Core UI Components ---
class ErrorBoundary extends React.Component {
  constructor(props) { 
    super(props); 
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) { 
    return { hasError: true, error }; 
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorMessage message="เกิดข้อผิดพลาดในการแสดงผล กรุณารีเฟรชหน้าใหม่" />;
    }
    return this.props.children;
  }
}

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
  const IconComponent = type === 'success' ? Icons.Check : type === 'error' ? Icons.Error : Icons.Spinner;
  return (
    <div 
      className={`fixed top-4 right-4 z-[100] ${styles[type]} px-4 py-3 rounded-xl sm:rounded-2xl shadow-lg flex items-center gap-2 backdrop-blur-md max-w-xs animate-in slide-in-from-top duration-300`} 
      role="alert" 
      aria-live="polite"
    >
      <IconComponent />
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
});

// --- Optimized Lazy Loaded QR Code Modal ---
const QrCodeModal = React.lazy(() => Promise.resolve({ 
  default: React.memo(({ show, onClose, value, title }) => {
    // ... (rest of the component is unchanged)
    if (!show) return null;
    return (
        <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" 
            onClick={onClose}
        >
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full transition-all duration-300 animate-in zoom-in-95 duration-300 border border-gray-100 relative" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors duration-200"
                    aria-label="Close modal"
                >
                    <Icons.Close />
                </button>
                <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{title || 'QR Code'}</h2>
                    <p className="text-sm text-gray-600">สแกนเพื่อใช้คูปองนี้</p>
                </div>
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-inner">
                        <QRCode value={value} size={240} bgColor="transparent" fgColor="#1f2937" level="H"/>
                    </div>
                </div>
                <div className="text-center">
                    <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-200">
                        <p className="font-mono text-base font-semibold text-gray-800 tracking-wide">{value}</p>
                    </div>
                </div>
            </div>
        </div>
        );
    })
}));

// --- Receipt Detail Modal ---
const ReceiptDetailModal = ({ receipt, show, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'UTC'
    });
  };

  if (!show || !receipt) return null;
  const cashValue = (receipt.point_coupon || 0) * 4;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full transition-all duration-300 animate-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#5d4037]">รายละเอียดใบเสร็จ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icons.Close /></button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-600">เมนู:</span>
            <span className="font-semibold text-[#5d4037] text-right">{receipt.menu_name}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-600">คะแนนที่ใช้:</span>
            <span className="font-semibold text-red-600 text-right">{receipt.point_coupon} คะแนน</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-600">มูลค่า:</span>
            <span className="font-semibold text-green-600 text-right">{cashValue.toLocaleString('th-TH')} บาท</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-600">รหัสคูปอง:</span>
            <span className="font-mono text-[#6d4c41] text-right">{receipt.code_coupon}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-600">สถานะ:</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">{receipt.coupon_status}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-600">พนักงาน:</span>
            <span className="text-[#6d4c41] text-right">{receipt.name_emp} ({receipt.employee_id})</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-600">วันที่:</span>
            <span className="text-gray-800 text-right">{formatDate(receipt.create_date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Optimized Data Display Components ---
const CouponItem = React.memo(({ coupon, onShowQrCode }) => {
  // ... (component is unchanged)
    const formatDate = useCallback((dateString) => {
        if (!dateString) return 'ไม่ระบุ';
        return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
        });
    }, []);

    const copyCodeToClipboard = useCallback(async (code) => {
        if (!code || !navigator.clipboard) return false;
        try { 
        await navigator.clipboard.writeText(code);
        return true;
        } catch {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        let success = false;
        try { 
            success = document.execCommand('copy'); 
        } catch {}
        document.body.removeChild(textArea);
        return success;
        }
    }, []);

    const formattedDate = useMemo(() => formatDate(coupon.exp), [coupon.exp, formatDate]);

    const handleCopy = useCallback(async () => {
        await copyCodeToClipboard(coupon.code_cop);
    }, [copyCodeToClipboard, coupon.code_cop]);

    const handleQrCode = useCallback(() => {
        onShowQrCode(coupon);
    }, [onShowQrCode, coupon]);

    return (
        <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                {coupon.image_menu ? (
                <img 
                    src={coupon.image_menu} 
                    alt={coupon.menuname} 
                    className="w-full h-full object-cover" 
                    loading="lazy" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
                ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <Icons.Gift className="w-6 h-6 text-gray-400" />
                </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{coupon.name_cop}</h3>
                <p className="text-gray-500 text-xs mt-0.5 truncate">{coupon.menuname}</p>
            </div>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            coupon.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
            {coupon.status ? 'ใช้งานได้' : 'หมดอายุ'}
            </div>
        </div>
        
        {coupon.code_cop && (
            <div className="p-4 bg-gray-50">
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600 mb-1">รหัสคูปอง</p>
                <div className="font-mono text-lg font-bold text-gray-900 tracking-wider truncate">
                    {coupon.code_cop}
                </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                <button 
                    onClick={handleCopy}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 text-white text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <Icons.Copy /> คัดลอก
                </button>
                <button 
                    onClick={handleQrCode}
                    className="px-3 py-2 bg-[#6d4c41] hover:bg-[#5d4037] active:bg-[#4a2c20] active:scale-95 text-white text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#5d4037] focus:ring-offset-2"
                >
                    <Icons.QrCode /> QR Code
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

const PointLogItem = React.memo(({ log }) => {
  const isPositive = log.pointStatus === 'เพิ่ม';
  
  const formattedDate = useMemo(() => {
    if (!log.createdAt) return 'ไม่ระบุ';
    return new Date(log.createdAt).toLocaleString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
    });
  }, [log.createdAt]);

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
              <span className="truncate">{formattedDate}</span>
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

// --- UPDATED: ReceiptItem Component ---
const ReceiptItem = React.memo(({ receipt, onSelect }) => {
  const formattedDate = useMemo(() => {
    if (!receipt.create_date) return 'ไม่ระบุ';
    return new Date(receipt.create_date).toLocaleString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
    });
  }, [receipt.create_date]);

  // Calculate cash value: 1 point = 4 Baht
  const cashValue = (receipt.point_coupon || 0) * 4;

  return (
    <button 
      onClick={() => onSelect(receipt)}
      className="w-full text-left group bg-white/80 backdrop-blur-sm rounded-2xl border border-[#8d6e63]/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.01] overflow-hidden"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 flex-shrink-0 bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md shadow-blue-500/20">
            <Icons.Receipt />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-blue-800 text-sm sm:text-base mb-2 line-clamp-2">
              รายการใบเสร็จ: เมนู {receipt.menu_name}
            </h3>
            <div className="flex items-center gap-2 mb-3 text-gray-600 text-xs sm:text-sm">
              <Icons.Clock />
              <span className="truncate">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium text-xs">
                {receipt.point_coupon} คะแนน
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl sm:text-2xl font-bold transition-all duration-300 text-blue-500">
              {receipt.unit}
            </div>
            <div className="text-xs text-gray-600 font-medium">จำนวน</div>
          </div>
        </div>
      </div>
    </button>
  );
});

// --- Optimized Custom Hooks ---
const useToast = () => {
  // ... (hook is unchanged)
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const timeoutRef = useRef(null);

    const showToast = useCallback((message, type = 'info') => {
        if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        }
        setToast({ show: true, message, type });
        timeoutRef.current = setTimeout(() => {
        setToast(t => ({ ...t, show: false }));
        }, CONFIG.TOAST_DURATION);
    }, []);

    useEffect(() => {
        return () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        };
    }, []);

    return { toast, showToast };
};

const useApiCall = () => {
  // ... (hook is unchanged)
    const ongoingRequests = useRef(new Set());
  
    const makeApiCall = useCallback(async (url, options = {}, force = false) => {
        const requestKey = `${options.method || 'GET'}_${url}`;
        
        if (ongoingRequests.current.has(requestKey) && !force) {
        return null;
        }

        try {
        ongoingRequests.current.add(requestKey);
        const token = Cookies.get('authToken');
        if (!token) throw new Error('Token not found');
        
        const cacheKey = `api_${requestKey}`;
        if (!force) {
            const cached = getCached(cacheKey);
            if (cached) return cached;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${CONFIG.API_URL}${url}`, { 
            ...options, 
            headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json', 
            ...options.headers 
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }
        
        const data = await response.json();
        setCache(cacheKey, data);
        return data;
        } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
        } finally {
        ongoingRequests.current.delete(requestKey);
        }
    }, []);

    return { makeApiCall };
};

// --- Main Component: UserMailbox ---
export default function UserMailbox() {
  const [userInfo, setUserInfo] = useState({ uid: '', name: '', userpoint: 0, profile: null });
  const [pointLogs, setPointLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [receipts, setReceipts] = useState([]); // <-- NEW STATE for receipts
  const [activeTab, setActiveTab] = useState('coupons');
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [receiptsLoading, setReceiptsLoading] = useState(false); // <-- NEW STATE for receipts loading
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [qrModal, setQrModal] = useState({ show: false, value: '', title: '' });
  const [selectedReceipt, setSelectedReceipt] = useState(null); // <-- NEW STATE for modal

  const { toast, showToast } = useToast();
  const { makeApiCall } = useApiCall();

  const activeCoupons = useMemo(() => coupons.filter(coupon => coupon?.status === true), [coupons]);
  const safeName = useMemo(() => DOMPurify.sanitize(userInfo.name || userInfo.profile?.displayName || ''), [userInfo.name, userInfo.profile?.displayName]);
  const user = useMemo(() => ({ uid: userInfo.uid, name: safeName, userpoint: userInfo.userpoint, profile: userInfo.profile, pictureUrl: userInfo.profile?.pictureUrl }), [userInfo.uid, safeName, userInfo.userpoint, userInfo.profile]);

  const fetchCoupons = useCallback(async (uid, force = false) => {
    // ... (function is unchanged)
    if (!uid) return;
    try {
        setCouponsLoading(true);
        if (force) invalidateCache('api_GET_/coupon/');
        
        const result = await makeApiCall(`/coupon/${uid}`, {}, force);
        if (result?.validCoupons && typeof result.validCoupons === 'object') {
            const validCouponsArray = Object.values(result.validCoupons).filter(c => c?.status === true);
            setCoupons(validCouponsArray);
        } else { 
            setCoupons([]); 
        }
    } catch (err) {
        setCoupons([]);
        if (!err.message.includes('404')) {
            showToast('ไม่สามารถดึงข้อมูลคูปองได้', 'error');
        }
    } finally {
        setCouponsLoading(false);
    }
  }, [makeApiCall, showToast]);

  const fetchPointLogs = useCallback(async (uid, page = 1, limit = CONFIG.PAGE_SIZE) => {
    // ... (function is unchanged, but UTC format is confirmed)
    if (!uid) return;
    try {
        setLogsLoading(true);
        const result = await makeApiCall(`/points/get-point-log/${uid}?page=${page}&limit=${limit}`);
        
        if (result.success && result.data?.logs) {
            setPointLogs(result.data.logs);
            setPagination(result.pagination || null);
            setCurrentPage(page);
        } else {
            setPointLogs([]);
            setPagination(null);
        }
    } catch (err) {
        setPointLogs([]);
        setPagination(null);
        if (!err.message.includes('404')) {
            showToast('ไม่สามารถดึงข้อมูลประวัติคะแนนได้', 'error');
        }
    } finally {
        setLogsLoading(false);
    }
  }, [makeApiCall, showToast]);
  
  // --- NEW: fetchReceipts function ---
  const fetchReceipts = useCallback(async (uid) => {
    if (!uid) return;
    try {
      setReceiptsLoading(true);
      const result = await makeApiCall(`/coupon/receipt/${uid}`);
      if (result.success && Array.isArray(result.data)) {
        setReceipts(result.data);
      } else {
        setReceipts([]);
      }
    } catch (err) {
      setReceipts([]);
      if (!err.message.includes('404')) {
        showToast('ไม่สามารถดึงข้อมูลใบเสร็จได้', 'error');
      }
    } finally {
      setReceiptsLoading(false);
    }
  }, [makeApiCall, showToast]);

  const syncUserData = useCallback(async (profileData, isPolling = false) => {
    try {
      const userData = await makeApiCall(`/users/${profileData.userId}`);
      setUserInfo(prev => ({ ...prev, ...userData }));
      
      // Fetch data concurrently, including receipts
      await Promise.all([ 
        fetchPointLogs(userData.uid, 1), 
        fetchCoupons(userData.uid),
        fetchReceipts(userData.uid) // <-- MODIFIED: Fetch receipts
      ]);
      
      if (!isPolling) showToast('ข้อมูลอัปเดตเรียบร้อย', 'success');
    } catch (err) {
      if (err.message.includes('404')) {
        try {
          await makeApiCall('/users', { method: 'POST', body: JSON.stringify(profileData) });
          await syncUserData(profileData, isPolling);
        } catch (createErr) {
          if (!isPolling) showToast('เกิดข้อผิดพลาดในการสร้างผู้ใช้', 'error');
        }
      } else {
        if (!isPolling) showToast('เกิดข้อผิดพลาดในการซิงค์', 'error');
      }
    }
  }, [makeApiCall, showToast, fetchPointLogs, fetchCoupons, fetchReceipts]);

  const refreshData = useCallback(async () => {
    if (userInfo.profile) {
      showToast('กำลังรีเฟรชข้อมูล...', 'info');
      invalidateCache('api_');
      await syncUserData(userInfo.profile);
    }
  }, [userInfo.profile, syncUserData, showToast]);

  const handlePageChange = useCallback((newPage) => { 
    if (!logsLoading && newPage !== currentPage) fetchPointLogs(userInfo.uid, newPage); 
  }, [logsLoading, fetchPointLogs, userInfo.uid, currentPage]);
  
  const handleShowQrCode = useCallback((coupon) => setQrModal({ show: true, value: coupon.code_cop, title: coupon.name_cop }), []);
  
  const handleCloseQrCode = useCallback(() => {
    setQrModal({ show: false, value: '', title: '' });
    if (userInfo.uid) {
      showToast('กำลังอัปเดตรายการคูปอง...', 'info');
      fetchCoupons(userInfo.uid, true);
    }
  }, [userInfo.uid, fetchCoupons, showToast]);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: CONFIG.LIFF_ID });
        if (!liff.isLoggedIn()) { liff.login(); return; }
        const idToken = liff.getIDToken();
        if (!idToken) throw new Error('ไม่สามารถดึง Token ได้');
        Cookies.set('authToken', idToken, { secure: true, sameSite: 'Strict', expires: 1 });
        const profileData = await liff.getProfile();
        setUserInfo(prev => ({ ...prev, profile: profileData }));
        await syncUserData(profileData);
      } catch (err) {
        console.error('LIFF initialization error:', err);
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    initializeLiff();
  }, [syncUserData]);

  useEffect(() => {
    if (!userInfo.profile) return;
    const interval = setInterval(() => syncUserData(userInfo.profile, true), CONFIG.POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [userInfo.profile, syncUserData]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === 'logs' && userInfo.uid && !logsLoading && !receiptsLoading) {
      // Fetch both if they haven't been fetched yet
      if (pointLogs.length === 0) fetchPointLogs(userInfo.uid, 1);
      if (receipts.length === 0) fetchReceipts(userInfo.uid);
    }
  }, [userInfo.uid, logsLoading, receiptsLoading, pointLogs.length, receipts.length, fetchPointLogs, fetchReceipts]);

  // --- UPDATED: Combine and sort logs and receipts ---
  const combinedHistory = useMemo(() => {
    const mappedLogs = pointLogs.map(log => ({
      type: 'log',
      date: new Date(log.createdAt || 0),
      id: `log-${log.id || Math.random()}`,
      data: log
    }));
    const mappedReceipts = receipts.map(receipt => ({
      type: 'receipt',
      date: new Date(receipt.create_date || 0),
      id: `receipt-${receipt.id}`,
      data: receipt
    }));
    // Sort by date descending (most recent first)
    return [...mappedLogs, ...mappedReceipts].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [pointLogs, receipts]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50/30 font-['Kanit',_sans-serif]">
        <Navbar user={user} safeName={safeName} />
        <Toast {...toast} />
        
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl pb-20">
          <div className="mb-6">
            <h1 className="text-xl sm:text-3xl font-bold text-[#5d4037] mb-1 sm:mb-2">กล่องจดหมาย</h1>
            <p className="text-[#6d4c41] text-sm sm:text-base">คูปองและประวัติการได้รับคะแนน</p>
          </div>
          
          <div className="flex mb-6 bg-white/50 rounded-xl p-1 border border-[#8d6e63]/20" role="tablist">
            {[
              { key: 'coupons', label: `คูปองของฉัน (${activeCoupons.length})` },
              { key: 'logs', label: 'ประวัติคะแนน' }
            ].map(tab => (
              <button 
                key={tab.key} 
                onClick={() => handleTabChange(tab.key)} 
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5d4037]/50 ${activeTab === tab.key ? 'bg-gradient-to-r from-[#5d4037] to-[#6d4c41] text-white shadow-md' : 'text-[#6d4c41] hover:bg-[#8d6e63]/10'}`} 
                role="tab" 
                aria-selected={activeTab === tab.key}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="space-y-6">
            {activeTab === 'coupons' && (
              <div>
                {couponsLoading && coupons.length === 0 ? (
                  <LoadingState icon={<Icons.Spinner />} title="กำลังโหลดคูปอง" description="โปรดรอสักครู่..." />
                ) : activeCoupons.length === 0 ? (
                  <EmptyState icon={<Icons.Gift />} title="ยังไม่มีคูปอง" description="สะสมคะแนนเพื่อแลกคูปองสุดคุ้ม" actionButton={<RefreshButton onClick={refreshData} />} />
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {activeCoupons.map(coupon => (
                      <CouponItem key={`coupon-${coupon.idcoupon}-${coupon.code_cop}`} coupon={coupon} onShowQrCode={handleShowQrCode} />
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'logs' && (
              <div>
                {(logsLoading || receiptsLoading) && combinedHistory.length === 0 ? (
                  <LoadingState icon={<Icons.Spinner />} title="กำลังโหลดประวัติ" description="โปรดรอสักครู่..." />
                ) : combinedHistory.length === 0 ? (
                  <EmptyState icon={<Icons.Mail />} title="ยังไม่มีประวัติ" description="เริ่มใช้งานเพื่อสะสมคะแนนและดูประวัติได้ที่นี่" actionButton={<RefreshButton onClick={refreshData} />} />
                ) : (
                  <>
                    <div className="space-y-3 sm:space-y-4">
                      {combinedHistory.map((item) => (
                        item.type === 'log' 
                          ? <PointLogItem key={item.id} log={item.data} />
                          : <ReceiptItem key={item.id} receipt={item.data} onSelect={setSelectedReceipt} />
                      ))}
                    </div>
                    {pagination && pagination.totalPages > 1 && (
                      <PaginationControls pagination={pagination} onPageChange={handlePageChange} loading={logsLoading} />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>
        
        <Suspense fallback={<div className="fixed inset-0 bg-black/20 z-[99] flex items-center justify-center"><Icons.Spinner /></div>}>
          <QrCodeModal show={qrModal.show} onClose={handleCloseQrCode} value={qrModal.value} title={qrModal.title} />
        </Suspense>

        <ReceiptDetailModal receipt={selectedReceipt} show={!!selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      </div>
    </ErrorBoundary>
  );
}

// --- Reusable UI Components ---
const LoadingState = React.memo(({ icon, title, description }) => (
    // ... (component is unchanged)
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
    // ... (component is unchanged)
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
    // ... (component is unchanged)
    <button 
        onClick={onClick} 
        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5d4037] to-[#6d4c41] hover:from-[#4a2c20] hover:to-[#5d4037] text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#5d4037]/50"
    >
        <Icons.Refresh /> รีเฟรชข้อมูล
    </button>
));

const PaginationControls = React.memo(({ pagination, onPageChange, loading }) => {
    // ... (component is unchanged)
    const { currentPage, totalPages, hasPrevPage, hasNextPage, totalItems } = pagination;
  
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-[#8d6e63]/20 p-4 sm:p-6 shadow-lg shadow-[#8d6e63]/10">
        <div className="flex items-center justify-between">
            <div className="text-[#6d4c41] text-sm">
            หน้า {currentPage} จาก {totalPages}
            <span className="text-[#8d6e63] ml-2 hidden sm:inline">({totalItems} รายการ)</span>
            </div>
            <div className="flex gap-2">
            {hasPrevPage && (
                <button 
                onClick={() => onPageChange(currentPage - 1)} 
                disabled={loading} 
                className={`inline-flex items-center gap-1 sm:gap-2 px-3 py-2 bg-[#8d6e63]/10 text-[#5d4037] rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#5d4037]/50 ${
                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#8d6e63]/20'
                }`}
                >
                <Icons.ChevronLeft />
                <span className="hidden sm:inline">ก่อนหน้า</span>
                </button>
            )}
            {hasNextPage && (
                <button 
                onClick={() => onPageChange(currentPage + 1)} 
                disabled={loading} 
                className={`inline-flex items-center gap-1 sm:gap-2 px-3 py-2 bg-gradient-to-r from-[#5d4037] to-[#6d4c41] text-white rounded-lg sm:rounded-xl transition-all duration-200 font-medium shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-[#5d4037]/50 ${
                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:from-[#4a2c20] hover:to-[#5d4037]'
                }`}
                >
                <span className="hidden sm:inline">ถัดไป</span>
                <Icons.ChevronRight />
                </button>
            )}
            </div>
        </div>
        </div>
    );
});