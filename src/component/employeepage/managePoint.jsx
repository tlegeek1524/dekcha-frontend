import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from "js-cookie";
import Toast from '../util/Toast';
import { ChevronRight, Heart, Tag, QrCode } from 'lucide-react';

const QuickActions = React.lazy(() => import('../quickaction'));

// ------------------- Constants -------------------
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL,
  ENDPOINTS: {
    VERIFY_TOKEN: '/auth/verify-token',
    ADD_POINTS: '/points/add',
    USE_COUPON: '/coupon/usedcoupon'
  }
};

const TOAST_DURATION = 4000;
const REQUIRED_COOKIES = {
  AUTH_TOKEN: 'AuthToken',
  PIN_TOKEN: 'pinToken'
};
const COOKIE_NAMES = Object.values(REQUIRED_COOKIES);

// ------------------- Utilities -------------------
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop().split(';').shift() : null;
};

const clearCookies = () => {
  COOKIE_NAMES.forEach(name => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  });
};

const hasRequiredCookies = () => {
  const authToken = getCookie(REQUIRED_COOKIES.AUTH_TOKEN);
  const pinToken = getCookie(REQUIRED_COOKIES.PIN_TOKEN);
  return !!(authToken && pinToken);
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^[0-9]{9,10}$/.test(phone.replace(/[-\s]/g, ''));

// ------------------- API Helper -------------------
const createApiClient = (navigate) => {
  const apiCall = async (endpoint, options = {}) => {
    const token = getCookie(REQUIRED_COOKIES.AUTH_TOKEN);
    if (!token) {
      throw new Error('ไม่พบ Token การเข้าสู่ระบบ');
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (response.status === 401) {
      clearCookies();
      navigate('/auth/login');
      throw new Error('หมดเวลาการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
    }

    return data;
  };

  return {
    verifyToken: () => apiCall(API_CONFIG.ENDPOINTS.VERIFY_TOKEN),
    addPoints: (payload) => apiCall(API_CONFIG.ENDPOINTS.ADD_POINTS, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    useCoupon: (payload) => apiCall(API_CONFIG.ENDPOINTS.USE_COUPON, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  };
};

// ------------------- Custom Hooks -------------------
const useAuth = (navigate) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiClient = useMemo(() => createApiClient(navigate), [navigate]);

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      try {
        if (!hasRequiredCookies()) {
          if (isMounted) {
            setError('ไม่พบข้อมูลการเข้าสู่ระบบ (AuthToken หรือ pinToken)');
            clearCookies();
            navigate('/auth/login');
          }
          return;
        }

        const data = await apiClient.verifyToken();
        
        if (isMounted) {
          if (data && (data.user || data.status === 'OK')) {
            setCurrentUser(data.user || data);
            setError(null);
          } else {
            setError('ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง');
            clearCookies();
            navigate('/auth/login');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          if (err.message.includes('401') || err.message.includes('หมดเวลา') || err.message.includes('Unauthorized')) {
            clearCookies();
            navigate('/auth/login');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate, apiClient]);

  return { currentUser, loading, error };
};

const useToast = () => {
  const [toast, setToast] = useState({
    isVisible: false,
    type: 'success',
    message: ''
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({
      isVisible: true,
      type,
      message
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return { toast, showToast, hideToast };
};

const useForm = (initialState, validationRules = {}) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateField = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {};
    
    Object.entries(validationRules).forEach(([field, rules]) => {
      const value = formData[field];
      
      if (rules.required && (!value || !value.toString().trim())) {
        newErrors[field] = rules.required;
      } else if (rules.custom && value) {
        const customError = rules.custom(value);
        if (customError) {
          newErrors[field] = customError;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validationRules]);

  const reset = useCallback(() => {
    setFormData(initialState);
    setErrors({});
    setLoading(false);
  }, [initialState]);

  return {
    formData,
    errors,
    loading,
    setLoading,
    updateField,
    validate,
    reset
  };
};

// ------------------- Validation Rules -------------------
const pointsValidationRules = {
  customer_info: {
    required: 'กรุณากรอกข้อมูลลูกค้า (รหัสลูกค้า, เบอร์โทร, หรือชื่อ)',
    custom: (value) => {
      const trimmed = value.trim();
      if (trimmed.length < 3) {
        return 'ข้อมูลลูกค้าต้องมีความยาวอย่างน้อย 3 ตัวอักษร';
      }
      return null;
    }
  },
  userpoint: {
    required: 'กรุณากรอกจำนวนเงิน',
    custom: (value) => {
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        return 'กรุณากรอกจำนวนเงินที่ถูกต้อง (มากกว่า 0)';
      }
      if (num > 999999) {
        return 'จำนวนเงินไม่ควรเกิน 999,999 บาท';
      }
      return null;
    }
  }
};

const couponValidationRules = {
  coupon_code: {
    required: 'กรุณากรอกรหัสคูปอง',
    custom: (value) => {
      const trimmed = value.trim();
      if (trimmed.length < 3) {
        return 'รหัสคูปองต้องมีความยาวอย่างน้อย 3 ตัวอักษร';
      }
      if (!/^[A-Z0-9-_]+$/.test(trimmed.toUpperCase())) {
        return 'รหัสคูปองสามารถประกอบด้วย A-Z, 0-9, - และ _ เท่านั้น';
      }
      return null;
    }
  }
};

// ------------------- Components -------------------
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
    <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 font-medium text-lg">กำลังตรวจสอบสิทธิ์...</p>
    </div>
  </div>
);

const UserHeader = React.memo(({ user }) => (
  <div className="text-right">
    <p className="text-sm font-medium text-gray-900">
      {user.firstname} {user.lastname}
    </p>
    <p className="text-xs text-gray-500">
      {user.empid} • {user.role}
    </p>
  </div>
));

const ModeToggle = React.memo(({ currentMode, onModeChange }) => (
  <div className="flex justify-center mb-6">
    <div className="flex bg-white p-1 rounded-full shadow-lg border border-gray-200">
      <button
        onClick={() => onModeChange('points')}
        className={`flex-1 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full font-medium transition-all duration-300 transform ${
          currentMode === 'points' 
            ? 'bg-indigo-600 text-white shadow-md' 
            : 'text-gray-600 hover:text-indigo-600'
        } flex items-center justify-center space-x-2`}
        type="button"
      >
        <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="hidden sm:block">เพิ่มแต้มสะสม</span>
      </button>
      <button
        onClick={() => onModeChange('coupon')}
        className={`flex-1 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full font-medium transition-all duration-300 transform ${
          currentMode === 'coupon' 
            ? 'bg-teal-600 text-white shadow-md' 
            : 'text-gray-600 hover:text-teal-600'
        } flex items-center justify-center space-x-2`}
        type="button"
      >
        <Tag className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="hidden sm:block">กรอกคูปอง</span>
      </button>
    </div>
  </div>
));

const FormInput = React.memo(({ 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder, 
  error, 
  className = '', 
  ...props 
}) => (
  <div className="mb-4">
    <input
      type={type}
      name={name}
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 ${
        error 
          ? 'border-red-500 focus:ring-red-200' 
          : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
      } ${className}`}
      placeholder={placeholder}
      {...props}
    />
    {error && (
      <p className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded border-l-4 border-red-400">
        {error}
      </p>
    )}
  </div>
));

// ------------------- QR Scanner Modal -------------------
const QRScannerModal = ({ open, onClose, onScan }) => {
  const videoRef = React.useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let stream;
    if (open && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch(err => setError('ไม่สามารถเข้าถึงกล้องได้: ' + err.message));
    }
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [open]);

  // BarcodeDetector (Chrome/Edge/Android)
  useEffect(() => {
    let interval;
    if (open && window.BarcodeDetector && videoRef.current) {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      interval = setInterval(async () => {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            onScan(barcodes[0].rawValue);
            onClose();
          }
        } catch (e) {}
      }, 500);
    }
    return () => clearInterval(interval);
  }, [open, onScan, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-4 relative w-full max-w-xs">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>✕</button>
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
          <QrCode className="w-5 h-5" /> สแกน QR คูปอง
        </h2>
        {error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <video ref={videoRef} className="w-full rounded bg-black" autoPlay playsInline />
        )}
        <p className="text-xs text-gray-500 mt-2">กรุณาอนุญาตการเข้าถึงกล้อง</p>
      </div>
    </div>
  );
};

// ------------------- Main Component -------------------
const ManagePoint = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth(navigate);
  const { toast, showToast, hideToast } = useToast();
  const [currentMode, setCurrentMode] = useState('points');
  const [qrOpen, setQROpen] = useState(false);

  const apiClient = useMemo(() => createApiClient(navigate), [navigate]);

  // Points form
  const pointsForm = useForm(
    { customer_info: '', userpoint: '' },
    pointsValidationRules
  );

  // Coupon form
  const couponForm = useForm(
    { coupon_code: '' },
    couponValidationRules
  );

  const handleLogout = useCallback(() => {
    clearCookies();
    navigate('/auth/login');
  }, [navigate]);

  const handleModeChange = useCallback((mode) => {
    setCurrentMode(mode);
    pointsForm.reset();
    couponForm.reset();
  }, [pointsForm, couponForm]);

  // เมื่อสแกน QR แล้วเติมค่าในช่อง coupon_code (คูปอง)
  const handleQRScan = useCallback((value) => {
    if (!isValidCouponQR(value)) {
      showToast('QR ไม่ถูกต้อง: ต้องเป็นรหัสคูปอง 6 ตัว', 'error');
      return;
    }
    couponForm.updateField('coupon_code', value.toUpperCase());
    showToast('สแกนคูปองสำเร็จ', 'success');
  }, [couponForm, showToast]);

  // เมื่อสแกน QR แล้วเติมค่าในช่อง customer_info (ลูกค้า)
  const handleQRScanPoints = useCallback((value) => {
    if (!isValidCustomerQR(value)) {
      showToast('QR ไม่ถูกต้อง: ต้องเป็นรหัสลูกค้า 4 ตัว', 'error');
      return;
    }
    pointsForm.updateField('customer_info', value);
    showToast('สแกนข้อมูลลูกค้าสำเร็จ', 'success');
  }, [pointsForm, showToast]);

  // ------------------- Actions -------------------
  const handleAddPoints = useCallback(async () => {
    if (pointsForm.loading || !pointsForm.validate()) return;

    pointsForm.setLoading(true);
    
    try {
      const payload = {
        customer_info: pointsForm.formData.customer_info.trim(),
        userpoint: parseInt(pointsForm.formData.userpoint)
      };

      await apiClient.addPoints(payload);
      
      showToast(
        `เพิ่มแต้มให้กับ ${payload.customer_info} (${payload.userpoint.toLocaleString()} บาท) เรียบร้อยแล้ว`,
        'success'
      );
      pointsForm.reset();
    } catch (err) {
      showToast(`ไม่สามารถเพิ่มแต้มได้: ${err.message}`, 'error');
    } finally {
      pointsForm.setLoading(false);
    }
  }, [pointsForm, apiClient, showToast]);

  const handleAddCoupon = useCallback(async () => {
    if (couponForm.loading || !couponForm.validate()) return;

    couponForm.setLoading(true);
    
    try {
      const code = couponForm.formData.coupon_code.trim().toUpperCase();
      await apiClient.useCoupon({ coupon_code: code });
      
      showToast(`ใช้คูปอง ${code} เรียบร้อยแล้ว`, 'success');
      couponForm.reset();
    } catch (err) {
      showToast(`ไม่สามารถใช้คูปองได้: ${err.message}`, 'error');
    } finally {
      couponForm.setLoading(false);
    }
  }, [couponForm, apiClient, showToast]);

  // ------------------- Rendering -------------------
  if (loading) return <LoadingSpinner />;
  if (!currentUser) return null;

  const currentTitle = currentMode === 'points' ? 'จัดการแต้มสะสม' : 'จัดการคูปอง';
  const currentSubtitle = currentMode === 'points' 
    ? 'เพิ่มแต้มสะสมจากการซื้อของลูกค้า' 
    : 'กรอกรหัสคูปองให้กับลูกค้า';
  
  const formAction = currentMode === 'points' ? handleAddPoints : handleAddCoupon;
  const currentForm = currentMode === 'points' ? pointsForm : couponForm;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Toast */}
      <Toast
        isVisible={toast.isVisible}
        type={toast.type}
        message={toast.message}
        onClose={hideToast}
        duration={TOAST_DURATION}
        position="top-right"
      />
      
      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {currentTitle}
              </h1>
              <p className="text-sm text-gray-500">
                {currentSubtitle}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <UserHeader user={currentUser} />
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {(currentUser.firstname || currentUser.name).charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="flex-1 w-full overflow-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Suspense fallback={
            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          }>
            <QuickActions />
          </Suspense>
          
          {/* Main Form Card */}
          <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-8 border border-white/80 transition-all duration-200">
            <ModeToggle currentMode={currentMode} onModeChange={handleModeChange} />

            <div className="max-w-md mx-auto">
              {/* ปุ่มสแกน QR ทั้งสองโหมด */}
              {currentMode === 'coupon' && (
                <button
                  type="button"
                  onClick={() => setQROpen('coupon')}
                  className="mb-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
                >
                  <QrCode className="w-5 h-5" /> ขออนุญาตเปิดกล้องสแกน QR คูปอง
                </button>
              )}
              {currentMode === 'points' && (
                <button
                  type="button"
                  onClick={() => setQROpen('points')}
                  className="mb-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
                >
                  <QrCode className="w-5 h-5" /> ขออนุญาตเปิดกล้องสแกน QR ลูกค้า
                </button>
              )}

              {/* Conditional Form Rendering */}
              {currentMode === 'points' && (
                <>
                  <FormInput
                    name="customer_info"
                    value={pointsForm.formData.customer_info}
                    onChange={pointsForm.updateField}
                    placeholder="รหัสลูกค้า, เบอร์โทร, หรือชื่อลูกค้า"
                    error={pointsForm.errors.customer_info}
                    maxLength={50}
                  />
                  <FormInput
                    type="number"
                    name="userpoint"
                    value={pointsForm.formData.userpoint}
                    onChange={pointsForm.updateField}
                    placeholder="จำนวนเงินรวมของลูกค้า (บาท)"
                    error={pointsForm.errors.userpoint}
                    min="1"
                    max="999999"
                  />
                </>
              )}

              {currentMode === 'coupon' && (
                <FormInput
                  name="coupon_code"
                  value={couponForm.formData.coupon_code}
                  onChange={(name, value) => couponForm.updateField(name, value.toUpperCase())}
                  placeholder="กรอกรหัสคูปอง (เช่น SUMMER2024)"
                  error={couponForm.errors.coupon_code}
                  className="uppercase"
                  maxLength={20}
                />
              )}

              <button
                type="button"
                onClick={formAction}
                disabled={currentForm.loading}
                className={`w-full mt-4 px-6 py-3 text-white rounded-lg font-medium transition-all duration-200 transform ${
                  currentForm.loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : currentMode === 'points'
                    ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:scale-105 active:scale-95'
                    : 'bg-teal-600 hover:bg-teal-700 hover:shadow-lg hover:scale-105 active:scale-95'
                }`}
              >
                {currentForm.loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {currentMode === 'points' ? 'กำลังเพิ่มแต้ม...' : 'กำลังใช้คูปอง...'}
                  </span>
                ) : (
                  currentMode === 'points' ? '🎯 เพิ่มแต้มสะสม' : '🎫 ใช้คูปอง'
                )}
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <div className="flex">
              <div className="flex-shrink-0 mt-1">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  คำแนะนำการใช้งาน
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  {currentMode === 'points' ? (
                    <ul className="list-disc list-inside space-y-1">
                      <li>กรอกรหัสลูกค้า เบอร์โทรศัพท์ หรือชื่อลูกค้า</li>
                      <li>กรอกจำนวนเงินรวมที่ลูกค้าซื้อ (จะคำนวณแต้มตามอัตรา)</li>
                      <li>ตรวจสอบข้อมูลก่อนกดเพิ่มแต้ม</li>
                    </ul>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      <li>กรอกรหัสคูปองที่ถูกต้อง</li>
                      <li>รหัสคูปองประกอบด้วย A-Z, 0-9, - และ _ เท่านั้น</li>
                      <li>ระบบจะตรวจสอบความถูกต้องและสถานะของคูปอง</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* QR Scanner Modal */}
      <QRScannerModal
        open={!!qrOpen}
        onClose={() => setQROpen(false)}
        onScan={qrOpen === 'coupon' ? handleQRScan : handleQRScanPoints}
      />
    </div>
  );
};

export default ManagePoint;