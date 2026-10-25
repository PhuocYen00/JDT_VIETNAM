"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Activity,
  AlignLeft,
  BarChart2,
} from "lucide-react";

interface ChartDataProps {
  charts: {
    ticketsByStatus: { name: string; value: number; color: string }[];
    ticketsByCategory: { name: string; count: number }[];
    ticketsByDepartment: { name: string; count: number }[];
    ticketsTrend: { month: string; received: number; completed: number }[];
  };
}

const CATEGORY_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#64748b",
];

export default function DashboardCharts({ charts }: ChartDataProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Trạng thái hiển thị loại biểu đồ (lưu trữ localStorage)
  const [trendType, setTrendType] = useState<"area" | "line" | "bar">("area");
  const [statusType, setStatusType] = useState<"donut" | "bar">("donut");
  const [categoryType, setCategoryType] = useState<"bar" | "pie">("bar");
  const [deptType, setDeptType] = useState<"horizontal" | "vertical">("horizontal");

  useEffect(() => {
    setIsMounted(true);
    // Khôi phục tùy chọn biểu đồ từ localStorage
    const savedTrend = localStorage.getItem("jdt_chart_trend");
    if (savedTrend === "area" || savedTrend === "line" || savedTrend === "bar") {
      setTrendType(savedTrend);
    }
    const savedStatus = localStorage.getItem("jdt_chart_status");
    if (savedStatus === "donut" || savedStatus === "bar") {
      setStatusType(savedStatus);
    }
    const savedCategory = localStorage.getItem("jdt_chart_category");
    if (savedCategory === "bar" || savedCategory === "pie") {
      setCategoryType(savedCategory);
    }
    const savedDept = localStorage.getItem("jdt_chart_dept");
    if (savedDept === "horizontal" || savedDept === "vertical") {
      setDeptType(savedDept);
    }
  }, []);

  const changeTrendType = (type: "area" | "line" | "bar") => {
    setTrendType(type);
    try {
      localStorage.setItem("jdt_chart_trend", type);
    } catch {}
  };

  const changeStatusType = (type: "donut" | "bar") => {
    setStatusType(type);
    try {
      localStorage.setItem("jdt_chart_status", type);
    } catch {}
  };

  const changeCategoryType = (type: "bar" | "pie") => {
    setCategoryType(type);
    try {
      localStorage.setItem("jdt_chart_category", type);
    } catch {}
  };

  const changeDeptType = (type: "horizontal" | "vertical") => {
    setDeptType(type);
    try {
      localStorage.setItem("jdt_chart_dept", type);
    } catch {}
  };

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-slate-50 animate-pulse rounded-xl border border-slate-200" />
        <div className="h-80 bg-slate-50 animate-pulse rounded-xl border border-slate-200" />
        <div className="h-80 bg-slate-50 animate-pulse rounded-xl border border-slate-200" />
        <div className="h-80 bg-slate-50 animate-pulse rounded-xl border border-slate-200" />
      </div>
    );
  }

  const { ticketsByStatus, ticketsByCategory, ticketsByDepartment, ticketsTrend } = charts;

  return (
    <div className="space-y-6">
      {/* Hàng 1: Xu hướng tiếp nhận & Trạng thái Ticket */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Xu hướng theo tháng (Area / Line / Bar) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Xu hướng yêu cầu hỗ trợ (12 tháng gần nhất)
              </h3>
              <p className="text-xs text-slate-500">
                So sánh số lượng yêu cầu tiếp nhận và số lượng hoàn thành
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => changeTrendType("area")}
                  className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                    trendType === "area"
                      ? "bg-white text-blue-600 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Biểu đồ diện tích (Area)"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Diện tích</span>
                </button>
                <button
                  type="button"
                  onClick={() => changeTrendType("line")}
                  className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                    trendType === "line"
                      ? "bg-white text-blue-600 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Biểu đồ đường (Line)"
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>Đường</span>
                </button>
                <button
                  type="button"
                  onClick={() => changeTrendType("bar")}
                  className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                    trendType === "bar"
                      ? "bg-white text-blue-600 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Biểu đồ cột đôi (Bar)"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Cột đôi</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs mb-2 pb-1 border-b border-slate-50">
            <span className="inline-flex items-center text-blue-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5" />
              Tiếp nhận
            </span>
            <span className="inline-flex items-center text-emerald-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
              Hoàn thành
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {trendType === "area" ? (
                <AreaChart data={ticketsTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="received"
                    name="Tiếp nhận"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReceived)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Hoàn thành"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                  />
                </AreaChart>
              ) : trendType === "line" ? (
                <LineChart data={ticketsTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="received"
                    name="Tiếp nhận"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="Hoàn thành"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={ticketsTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="received" name="Tiếp nhận" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="completed" name="Hoàn thành" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Trạng thái Ticket (Donut / Bar) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Phân bố trạng thái Ticket
              </h3>
              <p className="text-xs text-slate-500">
                Tỷ lệ xử lý các yêu cầu hỗ trợ
              </p>
            </div>
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => changeStatusType("donut")}
                className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                  statusType === "donut"
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Biểu đồ tròn (Donut)"
              >
                <PieIcon className="h-3.5 w-3.5" />
                <span>Tròn</span>
              </button>
              <button
                type="button"
                onClick={() => changeStatusType("bar")}
                className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                  statusType === "bar"
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Biểu đồ cột (Bar)"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Cột</span>
              </button>
            </div>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              {statusType === "donut" ? (
                <PieChart>
                  <Pie
                    data={ticketsByStatus}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {ticketsByStatus.map((entry, index) => (
                      <Cell key={`status-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} ticket`, name]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  />
                </PieChart>
              ) : (
                <BarChart
                  data={ticketsByStatus}
                  margin={{ top: 15, right: 10, left: -15, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(value: any) => [`${value} yêu cầu`, "Số lượng"]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {ticketsByStatus.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hàng 2: Nhóm sự cố & Top phòng ban */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 3: Nhóm sự cố (Bar / Pie) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Phân loại sự cố kỹ thuật
              </h3>
              <p className="text-xs text-slate-500">
                Số lượng yêu cầu theo từng danh mục sự cố
              </p>
            </div>
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => changeCategoryType("bar")}
                className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                  categoryType === "bar"
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Biểu đồ cột (Bar)"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Cột</span>
              </button>
              <button
                type="button"
                onClick={() => changeCategoryType("pie")}
                className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                  categoryType === "pie"
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Biểu đồ tròn (Pie)"
              >
                <PieIcon className="h-3.5 w-3.5" />
                <span>Tròn</span>
              </button>
            </div>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              {categoryType === "bar" ? (
                <BarChart
                  data={ticketsByCategory}
                  margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(value: any) => [`${value} yêu cầu`, "Số lượng"]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={ticketsByCategory}
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="name"
                  >
                    {ticketsByCategory.map((entry, index) => (
                      <Cell
                        key={`cat-cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} yêu cầu`, name]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: "10px", paddingTop: "6px" }}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 4: Top phòng ban (Horizontal / Vertical Bar) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Top phòng ban phát sinh yêu cầu
              </h3>
              <p className="text-xs text-slate-500">
                Tần suất yêu cầu hỗ trợ theo đơn vị
              </p>
            </div>
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => changeDeptType("horizontal")}
                className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                  deptType === "horizontal"
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Cột ngang"
              >
                <AlignLeft className="h-3.5 w-3.5" />
                <span>Ngang</span>
              </button>
              <button
                type="button"
                onClick={() => changeDeptType("vertical")}
                className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                  deptType === "vertical"
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Cột đứng"
              >
                <BarChart2 className="h-3.5 w-3.5" />
                <span>Đứng</span>
              </button>
            </div>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              {deptType === "horizontal" ? (
                <BarChart
                  layout="vertical"
                  data={ticketsByDepartment}
                  margin={{ top: 10, right: 20, left: 35, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#475569" }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} yêu cầu`, "Số lượng"]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              ) : (
                <BarChart
                  data={ticketsByDepartment}
                  margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(value: any) => [`${value} yêu cầu`, "Số lượng"]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
