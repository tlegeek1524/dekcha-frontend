import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Phone, Calendar, Star, Search, Filter, RefreshCw, AlertCircle, Eye, EyeOff } from 'lucide-react';
import QuickActions from "../quickaction";

const ListEmployee = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [visiblePins, setVisiblePins] = useState(new Set());

  const getCookie = useCallback((name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }, []);

  const buildApiUrl = useCallback(() => {
    if (!API_URL) {
      throw new Error('VITE_API_URL is not configured in environment variables');
    }
    
    const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
    return `${baseUrl}/auth/get/employees`;
  }, [API_URL]);

  const createHeaders = useCallback((authToken) => {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    
    if (authToken) {
      headers.append("Authorization", `Bearer ${authToken}`);
      headers.append("x-auth-token", authToken);
    }
    
    return headers;
  }, []);

  const fetchEmployees = useCallback(async () => {
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
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const textResponse = await response.text();
        if (textResponse.includes('<!doctype') || textResponse.includes('<html')) {
          throw new Error('Server returned HTML instead of JSON. Please check server configuration.');
        }
        throw new Error(`Server returned ${contentType} instead of JSON.`);
      }

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

      if (data.status === 'OK') {
        const currentUserEmpid = getCookie('empid');  
        if (Array.isArray(data.employees)) {
          const filtered = data.employees.filter(employee => {
            return String(employee.empid) !== String(currentUserEmpid);
          });
          setEmployees(filtered);
        } else {
          setEmployees([]);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch employee data');
      }
    } catch (err) {
      let errorMessage = err.message;
      if (err.name === 'AbortError') {
        errorMessage = 'Request timeout. Please check your internet connection.';
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = `Network error. Unable to connect to server at ${API_URL}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [API_URL, getCookie, buildApiUrl, createHeaders]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = 
        employee.name_emp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.empid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.firstname_emp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.lastname_emp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.pincode_emp?.includes(searchTerm);
      
      const matchesFilter = 
        filterRole === 'all' || 
        employee.role === filterRole;
      
      return matchesSearch && matchesFilter;
    });
  }, [employees, searchTerm, filterRole]);

  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    
    return { totalEmployees };
  }, [employees]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const togglePinVisibility = (empid) => {
    setVisiblePins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(empid)) {
        newSet.delete(empid);
      } else {
        newSet.add(empid);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูลพนักงาน...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button 
            onClick={fetchEmployees}
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">รายชื่อพนักงาน</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-0.5">จัดการข้อมูลพนักงานทั้งหมด</p>
              </div>
            </div>
            <button 
              onClick={fetchEmployees}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 font-medium shadow-sm w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <QuickActions />
        </div>

        <div className="w-full mb-4 sm:mb-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wider">พนักงานทั้งหมด</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.totalEmployees}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">รายการทั้งหมด</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ รหัสพนักงาน ชื่อจริง นามสกุล หรือ PIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base transition-colors duration-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base bg-white min-w-[120px] transition-colors duration-200"
              >
                <option value="all">ทั้งหมด</option>
                <option value="admin">แอดมิน</option>
                <option value="employee">พนักงาน</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 sm:mb-6">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">พนักงาน</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">รหัสพนักงาน</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">ชื่อจริง-นามสกุล</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">PIN</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">บทบาท</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-16">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">
                        {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูลพนักงาน'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.empid} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {employee.name_emp?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{employee.name_emp || 'ไม่ระบุชื่อ'}</p>
                            <p className="text-sm text-gray-500">EMPID: {employee.empid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {employee.empid || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-700">
                          {employee.firstname_emp} {employee.lastname_emp}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="relative group">
                          {visiblePins.has(employee.empid) ? (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                                {employee.pincode_emp || '-'}
                              </span>
                              <button
                                onClick={() => togglePinVisibility(employee.empid)}
                                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-all"
                                title="ซ่อน PIN"
                              >
                                <EyeOff className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => togglePinVisibility(employee.empid)}
                              className="flex items-center gap-3 bg-gray-100 hover:bg-blue-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-300 transition-all group-hover:shadow-sm"
                              title="คลิกเพื่อดู PIN"
                            >
                              <div className="flex">
                                {[...Array(4)].map((_, i) => (
                                  <div key={i} className="w-2 h-2 bg-gray-400 rounded-full mx-0.5"></div>
                                ))}
                              </div>
                              <Eye className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          employee.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {employee.role === 'admin' ? 'แอดมิน' : 'พนักงาน'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูลพนักงาน'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredEmployees.map((employee) => (
                  <div key={employee.empid} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {employee.name_emp?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900 text-base">{employee.name_emp || 'ไม่ระบุชื่อ'}</h3>
                            <p className="text-sm text-gray-500">EMPID: {employee.empid}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                            employee.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {employee.role === 'admin' ? 'แอดมิน' : 'พนักงาน'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 font-medium">รหัสพนักงาน</p>
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                              {employee.empid || '-'}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">PIN</p>
                            <button
                              onClick={() => togglePinVisibility(employee.empid)}
                              className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                              title={visiblePins.has(employee.empid) ? "คลิกเพื่อซ่อน PIN" : "คลิกเพื่อดู PIN"}
                            >
                              <span className={`text-gray-900 font-medium ${
                                visiblePins.has(employee.empid) ? '' : 'filter blur-sm'
                              }`}>
                                {employee.pincode_emp || '-'}
                              </span>
                              {!visiblePins.has(employee.empid) && (
                                <span className="text-xs text-gray-500">คลิก</span>
                              )}
                            </button>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-500 font-medium">ชื่อจริง-นามสกุล</p>
                            <span className="text-gray-700">
                              {employee.firstname_emp} {employee.lastname_emp}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-gray-500 text-sm">
          แสดงข้อมูล {filteredEmployees.length} จาก {employees.length} รายการ
        </div>
      </div>
    </div>
  );
};

export default ListEmployee;