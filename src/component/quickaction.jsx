import React, { useState, useEffect, useCallback, useRef } from 'react';

// เพิ่ม Google Fonts - Kanit
const FontLoader = () => {
    useEffect(() => {
        if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Kanit"]')) {
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@200;300;400;500;600;700;800&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        document.body.style.fontFamily = '"Kanit", sans-serif';

        return () => {
            document.body.style.fontFamily = '';
        };
    }, []);

    return null;
};

// Constants
const PIN_LENGTH = 4;
const PIN_TOKEN_EXPIRY_HOURS = 12;
const API_TIMEOUT = 10000;

// Cookie Management
const CookieManager = {
    set: (name, value, hours) => {
        const date = new Date();
        date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;secure;samesite=strict`;
    },

    get: (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        return parts.length === 2 ? parts.pop().split(';').shift() : null;
    },

    remove: (name) => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;secure;samesite=strict`;
    }
};

// API Service
const ApiService = {
    timeout: (ms) => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), ms)
    ),

    async makeRequest(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        try {
            const response = await Promise.race([
                fetch(url, { ...options, signal: controller.signal }),
                this.timeout(API_TIMEOUT)
            ]);

            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    },

    async verifyToken() {
        const token = localStorage.getItem('AuthToken') || sessionStorage.getItem('AuthToken');

        if (!token) {
            throw new Error('ไม่พบ token การยืนยันตัวตน');
        }

        const response = await this.makeRequest(`${import.meta.env.VITE_API_URL}/auth/verify-token`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('TOKEN_EXPIRED');
            }
            throw new Error(`ไม่สามารถตรวจสอบ token ได้: ${response.status}`);
        }

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            return data.user || data.data || data;
        } catch (error) {
            throw new Error('ข้อมูลจาก API ไม่ถูกต้อง');
        }
    }
};

// Toast Notification Component
const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className={`
        flex items-center p-4 rounded-lg shadow-lg max-w-sm
        ${type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                    type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                        'bg-blue-100 text-blue-800 border border-blue-200'}
      `} style={{ fontFamily: '"Kanit", sans-serif' }}>
                <div className="flex items-center">
                    {type === 'success' && (
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    )}
                    {type === 'error' && (
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    )}
                    <span className="text-sm font-medium">{message}</span>
                </div>
                <button
                    onClick={onClose}
                    className="ml-4 text-gray-400 hover:text-gray-600"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

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
      `}</style>
        </div>
    );
};

// Enhanced PIN Modal Component
const PinModal = ({ isOpen, onClose, onVerify, title }) => {
    const [pin, setPin] = useState(Array(PIN_LENGTH).fill(''));
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [attemptCount, setAttemptCount] = useState(0);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (isOpen) {
            setPin(Array(PIN_LENGTH).fill(''));
            setError('');
            setShake(false);
            setSuccess(false);
            setIsLoading(false);
            setUserInfo(null);
            setAttemptCount(0);

            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [isOpen]);

    const triggerShake = useCallback(() => {
        setShake(true);
        setTimeout(() => setShake(false), 600);
    }, []);

    const handlePinChange = useCallback((index, value) => {
        const numericValue = value.replace(/[^\d]/g, '').slice(0, 1);

        const newPin = [...pin];
        newPin[index] = numericValue;
        setPin(newPin);

        if (error) setError('');

        if (numericValue && index < PIN_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newPin.every(digit => digit !== '') && !isLoading) {
            setTimeout(() => {
                handleVerifyPin(newPin.join(''));
            }, 100);
        }
    }, [pin, error, isLoading]);

    const handleKeyDown = useCallback((index, e) => {
        if (e.key === 'Backspace') {
            if (!pin[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
            } else {
                const newPin = [...pin];
                newPin[index] = '';
                setPin(newPin);
            }
        }
    }, [pin]);

    const handlePaste = useCallback((e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text')
            .replace(/[^\d]/g, '')
            .slice(0, PIN_LENGTH);

        const newPin = Array(PIN_LENGTH).fill('');
        for (let i = 0; i < pastedData.length; i++) {
            newPin[i] = pastedData[i];
        }

        setPin(newPin);

        if (pastedData.length === PIN_LENGTH) {
            setTimeout(() => {
                handleVerifyPin(newPin.join(''));
            }, 100);
        }
    }, []);

    const handleVerifyPin = async (pinValue) => {
        if (attemptCount >= 3) {
            setError('ป้อนรหัสผิดครับ 3 ครั้ง กรุณาลองใหม่อีกครั้งภายหลัง');
            return;
        }

        setIsLoading(true);

        try {
            const user = await ApiService.verifyToken();
            setUserInfo(user);

            await onVerify(pinValue, user);

            setSuccess(true);
            setError('');
            setAttemptCount(0);

            setTimeout(() => {
                setPin(Array(PIN_LENGTH).fill(''));
                setSuccess(false);
                setIsLoading(false);
                onClose();
            }, 800);

        } catch (err) {
            console.error('PIN verification error:', err);

            setAttemptCount(prev => prev + 1);

            if (err.message === 'TOKEN_EXPIRED') {
                localStorage.removeItem('AuthToken');
                sessionStorage.removeItem('AuthToken');
                setError('เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่');
                setTimeout(() => {
                    window.location.href = '/auth/login';
                }, 1500);
            } else {
                setError(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบ PIN');
            }

            setPin(Array(PIN_LENGTH).fill(''));
            triggerShake();
            setIsLoading(false);
        }
    };

    const clearPin = () => {
        setPin(Array(PIN_LENGTH).fill(''));
        setError('');
        inputRefs.current[0]?.focus();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-400/10 bg-opacity-20 flex items-center justify-center z-50 backdrop-blur-sm p-4" style={{ fontFamily: '"Kanit", sans-serif' }}>
            <div
                className={`bg-white rounded-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md shadow-2xl transform transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    } ${shake ? 'animate-shake' : ''}`}
            >
                <div className="text-center mb-6 sm:mb-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{title}</h3>
                    <p className="text-gray-600 text-sm sm:text-base">กรุณากรอกรหัส PIN 4 หลักของคุณ</p>
                    {userInfo && (
                        <p className="text-sm text-blue-600 mt-2">
                            สำหรับ: {userInfo.firstname} {userInfo.lastname}
                        </p>
                    )}
                    {attemptCount > 0 && (
                        <p className="text-sm text-orange-600 mt-2">
                            ความพยายามที่ {attemptCount}/3
                        </p>
                    )}
                </div>

                <div className="mb-6">
                    <div className="flex justify-center space-x-2 sm:space-x-3 mb-4">
                        {pin.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => inputRefs.current[index] = el}
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={digit ? '•' : ''}
                                onChange={(e) => handlePinChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                onFocus={(e) => e.target.select()}
                                className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 rounded-xl focus:outline-none transition-all duration-200 ${error
                                    ? 'border-red-400 bg-red-50'
                                    : success
                                        ? 'border-green-400 bg-green-50'
                                        : digit
                                            ? 'border-blue-400 bg-blue-50'
                                            : 'border-gray-300 bg-gray-50'
                                    } focus:border-blue-500 focus:bg-white focus:shadow-lg focus:scale-105`}
                                maxLength="1"
                                autoComplete="off"
                                disabled={isLoading || attemptCount >= 3}
                                style={{ fontFamily: '"Kanit", sans-serif' }}
                            />
                        ))}
                    </div>

                    <div className="flex justify-center mb-4">
                        <button
                            onClick={clearPin}
                            disabled={isLoading || attemptCount >= 3}
                            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ล้างรหัส PIN
                        </button>
                    </div>

                    {error && (
                        <div className="text-center">
                            <p className="text-red-600 text-sm font-medium flex items-center justify-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </p>
                        </div>
                    )}

                    {success && (
                        <div className="text-center">
                            <p className="text-green-600 text-sm font-medium flex items-center justify-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                PIN ถูกต้อง!
                            </p>
                        </div>
                    )}
                </div>

                {isLoading && (
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <span className="text-blue-600 font-medium ml-2 text-sm sm:text-base">กำลังตรวจสอบ...</span>
                        </div>
                    </div>
                )}

                <div className="flex space-x-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 sm:px-6 py-2 sm:py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium hover:shadow-md text-sm sm:text-base"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={() => pin.every(digit => digit !== '') && handleVerifyPin(pin.join(''))}
                        disabled={isLoading || pin.some(digit => digit === '') || success || attemptCount >= 3}
                        className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium hover:shadow-lg hover:scale-105 transform text-sm sm:text-base"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                ตรวจสอบ...
                            </div>
                        ) : success ? (
                            <div className="flex items-center justify-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                สำเร็จ!
                            </div>
                        ) : (
                            'ยืนยัน'
                        )}
                    </button>
                </div>

                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full"
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
        </div>
    );
};

// Authentication Manager
const AuthManager = {
    async verifyPinWithAPI(pin, user) {
        if (!user || !user.pincode) {
            throw new Error('ไม่พบข้อมูลผู้ใช้');
        }

        if (pin === user.pincode) {
            return { success: true, user };
        }

        throw new Error('รหัส PIN ไม่ถูกต้อง');
    },

    setPinToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        CookieManager.set('pinToken', token, PIN_TOKEN_EXPIRY_HOURS);
        return token;
    },

    checkPinToken() {
        return CookieManager.get('pinToken') !== null;
    },

    clearPinToken() {
        CookieManager.remove('pinToken');
    },

    logout() {
        localStorage.removeItem('AuthToken');
        sessionStorage.removeItem('AuthToken');
        this.clearPinToken();
    }
};

// Main QuickActions Component
const QuickActions = ({ customActions = [], className = "", showHeader = false, headerTitle = "เมนูหลัก" }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        action: null
    });

    const [toast, setToast] = useState({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const hideToast = () => {
        setToast({ show: false, message: '', type: 'success' });
    };

    const handleLogout = () => {
        document.cookie = 'pinToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        document.cookie = 'AuthToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        localStorage.removeItem('AuthToken');
        window.location.href = '/auth/login';
    };

    const defaultActions = [
        {
            id: 'dashboard',
            title: 'แดชบอร์ด',
            subtitle: 'ข้อมูลสรุปและสถิติ',
            icon: (
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
            ),
            bgColor: 'bg-white border border-gray-200',
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            textColor: 'text-gray-800',
            subtitleColor: 'text-gray-500',
            hoverEffect: 'hover:border-blue-300 hover:shadow-md',
            action: () => window.location.href = '/auth/employee',
            requiresPin: true
        },
        {
            id: 'Points',
            title: 'แต้มสะสม',
            subtitle: 'แต้มสะสม รางวัล และสิทธิประโยชน์',
            icon: (
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            ),
            bgColor: 'bg-white border border-gray-200',
            iconBg: 'bg-yellow-50',
            iconColor: 'text-green-600',
            textColor: 'text-gray-800',
            subtitleColor: 'text-gray-500',
            hoverEffect: 'hover:border-yellow-300 hover:shadow-md',
            action: () => window.location.href = '/auth/employee/managepoint',
            requiresPin: true,
            badge: { text: '★', color: 'bg-yellow-500' }
        },
        {
            id: 'inventory',
            title: 'คลังสินค้า',
            subtitle: 'จัดการสต๊อกและสินค้าคงเหลือ',
            icon: (
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            ),
            bgColor: 'bg-white border border-gray-200',
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-600',
            textColor: 'text-gray-800',
            subtitleColor: 'text-gray-500',
            hoverEffect: 'hover:border-purple-300 hover:shadow-md',
            action: () => window.location.href = '/inventory',
            requiresPin: true
        },
        {
            id: 'products',
            title: 'จัดการสินค้า',
            subtitle: 'เพิ่ม แก้ไข ลบรายการสินค้า',
            icon: (
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            bgColor: 'bg-white border border-gray-200',
            iconBg: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            textColor: 'text-gray-800',
            subtitleColor: 'text-gray-500',
            hoverEffect: 'hover:border-indigo-300 hover:shadow-md',
            action: () => window.location.href = '/auth/employee/menu',
            requiresPin: true
        },
        {
            id: 'customers',
            title: 'ลูกค้า',
            subtitle: 'ข้อมูลและประวัติการซื้อ',
            icon: (
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            bgColor: 'bg-white border border-gray-200',
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-600',
            textColor: 'text-gray-800',
            subtitleColor: 'text-gray-500',
            hoverEffect: 'hover:border-orange-300 hover:shadow-md',
            action: () => window.location.href = '/customers',
            requiresPin: true
        },
        {
            id: 'analytics',
            title: 'วิเคราะห์ข้อมูล',
            subtitle: 'รายงานและสถิติการขาย',
            icon: (
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            bgColor: 'bg-white border border-gray-200',
            iconBg: 'bg-teal-50',
            iconColor: 'text-teal-600',
            textColor: 'text-gray-800',
            subtitleColor: 'text-gray-500',
            hoverEffect: 'hover:border-teal-300 hover:shadow-md',
            action: () => window.location.href = '/analytics',
            requiresPin: true
        },
        {
            id: 'reports',
            title: 'รายงาน',
            subtitle: 'สร้างและดาวน์โหลดรายงาน',
            icon: (
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            bgColor: 'bg-white border border-gray-200',
            iconBg: 'bg-pink-50',
            iconColor: 'text-pink-600',
            textColor: 'text-gray-800',
            subtitleColor: 'text-gray-500',
            hoverEffect: 'hover:border-pink-300 hover:shadow-md',
            action: () => window.location.href = '/reports',
            requiresPin: true
        },
        {
            id: 'employees',
            title: 'พนักงาน',
            subtitle: 'จัดการข้อมูลบุคลากร',
            icon: (
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            bgColor: 'bg-white border border-gray-200',
            iconBg: 'bg-violet-50',
            iconColor: 'text-violet-600',
            textColor: 'text-gray-800',
            subtitleColor: 'text-gray-500',
            hoverEffect: 'hover:border-violet-300 hover:shadow-md',
            action: () => window.location.href = '/employees',
            requiresPin: true
        },
        {
            id: 'settings',
            title: 'ตั้งค่าระบบ',
            subtitle: 'การตั้งค่าและการกำหนดค่า',
            icon: (
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            bgColor: 'bg-white border border-gray-200',
            iconBg: 'bg-gray-50',
            iconColor: 'text-gray-600',
            textColor: 'text-gray-800',
            subtitleColor: 'text-gray-500',
            hoverEffect: 'hover:border-gray-300 hover:shadow-md',
            action: () => window.location.href = '/settings',
            requiresPin: false
        },
        {
            id: 'help',
            title: 'ศูนย์ช่วยเหลือ',
            subtitle: 'คู่มือและการสนับสนุน',
            icon: (
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            bgColor: 'bg-white border border-gray-200',
            iconBg: 'bg-sky-50',
            iconColor: 'text-sky-600',
            textColor: 'text-gray-800',
            subtitleColor: 'text-gray-500',
            hoverEffect: 'hover:border-sky-300 hover:shadow-md',
            action: () => window.location.href = '/help',
            requiresPin: false
        },
        {
            id: 'logout',
            title: 'ออกจากระบบ',
            subtitle: 'ออกจากระบบอย่างปลอดภัย',
            icon: (
                <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            ),
            bgColor: 'bg-white border border-gray-200',
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
            textColor: 'text-gray-800',
            subtitleColor: 'text-gray-500',
            hoverEffect: 'hover:border-red-300 hover:shadow-md',
            action: handleLogout,
            requiresPin: false
        }
    ];

    const allActions = [...defaultActions, ...customActions];

    const handleActionClick = useCallback(async (actionItem) => {
        if (actionItem.requiresPin === false || AuthManager.checkPinToken()) {
            actionItem.action();
            return;
        }

        setModalState({
            isOpen: true,
            title: `เข้าสู่ ${actionItem.title}`,
            action: actionItem.action
        });
    }, []);

    const handlePinVerify = useCallback(async (pin, user) => {
        const result = await AuthManager.verifyPinWithAPI(pin, user);

        if (result.success) {
            AuthManager.setPinToken();
            showToast('PIN ได้รับการตรวจสอบแล้ว', 'success');

            setTimeout(() => {
                modalState.action();
            }, 100);
        }
    }, [modalState.action]);

    const closeModal = useCallback(() => {
        setModalState({
            isOpen: false,
            title: '',
            action: null
        });
    }, []);

    return (
        <>
            <FontLoader />
            <div className={`${className}`} style={{ fontFamily: '"Kanit", sans-serif' }}>
                {showHeader && (
                    <div className="mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">
                            {headerTitle}
                        </h1>
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
                    {allActions.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            className={`
                group relative rounded-3xl shadow-lg hover:shadow-2xl 
                transition-all duration-300 transform hover:scale-105 active:scale-95
                p-6 sm:p-8 text-center border-2 border-transparent
                ${action.bgColor} hover:border-white/50
                focus:outline-none focus:ring-4 focus:ring-blue-200
                min-h-[120px] sm:min-h-[140px] lg:min-h-[160px]
                flex flex-col items-center justify-center
                backdrop-blur-sm
              `}
                            title={action.title}
                            style={{ fontFamily: '"Kanit", sans-serif' }}
                        >
                            <div className={`
                transition-transform duration-300
                ${action.iconColor} group-hover:scale-110
                drop-shadow-sm mb-2 sm:mb-3
              `}>
                                {action.icon}
                            </div>

                            <div className="text-center">
                                <span className={`
                  text-xs sm:text-sm font-medium
                  ${action.iconColor} group-hover:text-opacity-90
                  leading-tight block
                `}>
                                    {action.title}
                                </span>
                            </div>

                            {action.requiresPin && !AuthManager.checkPinToken() && (
                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                    <svg className="w-16 h-16 text-zinc-700/70" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 1a5 5 0 0 0-5 5v2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5zm-3 5a3 3 0 1 1 6 0v2H9V6zm3 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
                                    </svg>
                                </div>
                            )}

                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            <div className="absolute inset-0 rounded-3xl overflow-hidden">
                                <div className="absolute inset-0 bg-white/30 transform scale-0 group-active:scale-100 transition-transform duration-150 rounded-3xl" />
                            </div>
                        </button>
                    ))}
                </div>

                <PinModal
                    isOpen={modalState.isOpen}
                    onClose={closeModal}
                    onVerify={handlePinVerify}
                    title={modalState.title}
                />

                {toast.show && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={hideToast}
                    />
                )}
            </div>
        </>
    );
};

export default QuickActions;