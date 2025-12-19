"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { DashboardMetrics } from "@/lib/types";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  UserPlus, 
  RefreshCw,
  ChevronLeft,
  BarChart3,
  Grid3x3,
  Phone,
  Calendar,
  Clock,
  ShoppingBag,
  Target
} from "lucide-react";

type ViewMode = "chart" | "grid";

type DailySales = {
  date: string;
  revenue: number;
};

type RepeatVsNew = {
  repeat: number;
  new: number;
  total: number;
};

type AvgOrderTrend = {
  month: string;
  year: number;
  avgOrderValue: number;
};

type TodayFollowUp = {
  name: string;
  phone: string;
  callTime: string;
};

const Dashboard = ({ onBack }: { onBack: () => void }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [repeatVsNew, setRepeatVsNew] = useState<RepeatVsNew>({ repeat: 0, new: 0, total: 0 });
  const [avgOrderTrend, setAvgOrderTrend] = useState<AvgOrderTrend[]>([]);
  const [todayFollowUps, setTodayFollowUps] = useState<TodayFollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      setIsLoading(true);
      console.log("[Dashboard] Fetching all data...");

      // Fetch main metrics
      const metricsResponse = await fetch("/api/dashboard/metrics");
      if (!metricsResponse.ok) throw new Error("Failed to fetch dashboard metrics");
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Fetch daily sales
      const dailySalesResponse = await fetch("/api/dashboard/daily-sales");
      if (dailySalesResponse.ok) {
        const dailySalesData = await dailySalesResponse.json();
        setDailySales(dailySalesData.dailySales || []);
      }

      // Fetch repeat vs new
      const repeatVsNewResponse = await fetch("/api/dashboard/repeat-vs-new");
      if (repeatVsNewResponse.ok) {
        const repeatVsNewData = await repeatVsNewResponse.json();
        setRepeatVsNew(repeatVsNewData);
      }

      // Fetch avg order trend
      const avgOrderTrendResponse = await fetch("/api/dashboard/avg-order-trend");
      if (avgOrderTrendResponse.ok) {
        const avgOrderTrendData = await avgOrderTrendResponse.json();
        setAvgOrderTrend(avgOrderTrendData.trend || []);
      }

      // Fetch today's follow-ups
      const followUpsResponse = await fetch("/api/dashboard/todays-followups");
      if (followUpsResponse.ok) {
        const followUpsData = await followUpsResponse.json();
        setTodayFollowUps(followUpsData.calls || []);
      }

      setError(null);
    } catch (err: any) {
      console.error("[Dashboard] Error fetching data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }

  const salesData = metrics?.salesTrend || [];
  const topCustomers = metrics?.topCustomers || [];

  const COLORS = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  ];

  const formatCurrency = (value: number): string => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value}`;
  };

  const kpiCards = [
    {
      title: "Total Customers",
      value: metrics?.totalCustomers?.toString() || "0",
      change: "",
      color: "from-blue-500 to-blue-600",
      icon: <Users className="w-5 h-5 text-white" />,
      gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    },
    {
      title: "Total Sales (Revenue)",
      value: formatCurrency(metrics?.totalSales || 0),
      change: "",
      color: "from-green-500 to-green-600",
      icon: <DollarSign className="w-5 h-5 text-white" />,
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
    {
      title: "Sample Expense",
      value: formatCurrency((metrics as any)?.sampleExpense || 0),
      change: "",
      color: "from-orange-500 to-orange-600",
      icon: <ShoppingBag className="w-5 h-5 text-white" />,
      gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    },
    {
      title: "Return Expense",
      value: formatCurrency((metrics as any)?.returnExpense || 0),
      change: "",
      color: "from-red-500 to-red-600",
      icon: <Target className="w-5 h-5 text-white" />,
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    },
    {
      title: "Net Revenue",
      value: formatCurrency((metrics as any)?.netRevenue || 0),
      change: "",
      color: "from-purple-500 to-purple-600",
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    },
    {
      title: "Avg Order Value",
      value: formatCurrency(metrics?.avgOrderValue || 0),
      change: "",
      color: "from-amber-500 to-amber-600",
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    },
  ];

  const repeatVsNewData = [
    { name: "Repeat Customers", value: repeatVsNew.repeat },
    { name: "New Customers", value: repeatVsNew.new },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <ShoppingBag className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="mt-6">
            <h2 className="text-2xl font-semibold text-gray-800">Loading Dashboard</h2>
            <p className="text-gray-500 mt-2">Fetching data from Google Sheets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl">!</span>
              </div>
          </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={fetchAllData}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
          <button
            onClick={onBack}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Go Back
          </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-200"
      >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
              <p className="text-gray-500 text-sm">Real-time insights from your sales data</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchAllData}
            className="px-4 py-2.5 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setViewMode("chart")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === "chart"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Chart View
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === "grid"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              Grid View
          </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                  style={{ background: card.gradient }}
                >
                  {card.icon}
                </div>
                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm font-medium">
                {card.change}
              </span>
            </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-800 mb-1">{card.value}</p>
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mt-4">
            <div
                  className="h-full rounded-full"
              style={{
                    width: `${Math.min(100, 30 + idx * 20)}%`,
                    background: card.gradient,
              }}
                />
            </div>
            </div>
          </div>
        ))}
      </div>

      {viewMode === "chart" ? (
        // Chart View
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Sales Trend */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Monthly Sales Trend</h3>
              <span className="text-sm text-gray-500">Last 6 months</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                />
                <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          </div>

          {/* Daily Sales Trend */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Daily Sales Trend</h3>
              <span className="text-sm text-gray-500">Last 30 days</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="url(#colorRevenue)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Customer Distribution</h3>
              <Target className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                    data={repeatVsNewData}
                    cx="50%"
                    cy="50%"
                  labelLine={false}
                    label={({ name, percent }) => 
                      `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {repeatVsNewData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                        fill={index === 0 ? "#3b82f6" : "#8b5cf6"}
                        stroke="#fff"
                        strokeWidth={2}
                    />
                  ))}
                </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} customers`, 'Count']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
              </PieChart>
            </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Repeat Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-600">New Customers</span>
              </div>
            </div>
          </div>

          {/* Avg Order Value Trend */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Average Order Value Trend</h3>
              <span className="text-sm text-gray-500">Monthly</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={avgOrderTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`₹${value}`, 'Avg Order']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgOrderValue"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Customers Grid */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Top Customers</h3>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-left text-sm font-semibold text-gray-600">Customer</th>
                    <th className="pb-3 text-right text-sm font-semibold text-gray-600">Purchases</th>
                    <th className="pb-3 text-right text-sm font-semibold text-gray-600">Total Value</th>
                </tr>
              </thead>
              <tbody>
                  {topCustomers.slice(0, 8).map((customer, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                            {customer.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800">{customer.name}</span>
                        </div>
                    </td>
                      <td className="py-4 text-right">
                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                          {customer.purchases} orders
                        </span>
                    </td>
                      <td className="py-4 text-right font-semibold text-gray-800">
                        ₹{(customer.total || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>

          {/* Monthly Sales Grid */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Monthly Sales Performance</h3>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-left text-sm font-semibold text-gray-600">Month</th>
                    <th className="pb-3 text-right text-sm font-semibold text-gray-600">Sales Count</th>
                    <th className="pb-3 text-right text-sm font-semibold text-gray-600">Revenue</th>
                    <th className="pb-3 text-right text-sm font-semibold text-gray-600">Growth</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((data, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-4 font-medium text-gray-800">{data.month}</td>
                      <td className="py-4 text-right">
                        <span className="font-medium">{data.sales}</span>
                    </td>
                      <td className="py-4 text-right font-semibold text-green-600">
                        ₹{(data.revenue || 0).toLocaleString()}
                    </td>
                      <td className="py-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          idx > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {idx > 0 ? '+12%' : '-'}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* Follow-Up Calls Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-500" />
              Follow-Up Calls Due Today
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {todayFollowUps.length} calls scheduled for today
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
        {todayFollowUps.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">No calls scheduled</h4>
            <p className="text-gray-500">All follow-up calls are completed for today</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayFollowUps.map((call, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-gray-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                      {call.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{call.name}</h4>
                      <p className="text-sm text-gray-500">{call.phone}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                    {call.callTime}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                    Mark as Called
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                    Reschedule
                  </button>
          </div>
              </div>
            ))}
        </div>
      )}
      </div>

      {/* Footer Stats */}
      <div className="text-center text-sm text-gray-500 mt-8 pt-6 border-t border-gray-200">
        <p>
          Data last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {" • "}
          Connected to Google Sheets
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
