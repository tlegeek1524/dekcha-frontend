import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

const CounterAnimation = ({ value, duration }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = parseInt(value) || 0;
        const increment = (end - start) / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if ((increment >= 0 && start >= end) || (increment < 0 && start <= end)) {
                setDisplayValue(end);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [value, duration]);

    return <span>{displayValue.toLocaleString()}</span>;
};

const Navbar = ({ user, safeName }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        // โหลด Google Fonts สำหรับ Kanit และ Prompt
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@200;300;400;500;600;700;800&family=Prompt:wght@200;300;400;500;600;700;800&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        return () => {
            const existingLink = document.head.querySelector(`link[href="${link.href}"]`);
            if (existingLink) document.head.removeChild(existingLink);
        };
    }, []);

    const handleNavigation = useCallback((path) => {
        setMenuOpen(false);
        if (path !== currentPath) navigate(path);
    }, [navigate, currentPath]);

    const handleLogout = useCallback(async () => {
        try {
            if (typeof liff !== 'undefined' && liff.isLoggedIn()) {
                await liff.logout();
            }
        } catch (err) {
            console.error('LIFF logout error:', err);
        } finally {
            Cookies.remove('authToken');
            navigate('/');
        }
    }, [navigate]);

    const menuItems = [
        {
            id: 'home',
            path: '/login/userlogin',
            label: 'หน้าหลัก',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            ),
            isImportant: false
        },
        {
            id: 'profile',
            path: '/login/profile',
            label: 'โปรไฟล์',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            ),
            isImportant: true
        },
        {
            id: 'mailbox',
            path: '/login/mailbox',
            label: 'กล่องจดหมาย',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            ),
            isImportant: true
        },
        {
            id: 'menu',
            path: '/login/menu',
            label: 'แลกสิทธิ์',
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            ),
            isImportant: false
        }
    ];

    const renderMenuItem = (item) => {
        const isActive = currentPath === item.path;

        return (
            <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 group w-full text-left ${isActive
                        ? 'bg-gradient-to-r from-[#a1887f] to-[#8d6e63] border border-[#5d4037] shadow-sm'
                        : 'hover:bg-gradient-to-r hover:from-[#a1887f]/20 hover:to-[#8d6e63]/20 border border-transparent'
                    }`}
            >
                <div className={`p-1.5 rounded-full flex-shrink-0 transition-all duration-200 ${isActive
                        ? 'bg-gradient-to-br from-[#5d4037] to-[#3e2723]'
                        : 'bg-gradient-to-br from-[#a1887f] to-[#8d6e63] group-hover:from-[#5d4037] group-hover:to-[#3e2723]'
                    }`}>
                    <svg className={`w-3.5 h-3.5 ${isActive ? 'text-[#f5f5f5]' : 'text-[#3e2723] group-hover:text-[#f5f5f5]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                    </svg>
                </div>
                <span className={`text-sm font-medium truncate ${isActive
                        ? 'text-[#f5f5f5] font-semibold'
                        : 'text-[#3e2723] group-hover:text-[#5d4037]'
                    }`} style={{ fontFamily: 'Kanit, sans-serif' }}>
                    {item.label}
                </span>
                {isActive && <div className="w-2 h-2 bg-[#f5f5f5] rounded-full animate-pulse ml-auto flex-shrink-0"></div>}
            </button>
        );
    };

    return (
        <div className="relative" style={{ fontFamily: 'Prompt, sans-serif' }}>
            <div className="bg-gradient-to-r from-[#f5f5f5] to-[#a1887f]/10 shadow-lg border-b border-[#8d6e63]/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                            <div className="relative flex-shrink-0">
                                {user?.profile?.pictureUrl ? (
                                    <img src={user.profile.pictureUrl} alt="Profile" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#5d4037] shadow-md hover:shadow-lg transition-shadow duration-300" />
                                ) : (
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#a1887f] to-[#8d6e63] border-2 border-[#5d4037] shadow-md flex items-center justify-center hover:shadow-lg transition-shadow duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 text-[#f5f5f5]">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                )}
                                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="text-sm sm:text-base font-medium text-[#3e2723] flex items-center truncate" style={{ fontFamily: 'Kanit, sans-serif' }}>
                                    <span className="mr-1 sm:mr-2 flex-shrink-0">คุณ:</span>
                                    <span className="font-semibold text-[#5d4037] truncate">{safeName || 'ผู้ใช้'}</span>
                                </div>
                                <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                                    <div className="flex items-center bg-gradient-to-r from-[#a1887f]/20 to-[#8d6e63]/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-[#8d6e63]/30">
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[#5d4037] mr-1 sm:mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-[#3e2723] font-medium whitespace-nowrap" style={{ fontFamily: 'Kanit, sans-serif' }}>
                                            แต้ม: <CounterAnimation value={user?.userpoint || 0} duration={1500} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setMenuOpen(!menuOpen)} className={`relative group p-3 sm:p-4 rounded-xl bg-gradient-to-br border transition-all duration-300 transform ${menuOpen ? 'from-[#5d4037] to-[#3e2723] border-[#5d4037] shadow-lg' : 'from-[#a1887f] to-[#8d6e63] border-[#8d6e63] shadow-md'}`}>
                            <div className="w-6 h-6 sm:w-8 sm:h-8 flex flex-col justify-center items-center relative">
                                <span className={`block w-5 sm:w-7 h-0.5 ${menuOpen ? 'bg-[#f5f5f5]' : 'bg-[#3e2723]'} rounded-full transition-all absolute ${menuOpen ? 'rotate-45 translate-y-0' : 'rotate-0 -translate-y-1.5'}`}></span>
                                <span className={`block w-5 sm:w-7 h-0.5 ${menuOpen ? 'bg-[#f5f5f5]' : 'bg-[#3e2723]'} rounded-full transition-all ${menuOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}></span>
                                <span className={`block w-5 sm:w-7 h-0.5 ${menuOpen ? 'bg-[#f5f5f5]' : 'bg-[#3e2723]'} rounded-full transition-all absolute ${menuOpen ? '-rotate-45 translate-y-0' : 'rotate-0 translate-y-1.5'}`}></span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Dropdown Menu */}
            <div className={`absolute top-full right-4 mt-2 w-72 transition-all duration-300 ease-in-out z-50 ${menuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                <div className="bg-[#f5f5f5] border border-[#8d6e63]/30 rounded-xl shadow-xl">
                    <div className="p-4">
                        <div className="mb-3 p-2 bg-gradient-to-r from-[#a1887f]/20 to-[#8d6e63]/20 rounded-lg border border-[#8d6e63]/30">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-[#5d4037] rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium text-[#3e2723]" style={{ fontFamily: 'Kanit, sans-serif' }}>
                                    หน้าปัจจุบัน: {menuItems.find(item => currentPath === item.path)?.label || 'ไม่พบหน้า'}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            {menuItems.map(renderMenuItem)}
                        </div>
                        <div className="border-t border-[#8d6e63]/30 pt-3 mt-3">
                            <button onClick={handleLogout} className="w-full flex items-center space-x-2 p-2 rounded-lg border border-transparent hover:bg-red-50 hover:border-red-200 transition-all duration-200 group">
                                <div className="p-1.5 rounded-full bg-gradient-to-br from-red-100 to-red-200 group-hover:from-red-200 group-hover:to-red-300 transition-all duration-200 flex-shrink-0">
                                    <svg className="w-3.5 h-3.5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-red-700" style={{ fontFamily: 'Kanit, sans-serif' }}>ออกจากระบบ</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;