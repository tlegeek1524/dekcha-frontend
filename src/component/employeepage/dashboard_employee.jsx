import React, { useState, useEffect, useCallback, useMemo } from "react";
import QuickActions from "../quickaction";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// Constants
const API_URL = import.meta.env.VITE_API_URL;
const TH_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

// Utility functions
const toBangkokDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
};

const formatDateDMY = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
};

const formatThaiDate = (dateStr) => {
  if (!dateStr) return "";
  const date = toBangkokDate(dateStr);
  const day = date.getDate();
  const month = TH_MONTHS[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${month} ${year}`;
};

const formatThaiDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return "";
  // รวม dateStr กับ timeStr แล้วแปลงเป็น Date
  const dateTime = toBangkokDate(`${dateStr}T${timeStr}`);
  const day = dateTime.getDate();
  const month = TH_MONTHS[dateTime.getMonth()];
  const year = dateTime.getFullYear() + 543;
  const hour = dateTime.getHours().toString().padStart(2, "0");
  const minute = dateTime.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${year} ${hour}:${minute} น.`;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const summarizeTransactionsPerDay = (data) => {
  const summary = {};
  data.forEach((item) => {
    if (!summary[item.date]) summary[item.date] = 0;
    summary[item.date]++;
  });
  return Object.entries(summary).map(([date, count]) => ({
    date,
    count,
  }));
};

const groupByDate = (data) => {
  const grouped = {};
  data.forEach((item) => {
    if (!grouped[item.date]) grouped[item.date] = [];
    grouped[item.date].push(item);
  });
  return grouped;
};

// Custom hooks
const useAuth = () => {
  const [hasAccess, setHasAccess] = useState(null);

  const checkAccess = useCallback(() => {
    const authToken = getCookie("AuthToken");
    const pinToken = getCookie("pinToken");
    return authToken && pinToken;
  }, []);

  useEffect(() => {
    setHasAccess(checkAccess());
  }, [checkAccess]);

  return hasAccess;
};

const useApiData = (url, dependencies = [], transformer) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!dependencies.every(dep => dep !== null && dep !== undefined)) {
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const transformedData = transformer ? transformer(result) : result;
      setData(transformedData);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError('การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง');
      } else {
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
      console.error(`Error fetching ${url}:`, err);
    } finally {
      setLoading(false);
    }
  }, [url, transformer, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const retry = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, retry };
};

// Main component
export default function Dashboard() {
  const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [pointsStart, setPointsStart] = useState(today);
  const [pointsEnd, setPointsEnd] = useState(today);
  const [couponsStart, setCouponsStart] = useState(today);
  const [couponsEnd, setCouponsEnd] = useState(today);

  const hasAccess = useAuth();

  // Points data transformer
  const pointsTransformer = useCallback((json) => {
    if (!json?.data?.logs) return [];

    return json.data.logs
      .filter((log) => log.status === true)
      .map((log) => {
        const dateObj = toBangkokDate(log.createdAt);
        const dateStr = dateObj.toISOString().split("T")[0];
        const timeStr = dateObj.toTimeString().split(" ")[0].slice(0, 8);
        return {
          points: log.point,
          date: dateStr,
          time: timeStr,
          datetime: `${dateStr} ${timeStr}`,
        };
      })
      .sort((a, b) => {
        if (a.date === b.date) {
          return a.time.localeCompare(b.time);
        }
        return a.date.localeCompare(b.date);
      });
  }, []);

  // Coupons data transformer
  const couponsTransformer = useCallback((json) => {
    if (!json?.logs) return [];

    const grouped = {};
    json.logs.forEach((log) => {
      const dateObj = toBangkokDate(log.createdat);
      const dateStr = dateObj.toISOString().split("T")[0];

      if (dateStr < couponsStart || dateStr > couponsEnd) return;

      const menuname = log.menuname || "ไม่ระบุ";
      if (!grouped[menuname]) grouped[menuname] = 0;
      grouped[menuname] += log.unit;
    });

    return Object.entries(grouped).map(([menuname, used]) => ({
      menuname,
      used,
    }));
  }, [couponsStart, couponsEnd]);

  // API calls
  const {
    data: pointsData,
    loading: loadingPoints,
    error: pointsError,
    retry: retryPoints
  } = useApiData(
    `${API_URL}/points/get-all-point-logs`,
    [hasAccess],
    pointsTransformer
  );

  const {
    data: couponsData,
    loading: loadingCoupons,
    error: couponsError,
    retry: retryCoupons
  } = useApiData(
    `${API_URL}/coupon/logusedcoupon`,
    [hasAccess, couponsStart, couponsEnd],
    couponsTransformer
  );

  // Memoized computations
  const filteredPoints = useMemo(() => {
    return pointsData.filter((item) => item.date >= pointsStart && item.date <= pointsEnd);
  }, [pointsData, pointsStart, pointsEnd]);

  const pointsSummary = useMemo(() => {
    return summarizeTransactionsPerDay(filteredPoints);
  }, [filteredPoints]);

  const groupedPoints = useMemo(() => {
    return groupByDate(filteredPoints);
  }, [filteredPoints]);

  const todayCount = useMemo(() => {
    const todayStr = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];
    return filteredPoints.filter((item) => item.date === todayStr).length;
  }, [filteredPoints]);

  const latestPointTime = useMemo(() => {
    if (filteredPoints.length === 0) return "-";
    const latest = filteredPoints[filteredPoints.length - 1];
    return formatThaiDateTime(latest.date, latest.time);
  }, [filteredPoints]);

  // Event handlers
  const handlePointsStartChange = useCallback((e) => {
    setPointsStart(e.target.value);
  }, []);

  const handlePointsEndChange = useCallback((e) => {
    setPointsEnd(e.target.value);
  }, []);

  const handleCouponsStartChange = useCallback((e) => {
    setCouponsStart(e.target.value);
  }, []);

  const handleCouponsEndChange = useCallback((e) => {
    setCouponsEnd(e.target.value);
  }, []);

  // Custom tooltip for points chart
  const PointsTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200 text-sm">
        <div className="font-medium text-slate-700 mb-1">
          {formatThaiDateTime(item.date, item.time)}
        </div>
        <div className="text-slate-600">
          แต้ม: <span className="font-semibold text-slate-800">{item.points}</span>
        </div>
      </div>
    );
  }, []);

  // Error component
  const ErrorComponent = ({ error, onRetry, title }) => (
    <div className="flex flex-col items-center justify-center h-[300px] p-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="text-slate-700 font-medium mb-2">{title}</div>
        <div className="text-sm text-slate-500 mb-4 max-w-sm">{error}</div>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    </div>
  );

  // Loading states
  if (hasAccess === null) {
    return (
      <div className="flex justify-center items-center h-full bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-600 mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold">ไม่มีสิทธิเข้าถึง</h2>
        </div>
        <p className="text-red-600 text-sm">คุณไม่มีสิทธิเข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        </div>
        <p className="text-slate-600 text-sm">
          ดูข้อมูลแต้มสะสมและการใช้คูปองย้อนหลังได้ตามช่วงวันที่เลือก
        </p>
      </div>

      <div className="mb-8">
        <QuickActions />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Points Chart */}
        <div className="bg-white shadow-sm rounded-2xl p-6 border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <h2 className="text-lg font-semibold text-slate-800">แต้มสะสม</h2>
              </div>
              {filteredPoints.length > 0 && (
                <div className="text-xs text-slate-500 mb-1">
                  ล่าสุด {latestPointTime}
                </div>
              )}
              <div className="text-sm text-blue-600 font-medium">
                {filteredPoints.length > 0
                  ? `${filteredPoints.length} รายการ`
                  : "ไม่มีรายการในช่วงวันที่ที่เลือก"}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors"
                  value={pointsStart}
                  onChange={handlePointsStartChange}
                />
                <span className="text-slate-400 text-sm">ถึง</span>
                <input
                  type="date"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors"
                  value={pointsEnd}
                  min={pointsStart}
                  onChange={handlePointsEndChange}
                />
              </div>
            </div>
          </div>

          {loadingPoints ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-500 mx-auto mb-3"></div>
                <div className="text-slate-500 text-sm">กำลังโหลดข้อมูลแต้ม...</div>
              </div>
            </div>
          ) : pointsError ? (
            <ErrorComponent
              error={pointsError}
              onRetry={retryPoints}
              title="เกิดข้อผิดพลาดในการโหลดข้อมูลแต้ม"
            />
          ) : filteredPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filteredPoints}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="datetime"
                  tickFormatter={(datetime) => {
                    const [, time] = datetime.split(" ");
                    const [hour, minute] = time.split(":");
                    return `${hour}:${minute}`;
                  }}
                  interval="preserveStartEnd"
                  height={60}
                  angle={-30}
                  textAnchor="end"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip content={PointsTooltip} />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#2563eb", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <div className="flex items-center justify-center text-slate-500 font-medium mb-2">
                  <svg className="w-8 h-8 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>ไม่มีข้อมูลในช่วงวันที่</span>
                </div>
                <div className="text-slate-400 text-sm">{formatThaiDate(pointsStart)} ถึง {formatThaiDate(pointsEnd)}</div>
              </div>
            </div>
          )}
        </div>
        {/* Coupons Chart */}
        <div className="bg-white shadow-sm rounded-2xl p-6 border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <h2 className="text-lg font-semibold text-slate-800">ประวัติการใช้คูปอง</h2>
              </div>
              <div className="text-sm text-emerald-600 font-medium">
                {couponsData.length > 0
                  ? `${couponsData.length} รายการเมนู`
                  : "ไม่มีรายการในช่วงวันที่ที่เลือก"}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-colors"
                  value={couponsStart}
                  onChange={handleCouponsStartChange}
                />
                <span className="text-slate-400 text-sm">ถึง</span>
                <input
                  type="date"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-colors"
                  value={couponsEnd}
                  min={couponsStart}
                  onChange={handleCouponsEndChange}
                />
              </div>
            </div>
          </div>

          {loadingCoupons ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-emerald-500 mx-auto mb-3"></div>
                <div className="text-slate-500 text-sm">กำลังโหลดข้อมูลคูปอง...</div>
              </div>
            </div>
          ) : couponsError ? (
            <ErrorComponent
              error={couponsError}
              onRetry={retryCoupons}
              title="เกิดข้อผิดพลาดในการโหลดข้อมูลคูปอง"
            />
          ) : couponsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={couponsData}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="menuname"
                  angle={0}
                  textAnchor="middle"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip
                  formatter={(value) => [`${value} คูปอง`, "ใช้แล้ว"]}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar
                  dataKey="used"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <div className="flex items-center justify-center text-slate-500 font-medium mb-2">
                  <svg className="w-8 h-8 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 11-1-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span>ไม่มีข้อมูลคูปองในช่วงวันที่</span>
                </div>
                <div className="text-slate-400 text-sm">{formatDateDMY(couponsStart)} ถึง {formatDateDMY(couponsEnd)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}