import React, { useState, useEffect, useCallback } from 'react';
import liff from '@line/liff';
import DOMPurify from 'dompurify';
import Cookies from 'js-cookie';
import Navbar from '../navbar';
import Spinner from '../util/LoadSpinner';

const Icons = {
  Error: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  User: () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Mail: () => (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Star: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  Minus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Spinner: () => (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
};

const LIFF_ID = import.meta.env.VITE_LIFF_ID;
const API_URL = import.meta.env.VITE_API_URL;

const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-[#8d6e63]/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-[#8d6e63]/20">
      <Spinner/>
    </div>
  </div>
);

const ErrorMessage = ({ message }) => (
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
);

const Toast = ({ message, type, show }) => {
  if (!show) return null;

  const styles = {
    success: 'bg-green-500 text-white shadow-green-500/25',
    error: 'bg-[#5d4037] text-white shadow-[#5d4037]/25',
    info: 'bg-[#6d4c41] text-white shadow-[#6d4c41]/25'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${styles[type]} px-4 py-3 rounded-xl sm:rounded-2xl shadow-lg flex items-center gap-2 animate-slide-in backdrop-blur-md max-w-xs`}>
      {type === 'success' && <Icons.Check />}
      {type === 'error' && <Icons.Error />}
      {type === 'info' && <Icons.Spinner />}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

const PointLogItem = ({ log, index }) => {
  const isPositive = log.pointsAdded > 0;
  
  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-[#8d6e63]/20 hover:border-[#6d4c41]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#8d6e63]/10 hover:scale-[1.01] overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 flex-shrink-0 ${
            isPositive 
              ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md shadow-green-500/20' 
              : 'bg-gradient-to-br from-[#6d4c41] to-[#5d4037] text-white shadow-md shadow-[#5d4037]/20'
          }`}>
            {isPositive ? <Icons.Plus /> : <Icons.Minus />}
          </div>
          
          {/* Content */}
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
                {log.searchInput}
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-[#6d4c41]/10 text-[#6d4c41] rounded-lg text-xs">
                {log.addedBy}
              </span>
            </div>
          </div>
          
          {/* Points */}
          <div className="text-right flex-shrink-0">
            <div className={`text-xl sm:text-2xl font-bold transition-all duration-300 ${
              isPositive ? 'text-green-600' : 'text-[#5d4037]'
            }`}>
              {isPositive ? '+' : ''}{log.pointsAdded}
            </div>
            <div className="text-xs text-[#6d4c41] font-medium">คะแนน</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function UserMailbox() {
  const [userInfo, setUserInfo] = useState({ uid: '', name: '', userpoint: 0, profile: null });
  const [pointLogs, setPointLogs] = useState([]);
  const [logsSummary, setLogsSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  }, []);

  const fetchPointLogs = useCallback(async (uid) => {
    try {
      const token = Cookies.get('authToken');
      if (!token) throw new Error('Token not found');

      setLogsLoading(true);
      const response = await fetch(`${API_URL}/points/get-point-log/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setPointLogs([]);
          setLogsSummary(null);
          setPagination(null);
          return;
        }
        throw new Error('Failed to fetch point logs');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setPointLogs(result.data.logs || []);
        setLogsSummary(result.data.summary || null);
        setPagination(result.data.pagination || null);
        
        if (result.message) {
          showToast(result.message, 'success');
        }
      } else {
        setPointLogs([]);
        setLogsSummary(null);
        setPagination(null);
      }
    } catch (err) {
      console.error('Point logs error:', err);
      showToast('ไม่สามารถดึงข้อมูลประวัติคะแนนได้', 'error');
      setPointLogs([]);
      setLogsSummary(null);
      setPagination(null);
    } finally {
      setLogsLoading(false);
    }
  }, [showToast]);

  const syncUserData = useCallback(async (profileData, isPolling = false) => {
    try {
      const token = Cookies.get('authToken');
      if (!token) throw new Error('Token not found');

      if (!isPolling) {
        showToast('กำลังซิงค์ข้อมูล...', 'info');
      }

      const response = await fetch(`${API_URL}/users/${profileData.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const createResponse = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        });

        if (!createResponse.ok) throw new Error('Failed to create user');

        const updatedResponse = await fetch(`${API_URL}/users/${profileData.userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await updatedResponse.json();
        setUserInfo(prev => ({ ...prev, ...userData }));
        await fetchPointLogs(userData.uid);
      } else {
        const userData = await response.json();
        setUserInfo(prev => ({ ...prev, ...userData }));
        await fetchPointLogs(userData.uid);
      }

      if (!isPolling) showToast('ข้อมูลอัปเดตเรียบร้อย', 'success');
    } catch (err) {
      console.error('Sync error:', err);
      if (!isPolling) showToast('เกิดข้อผิดพลาดในการซิงค์', 'error');
    }
  }, [showToast, fetchPointLogs]);

  const refreshData = async () => {
    if (userInfo.profile) {
      await syncUserData(userInfo.profile);
    }
  };

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const idToken = liff.getIDToken();
        if (!idToken) throw new Error('ไม่สามารถดึง Token ได้');

        Cookies.set('authToken', idToken, { secure: true, sameSite: 'Strict', expires: 1 });

        const profileData = await liff.getProfile();
        setUserInfo(prev => ({ ...prev, profile: profileData }));
        await syncUserData(profileData);
      } catch (err) {
        console.error('LIFF error:', err);
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeLiff();
  }, [syncUserData]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  const { profile } = userInfo;
  const safeName = DOMPurify.sanitize(userInfo.name || profile?.displayName || '');
  const user = {
    uid: userInfo.uid,
    name: safeName,
    userpoint: userInfo.userpoint,
    profile,
    pictureUrl: profile?.pictureUrl
  };

  return (
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

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl pb-20">
        {/* Summary Card */}
        {logsSummary && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-[#5d4037] via-[#6d4c41] to-[#8d6e63] rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-lg shadow-[#5d4037]/20 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-full blur-2xl"></div>
              </div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white/80 text-xs sm:text-sm font-medium mb-1 sm:mb-2">คะแนนรวมทั้งหมด</p>
                  <p className="text-2xl sm:text-4xl font-bold mb-1">+{logsSummary.totalPointsAdded}</p>
                  <p className="text-white/70 text-xs sm:text-sm">{logsSummary.totalRecords} รายการ</p>
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <Icons.Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Point Logs Section */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-[#5d4037] mb-1 sm:mb-2">กล่องจดหมาย</h1>
              <p className="text-[#6d4c41] text-sm sm:text-base">ประวัติการได้รับคะแนนของคุณ</p>
            </div>
            
            {logsSummary && (
              <div className="text-right">
                <div className="text-xs text-[#8d6e63] mb-1">แสดงผล</div>
                <div className="text-sm sm:text-lg font-semibold text-[#5d4037]">
                  {logsSummary.currentPageRecords}<span className="text-[#6d4c41]"> / {logsSummary.totalRecords}</span>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          {logsLoading ? (
            <div className="flex justify-center py-12 sm:py-16">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#8d6e63]/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icons.Spinner />
                </div>
                <div className="text-[#5d4037] text-base sm:text-lg font-medium mb-2">กำลังโหลดประวัติ</div>
                <div className="text-[#6d4c41] text-sm">โปรดรอสักครู่...</div>
              </div>
            </div>
          ) : pointLogs.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-[#8d6e63]/20 shadow-lg shadow-[#8d6e63]/10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#8d6e63]/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Icons.Mail />
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-[#5d4037] mb-2 sm:mb-3">ยังไม่มีประวัติคะแนน</h3>
                <p className="text-[#6d4c41] mb-6 sm:mb-8 text-sm sm:text-lg">เริ่มใช้งานเพื่อสะสมคะแนนและดูประวัติได้ที่นี่</p>
                <button 
                  onClick={refreshData}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#5d4037] to-[#6d4c41] hover:from-[#4a2c20] hover:to-[#5d4037] text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] text-sm sm:text-base"
                >
                  <Icons.Refresh />
                  รีเฟรชข้อมูล
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Point Logs List */}
              <div className="space-y-3 sm:space-y-4">
                {pointLogs.map((log, index) => (
                  <PointLogItem 
                    key={`${log.id}-${log.createdAt || index}`} 
                    log={log} 
                    index={index} 
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-[#8d6e63]/20 p-4 sm:p-6 shadow-lg shadow-[#8d6e63]/10">
                  <div className="flex items-center justify-between">
                    <div className="text-[#6d4c41] text-sm">
                      หน้า {pagination.currentPage} จาก {pagination.totalPages}
                      <span className="text-[#8d6e63] ml-2 hidden sm:inline">({pagination.totalItems} รายการ)</span>
                    </div>
                    <div className="flex gap-2">
                      {pagination.hasPrevPage && (
                        <button className="inline-flex items-center gap-1 sm:gap-2 px-3 py-2 bg-[#8d6e63]/10 hover:bg-[#8d6e63]/20 text-[#5d4037] rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-sm">
                          <Icons.ChevronLeft />
                          <span className="hidden sm:inline">ก่อนหน้า</span>
                        </button>
                      )}
                      {pagination.hasNextPage && (
                        <button className="inline-flex items-center gap-1 sm:gap-2 px-3 py-2 bg-gradient-to-r from-[#5d4037] to-[#6d4c41] hover:from-[#4a2c20] hover:to-[#5d4037] text-white rounded-lg sm:rounded-xl transition-all duration-200 font-medium shadow-md text-sm">
                          <span className="hidden sm:inline">ถัดไป</span>
                          <Icons.ChevronRight />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}