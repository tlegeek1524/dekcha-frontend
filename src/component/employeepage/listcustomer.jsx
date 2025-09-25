import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Users, Phone, Calendar, Star, Search, Filter, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import QuickActions from "../quickaction";

const ListCustomer = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const filterRef = useRef(null);

  // Utility function to get cookie
  const getCookie = useCallback((name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }, []);

  // Build API URL with proper handling
  const buildApiUrl = useCallback(() => {
    if (!API_URL) {
      throw new Error('VITE_API_URL is not configured in environment variables');
    }

    const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
    return `${baseUrl}/auth/get/customers`;
  }, [API_URL]);

  // Create request headers
  const createHeaders = useCallback((authToken) => {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    if (authToken) {
      // Try multiple authentication methods for better compatibility
      headers.append("Authorization", `Bearer ${authToken}`);
      headers.append("x-auth-token", authToken);
    }

    return headers;
  }, []);

  // Main fetch function
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const authToken = getCookie('AuthToken');
      if (!authToken) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const apiUrl = buildApiUrl();
      const headers = createHeaders(authToken);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(apiUrl, {
        method: "GET",
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const textResponse = await response.text();
        if (textResponse.includes('<!doctype') || textResponse.includes('<html')) {
          throw new Error('Server returned HTML instead of JSON. Please check server configuration.');
        }
        throw new Error(`Server returned ${contentType} instead of JSON.`);
      }

      // Handle HTTP errors
      if (response.status === 401) {
        throw new Error('Session expired. Please login again.');
      }

      if (response.status === 403) {
        throw new Error('You do not have permission to access this data.');
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 'Success') {
        setCustomers(Array.isArray(data.users) ? data.users : []);
      } else {
        throw new Error(data.message || 'Failed to fetch customer data');
      }
    } catch (err) {
      console.error('Fetch customers error:', err);

      let errorMessage = err.message;

      if (err.name === 'AbortError') {
        errorMessage = 'Request timeout. Please check your internet connection.';
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = `Network error. Unable to connect to server at ${API_URL}`;
      }

      setError(errorMessage);

      // Handle authentication errors
      if (errorMessage.includes('token') || errorMessage.includes('login') || errorMessage.includes('Session expired')) {
        // Could redirect to login page here
        console.warn('Authentication required');
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL, getCookie, buildApiUrl, createHeaders]);

  // Memoized filtered customers for performance
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch =
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.uid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phonenumber?.includes(searchTerm);

      const matchesFilter =
        filterActive === 'all' ||
        (filterActive === 'active' && customer.isactive) ||
        (filterActive === 'inactive' && !customer.isactive);

      return matchesSearch && matchesFilter;
    });
  }, [customers, searchTerm, filterActive]);

  // Pagination calculations
  const paginationData = useMemo(() => {
    const totalItems = filteredCustomers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredCustomers.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex,
      endIndex: Math.min(endIndex, totalItems),
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Memoized statistics
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.isactive).length;
    const inactiveCustomers = totalCustomers - activeCustomers;

    return { totalCustomers, activeCustomers, inactiveCustomers };
  }, [customers]);

  // Date formatting function
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '-';

    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Pagination handlers
  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, paginationData.totalPages)));
  }, [paginationData.totalPages]);

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(paginationData.totalPages);
  const goToPrevPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterActive]);

  // Load data on component mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    }
    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilter]);

  // Generate page numbers for pagination
  const getPageNumbers = useMemo(() => {
    const { totalPages } = paginationData;
    const delta = 2; // Number of pages to show around current page
    const pages = [];
    
    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    // Always show first page
    if (totalPages > 0) {
      pages.push(1);
    }

    // Add dots if there's gap between first page and range
    if (rangeStart > 2) {
      pages.push('...');
    }

    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    // Add dots if there's gap between range and last page
    if (rangeEnd < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page (if different from first)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, paginationData.totalPages]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูลลูกค้า...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button
            onClick={fetchCustomers}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">รายชื่อลูกค้า</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-0.5">จัดการข้อมูลลูกค้าทั้งหมด</p>
              </div>
            </div>
            <button
              onClick={fetchCustomers}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 font-medium shadow-sm w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-4 sm:mb-6">
          <QuickActions />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wider">ลูกค้าทั้งหมด</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">รายการทั้งหมด</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wider">ลูกค้าที่ใช้งานอยู่</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{stats.activeCustomers}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {stats.totalCustomers > 0 ? Math.round((stats.activeCustomers / stats.totalCustomers) * 100) : 0}% ของทั้งหมด
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 sm:h-4 sm:w-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Desktop: ช่องค้นหา + select filter */}
          <div className="hidden md:flex flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ รหัสลูกค้า หรือเบอร์โทร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base transition-colors duration-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base bg-white min-w-[120px] transition-colors duration-200"
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">ใช้งานอยู่</option>
                <option value="inactive">ไม่ใช้งาน</option>
              </select>
            </div>
          </div>
          {/* Mobile: ช่องค้นหา + filter icon dropdown */}
          <div className="flex md:hidden gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ รหัสลูกค้า หรือเบอร์โทร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-colors duration-200"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                onClick={() => setShowFilter((v) => !v)}
                aria-label="Filter"
              >
                <Filter className="h-5 w-5 text-blue-500" />
              </button>
              {showFilter && (
                <div
                  ref={filterRef}
                  className="absolute right-0 mt-2 z-10 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-2"
                >
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 rounded-t-lg ${filterActive === 'all' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
                    onClick={() => { setFilterActive('all'); setShowFilter(false); }}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${filterActive === 'active' ? 'text-green-600 font-semibold' : 'text-gray-700'}`}
                    onClick={() => { setFilterActive('active'); setShowFilter(false); }}
                  >
                    ใช้งานอยู่
                  </button>
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 rounded-b-lg ${filterActive === 'inactive' ? 'text-red-600 font-semibold' : 'text-gray-700'}`}
                    onClick={() => { setFilterActive('inactive'); setShowFilter(false); }}
                  >
                    ไม่ใช้งาน
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 sm:mb-6">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">ลูกค้า</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">รหัสลูกค้า</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">เบอร์โทร</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">แต้ม</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">สร้างเมื่อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginationData.currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-16">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">
                        {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูลลูกค้า'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginationData.currentItems.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {customer.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.name || 'ไม่ระบุชื่อ'}</p>
                            <p className="text-sm text-gray-500">ID: {customer.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-sm font-medium border border-slate-200">
                          {customer.uid || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {customer.phonenumber ? (
                          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                            <Phone className="h-4 w-4 text-indigo-600" />
                            <span className="text-indigo-800 font-medium">{customer.phonenumber}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                          <Star className="h-4 w-4 text-amber-600" />
                          <span className="font-bold text-amber-800">
                            {(customer.userpoint || 0).toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                          {formatDate(customer.createdat)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden">
            {paginationData.currentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <div className="bg-gray-50 rounded-full p-6 mb-6">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูลลูกค้า'}
                </h3>
                <p className="text-gray-500 text-center">
                  {searchTerm ? 'กรุณาลองใช้คำค้นหาอื่น' : 'เริ่มเพิ่มลูกค้าคนแรก'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {paginationData.currentItems.map((customer) => (
                  <div
                    key={customer.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200"
                  >
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                          {customer.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                            {customer.name || 'ไม่ระบุชื่อ'}
                          </h3>
                          <p className="text-sm text-gray-500 font-medium">
                            ID: {customer.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-gradient-to-r from-amber-100 to-amber-200 px-3 py-1.5 rounded-full border border-amber-200">
                        <Star className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-800 font-bold text-sm">
                          {(customer.userpoint || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Information Grid */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Customer ID */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>
                            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                              รหัสลูกค้า
                            </span>
                          </div>
                          <div className="bg-white rounded-lg px-3 py-2 border border-slate-300 ml-3.5 shadow-sm">
                            <span className="text-sm font-bold text-slate-800">
                              {customer.uid || '-'}
                            </span>
                          </div>
                        </div>

                        {/* Phone Number */}
                        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                              เบอร์โทร
                            </span>
                          </div>
                          <div className="bg-white rounded-lg px-2 py-2 border border-indigo-300 ml-2 shadow-sm">
                            {customer.phonenumber ? (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-indigo-600 flex-shrink-0 hidden sm:block" />
                                <span className="text-sm font-medium text-indigo-800 whitespace-nowrap">
                                  {customer.phonenumber}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Created Date */}
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            วันที่สร้างบัญชี
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 ml-3.5">
                          {formatDate(customer.createdat)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {paginationData.totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Results info */}
              <div className="text-sm text-gray-600 order-2 sm:order-1">
                แสดง {paginationData.startIndex + 1}-{paginationData.endIndex} จาก {paginationData.totalItems} รายการ
              </div>

              {/* Pagination controls */}
              <div className="flex items-center gap-1 order-1 sm:order-2">
                {/* First page button */}
                <button
                  onClick={goToFirstPage}
                  disabled={!paginationData.hasPrevPage}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  title="หน้าแรก"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Previous page button */}
                <button
                  onClick={goToPrevPage}
                  disabled={!paginationData.hasPrevPage}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  title="หน้าก่อนหน้า"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-2">
                  {getPageNumbers.map((page, index) => (
                    page === '...' ? (
                      <span key={index} className="px-3 py-2 text-gray-500">...</span>
                    ) : (
                      <button
                        key={index}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          currentPage === page
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                {/* Next page button */}
                <button
                  onClick={goToNextPage}
                  disabled={!paginationData.hasNextPage}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  title="หน้าถัดไป"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last page button */}
                <button
                  onClick={goToLastPage}
                  disabled={!paginationData.hasNextPage}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  title="หน้าสุดท้าย"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mobile pagination - simplified */}
            <div className="flex sm:hidden items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={goToPrevPage}
                disabled={!paginationData.hasPrevPage}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                ก่อนหน้า
              </button>

              <span className="text-sm text-gray-600 font-medium">
                หน้า {currentPage} จาก {paginationData.totalPages}
              </span>

              <button
                onClick={goToNextPage}
                disabled={!paginationData.hasNextPage}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ถัดไป
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          แสดงข้อมูล {paginationData.totalItems} รายการทั้งหมด
        </div>
      </div>
    </div>
  );
};

export default ListCustomer;