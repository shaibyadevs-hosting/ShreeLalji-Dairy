"use client";

import React, { useState, useEffect, JSX } from "react";
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
  Calendar,
  Clock,
  ShoppingBag,
  Target,
  Truck,
  Award,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  UserCheck,
  Repeat,
  Gift,
  RotateCcw,
  Crown,
  CalendarDays,
  ExternalLink,
  Wallet
} from "lucide-react";

type ViewMode = "chart" | "grid" | "delivery" | "customers";

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
  normalizedShopName: string;
  callTime: string;
  callDate: string;
  notes?: string;
};

type DeliveryPersonSummary = {
  deliveryPerson: string;
  totalOrders: number;
  totalSaleAmount: number;
  totalCashAmount: number;
};

type DeliverySummaryData = {
  summary: DeliveryPersonSummary[];
  totals: {
    totalOrders: number;
    totalSaleAmount: number;
    totalCashAmount: number;
  };
  topPerformer: string | null;
  count: number;
};

type CustomerRecord = {
  shopName: string;
  normalizedShopName?: string;
  totalSale: number;
  visitCount: number;
  sampleQty: number;
  sampleAmount: number;
  returnQty: number;
  returnAmount: number;
  dates: string[];
  address?: string;
};

type CustomerInsightsData = {
  dateWiseCustomers: CustomerRecord[];
  newCustomers: CustomerRecord[];
  repeatCustomers: {
    twoTimes: CustomerRecord[];
    threeTimes: CustomerRecord[];
    fourPlusTimes: CustomerRecord[];
  };
  sampleCustomers: CustomerRecord[];
  returnCustomers: CustomerRecord[];
  topBuyers: CustomerRecord[];
  selectedDate: string;
  totalCustomersAllTime: number;
  totalReturnQty?: number;
};

type RepeatFilter = "2x" | "3x" | "4+";

// Today's Delivery List Types
type DeliveryShop = {
  shopName: string;
  normalizedShopName?: string;
  address: string;
  saleQty: number;
  saleAmount: number;
};

type DeliveryPersonGroup = {
  deliveryPerson: string;
  shops: DeliveryShop[];
  totalShops: number;
  totalSaleAmount: number;
};

type TodayDeliveryListData = {
  deliveryGroups: DeliveryPersonGroup[];
  totalDeliveryPersons: number;
  totalShops: number;
  date: string;
  shift: string;
  message?: string;
};

const Dashboard = ({ onBack }: { onBack: () => void }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [repeatVsNew, setRepeatVsNew] = useState<RepeatVsNew>({ repeat: 0, new: 0, total: 0 });
  const [avgOrderTrend, setAvgOrderTrend] = useState<AvgOrderTrend[]>([]);
  const [todayFollowUps, setTodayFollowUps] = useState<TodayFollowUp[]>([]);
  const [markingCallId, setMarkingCallId] = useState<string | null>(null);
  const [deliverySummary, setDeliverySummary] = useState<DeliverySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Main dashboard date filter
  const [dashboardStartDate, setDashboardStartDate] = useState<string>(""); // DD-MM-YYYY
  const [dashboardEndDate, setDashboardEndDate] = useState<string>(""); // DD-MM-YYYY
  const [dashboardDateLabel, setDashboardDateLabel] = useState<string>("All Time");

  const updateDateLabel = (start: string, end: string) => {
    if (start && end) {
      setDashboardDateLabel(`${start} to ${end}`);
    } else if (start) {
      setDashboardDateLabel(`From ${start}`);
    } else {
      setDashboardDateLabel("All Time");
    }
  };

  // Delivery view filters and sorting
  const [deliverySearch, setDeliverySearch] = useState("");
  const [deliverySortBy, setDeliverySortBy] = useState<"name" | "orders" | "sale" | "cash">("orders");
  const [deliverySortOrder, setDeliverySortOrder] = useState<"asc" | "desc">("desc");
  const [deliveryFilterMin, setDeliveryFilterMin] = useState<number | "">("");

  // Customer Insights state
  const [customerInsights, setCustomerInsights] = useState<CustomerInsightsData | null>(null);
  const [customerInsightsLoading, setCustomerInsightsLoading] = useState(false);
  const [customerSelectedDate, setCustomerSelectedDate] = useState<string>(() => {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
  });
  const [repeatFilter, setRepeatFilter] = useState<RepeatFilter>("2x");
  const [customerSearch, setCustomerSearch] = useState("");

  // Today's Delivery List state
  const [todayDeliveryList, setTodayDeliveryList] = useState<TodayDeliveryListData | null>(null);
  const [deliveryListLoading, setDeliveryListLoading] = useState(false);
  const [deliveryListDate, setDeliveryListDate] = useState<string>(() => {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
  });
  const [deliveryListShift, setDeliveryListShift] = useState<"Morning" | "Evening">("Morning");
  const [deliveryListSearch, setDeliveryListSearch] = useState("");
  const [expandedDeliveryPersons, setExpandedDeliveryPersons] = useState<Set<string>>(new Set());
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  // Refetch metrics when date range changes
  useEffect(() => {
    fetchMetricsWithDateRange(dashboardStartDate, dashboardEndDate);
  }, [dashboardStartDate, dashboardEndDate]);

  async function fetchMetricsWithDateRange(startDate: string, endDate: string) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("_", Date.now().toString()); // bust cache
      const url = params.toString() 
        ? `/api/dashboard/metrics?${params.toString()}` 
        : "/api/dashboard/metrics";
      const metricsResponse = await fetch(url, { cache: "no-store" });
      if (!metricsResponse.ok) throw new Error("Failed to fetch dashboard metrics");
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);
    } catch (err: any) {
      console.error("[Dashboard] Error fetching metrics:", err);
    }
  }

  async function fetchAllData() {
    try {
      setIsLoading(true);
      console.log("[Dashboard] Fetching all data...");

      // Fetch main metrics
      const metricsParams = new URLSearchParams();
      if (dashboardStartDate) metricsParams.set("startDate", dashboardStartDate);
      if (dashboardEndDate) metricsParams.set("endDate", dashboardEndDate);
      metricsParams.set("_", Date.now().toString()); // bust cache
      const metricsUrl = metricsParams.toString()
        ? `/api/dashboard/metrics?${metricsParams.toString()}`
        : "/api/dashboard/metrics";
      const metricsResponse = await fetch(metricsUrl, { cache: "no-store" });
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

      // Fetch delivery person summary
      const deliverySummaryResponse = await fetch("/api/dashboard/delivery-summary");
      if (deliverySummaryResponse.ok) {
        const deliverySummaryData = await deliverySummaryResponse.json();
        setDeliverySummary(deliverySummaryData);
      }

      setError(null);
    } catch (err: any) {
      console.error("[Dashboard] Error fetching data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch customer insights data
  async function fetchCustomerInsights(date?: string) {
    try {
      setCustomerInsightsLoading(true);
      const dateParam = date || customerSelectedDate;
      console.log("[Dashboard] Fetching customer insights for date:", dateParam);
      const response = await fetch(`/api/dashboard/customer-insights?date=${encodeURIComponent(dateParam)}`);
      if (response.ok) {
        const data = await response.json();
        console.log("[Dashboard] Customer insights received:", data);
        setCustomerInsights(data);
      }
    } catch (err) {
      console.error("[Dashboard] Error fetching customer insights:", err);
    } finally {
      setCustomerInsightsLoading(false);
    }
  }

  // Fetch customer insights when switching to customers view or date changes
  useEffect(() => {
    if (viewMode === "customers") {
      fetchCustomerInsights(customerSelectedDate);
    }
  }, [viewMode, customerSelectedDate]);

  // Fetch Today's Delivery List
  async function fetchTodayDeliveryList(date?: string, shift?: string) {
    try {
      setDeliveryListLoading(true);
      const dateParam = date || deliveryListDate;
      const shiftParam = shift || deliveryListShift;
      const response = await fetch(`/api/dashboard/delivery-list?date=${dateParam}&shift=${shiftParam}`);
      if (response.ok) {
        const data = await response.json();
        setTodayDeliveryList(data);
        // Expand all delivery persons by default
        if (data.deliveryGroups) {
          setExpandedDeliveryPersons(new Set(data.deliveryGroups.map((g: DeliveryPersonGroup) => g.deliveryPerson)));
        }
      }
    } catch (err) {
      console.error("[Dashboard] Error fetching today's delivery list:", err);
    } finally {
      setDeliveryListLoading(false);
    }
  }

  // Fetch delivery list when switching to delivery view or when date/shift changes
  useEffect(() => {
    if (viewMode === "delivery") {
      fetchTodayDeliveryList(deliveryListDate, deliveryListShift);
    }
  }, [viewMode, deliveryListDate, deliveryListShift]);

  // Toggle expand/collapse for delivery person
  const toggleDeliveryPersonExpand = (deliveryPerson: string) => {
    setExpandedDeliveryPersons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deliveryPerson)) {
        newSet.delete(deliveryPerson);
      } else {
        newSet.add(deliveryPerson);
      }
      return newSet;
    });
  };

  // Filtered delivery list data
  const filteredDeliveryListData = React.useMemo(() => {
    if (!todayDeliveryList?.deliveryGroups) return [];
    
    if (!deliveryListSearch.trim()) return todayDeliveryList.deliveryGroups;
    
    const search = deliveryListSearch.toLowerCase();
    return todayDeliveryList.deliveryGroups
      .map(group => ({
        ...group,
        shops: group.shops.filter(shop => 
          shop.shopName.toLowerCase().includes(search) ||
          shop.address.toLowerCase().includes(search)
        )
      }))
      .filter(group => group.shops.length > 0 || group.deliveryPerson.toLowerCase().includes(search));
  }, [todayDeliveryList, deliveryListSearch]);

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

  const kpiCards: Array<{
    title: string;
    value: string;
    change: string;
    color: string;
    icon: JSX.Element;
    gradient: string;
    onClick?: () => void;
  }> = [
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
      value: formatCurrency(metrics?.sampleExpense || 0),
      change: "",
      color: "from-orange-500 to-orange-600",
      icon: <ShoppingBag className="w-5 h-5 text-white" />,
      gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    },
    {
      title: "Return Expense",
      value: formatCurrency(metrics?.returnExpense || 0),
      change: "",
      color: "from-red-500 to-red-600",
      icon: <Target className="w-5 h-5 text-white" />,
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(metrics?.totalExpenses || 0),
      change: "",
      color: "from-amber-500 to-amber-600",
      icon: <Wallet className="w-5 h-5 text-white" />,
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      onClick: () => setShowExpenseBreakdown((prev) => !prev),
    },
    {
      title: "Net Revenue",
      value: formatCurrency(metrics?.netRevenue || 0),
      change: "",
      color: "from-purple-500 to-purple-600",
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    },
  ];

  const repeatVsNewData = [
    { name: "Repeat Customers", value: repeatVsNew.repeat },
    { name: "New Customers", value: repeatVsNew.new },
  ];

  // Filtered and sorted delivery data
  const filteredDeliveryData = React.useMemo(() => {
    if (!deliverySummary?.summary) return [];
    
    let data = [...deliverySummary.summary];
    
    // Apply search filter
    if (deliverySearch.trim()) {
      data = data.filter(person => 
        person.deliveryPerson.toLowerCase().includes(deliverySearch.toLowerCase())
      );
    }
    
    // Apply minimum orders filter
    if (deliveryFilterMin !== "" && deliveryFilterMin > 0) {
      data = data.filter(person => person.totalOrders >= deliveryFilterMin);
    }
    
    // Apply sorting
    data.sort((a, b) => {
      let comparison = 0;
      switch (deliverySortBy) {
        case "name":
          comparison = a.deliveryPerson.localeCompare(b.deliveryPerson);
          break;
        case "orders":
          comparison = a.totalOrders - b.totalOrders;
          break;
        case "sale":
          comparison = a.totalSaleAmount - b.totalSaleAmount;
          break;
        case "cash":
          comparison = a.totalCashAmount - b.totalCashAmount;
          break;
      }
      return deliverySortOrder === "desc" ? -comparison : comparison;
    });
    
    return data;
  }, [deliverySummary, deliverySearch, deliverySortBy, deliverySortOrder, deliveryFilterMin]);

  const handleDeliverySort = (column: "name" | "orders" | "sale" | "cash") => {
    if (deliverySortBy === column) {
      setDeliverySortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setDeliverySortBy(column);
      setDeliverySortOrder("desc");
    }
  };

  const getSortIcon = (column: "name" | "orders" | "sale" | "cash") => {
    if (deliverySortBy !== column) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return deliverySortOrder === "desc" 
      ? <ArrowDown className="w-4 h-4 text-blue-600" />
      : <ArrowUp className="w-4 h-4 text-blue-600" />;
  };

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
          {/* Date Filter */}
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-1.5">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dashboardStartDate ? `${dashboardStartDate.split('-')[2]}-${dashboardStartDate.split('-')[1]}-${dashboardStartDate.split('-')[0]}` : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  const [year, month, day] = val.split('-');
                  const formatted = `${day}-${month}-${year}`;
                  setDashboardStartDate(formatted);
                  updateDateLabel(formatted, dashboardEndDate);
                } else {
                  setDashboardStartDate("");
                  updateDateLabel("", dashboardEndDate);
                }
              }}
              className="border-none outline-none text-sm text-gray-700 bg-transparent w-32"
              aria-label="Start date"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={dashboardEndDate ? `${dashboardEndDate.split('-')[2]}-${dashboardEndDate.split('-')[1]}-${dashboardEndDate.split('-')[0]}` : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  const [year, month, day] = val.split('-');
                  const formatted = `${day}-${month}-${year}`;
                  setDashboardEndDate(formatted);
                  updateDateLabel(dashboardStartDate, formatted);
                } else {
                  setDashboardEndDate("");
                  updateDateLabel(dashboardStartDate, "");
                }
              }}
              className="border-none outline-none text-sm text-gray-700 bg-transparent w-32"
              aria-label="End date"
            />
            {(dashboardStartDate || dashboardEndDate) && (
              <button
                onClick={() => {
                  setDashboardStartDate("");
                  setDashboardEndDate("");
                  updateDateLabel("", "");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          <span className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
            {dashboardDateLabel}
          </span>
          <button
            onClick={fetchAllData}
            className="px-4 py-2.5 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
          <button
            onClick={() => window.open('https://docs.google.com/spreadsheets/d/1OwmfDCO3AGBnHlViha2FPRySaGLPDPle106T0p3W-RA/edit?usp=sharing', '_blank')}
            className="px-4 py-2.5 bg-green-600 rounded-lg shadow-sm hover:shadow-md transition-all text-white font-medium flex items-center gap-2 hover:bg-green-700"
          >
            <ExternalLink className="w-4 h-4" />
            View Sheets
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
              onClick={() => setViewMode("delivery")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === "delivery"
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Truck className="w-4 h-4" />
              Delivery
            </button>
            <button
              onClick={() => setViewMode("customers")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === "customers"
                  ? "bg-purple-50 text-purple-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Customers
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards - Hide in Delivery and Customers view */}
      {viewMode !== "delivery" && viewMode !== "customers" && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300 ${card.onClick ? "cursor-pointer" : ""}`}
            onClick={card.onClick}
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
      )}

      {showExpenseBreakdown && viewMode !== "delivery" && viewMode !== "customers" && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Date-wise Expenses</h3>
              <p className="text-sm text-gray-500">Tap Total Expenses card again to hide</p>
            </div>
            <button
              onClick={() => setShowExpenseBreakdown(false)}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Close
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Expenses</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Raw Material</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Electricity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Labor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Godown Rent</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Petrol/Fuel</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {(metrics?.expenseByDate || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-sm text-gray-500 text-center">No expense data found</td>
                  </tr>
                ) : (
                  (metrics?.expenseByDate || []).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-800">{row.date}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900">{formatCurrency(row.totalExpenses || 0)}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{formatCurrency(row.rawMaterial || 0)}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{formatCurrency(row.electricity || 0)}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{formatCurrency(row.labor || 0)}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{formatCurrency(row.godownRent || 0)}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{formatCurrency(row.petrolFuel || 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      

      {/* Delivery View - Full dedicated section */}
      {viewMode === "delivery" && (
        <div className="mb-6">
          {/* Delivery Summary Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  Delivery Person Analytics
                </h2>
                <p className="text-gray-500 mt-1">
                  {deliverySummary?.count || 0} delivery persons tracked • 
                  {filteredDeliveryData.length} showing
                </p>
              </div>
              {deliverySummary?.topPerformer && (
                <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-700 rounded-xl border border-amber-200">
                  <Award className="w-5 h-5" />
                  <span className="font-semibold">Top Performer: {deliverySummary.topPerformer}</span>
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-5 border border-indigo-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600 font-medium">Total Orders</p>
                    <p className="text-3xl font-bold text-indigo-800">{(deliverySummary?.totals.totalOrders || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Sales</p>
                    <p className="text-3xl font-bold text-green-800">₹{(deliverySummary?.totals.totalSaleAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Cash Collected</p>
                    <p className="text-3xl font-bold text-blue-800">₹{(deliverySummary?.totals.totalCashAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search, Sort, Filter Controls */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Delivery Person</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Type name to search..."
                    value={deliverySearch}
                    onChange={(e) => setDeliverySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              
              {/* Sort By */}
              <div className="w-full lg:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={deliverySortBy}
                  onChange={(e) => setDeliverySortBy(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="orders">Total Orders</option>
                  <option value="sale">Total Sale</option>
                  <option value="cash">Total Cash</option>
                  <option value="name">Name</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="w-full lg:w-40">
                <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                <select
                  value={deliverySortOrder}
                  onChange={(e) => setDeliverySortOrder(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="desc">High to Low</option>
                  <option value="asc">Low to High</option>
                </select>
              </div>

              {/* Min Orders Filter */}
              <div className="w-full lg:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Orders</label>
                <input
                  type="number"
                  placeholder="Filter by min orders"
                  value={deliveryFilterMin}
                  onChange={(e) => setDeliveryFilterMin(e.target.value ? parseInt(e.target.value) : "")}
                  min={0}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Clear Filters */}
              <div className="w-full lg:w-auto flex items-end">
                <button
                  onClick={() => {
                    setDeliverySearch("");
                    setDeliverySortBy("orders");
                    setDeliverySortOrder("desc");
                    setDeliveryFilterMin("");
                  }}
                  className="w-full lg:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Persons Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {filteredDeliveryData.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-10 h-10 text-gray-400" />
                </div>
                <h4 className="text-xl font-medium text-gray-600 mb-2">No delivery persons found</h4>
                <p className="text-gray-500">
                  {deliverySearch || deliveryFilterMin ? "Try adjusting your search or filters" : "Delivery data will appear after saving bills"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Rank</th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleDeliverySort("name")}
                      >
                        <div className="flex items-center gap-2">
                          Delivery Person
                          {getSortIcon("name")}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-right text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleDeliverySort("orders")}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Total Orders
                          {getSortIcon("orders")}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-right text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleDeliverySort("sale")}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Total Sale
                          {getSortIcon("sale")}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-right text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleDeliverySort("cash")}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Total Cash
                          {getSortIcon("cash")}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Collection %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDeliveryData.map((person, idx) => {
                      const collectionPercent = person.totalSaleAmount > 0 
                        ? Math.round((person.totalCashAmount / person.totalSaleAmount) * 100) 
                        : 0;
                      const originalRank = deliverySummary?.summary.findIndex(p => p.deliveryPerson === person.deliveryPerson) || 0;
                      
                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-5">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ${
                              originalRank === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                              originalRank === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                              originalRank === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                              'bg-gradient-to-r from-indigo-400 to-indigo-500'
                            }`}>
                              {originalRank + 1}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-semibold shadow-md">
                                {person.deliveryPerson.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800 text-lg">{person.deliveryPerson}</span>
                                {originalRank === 0 && (
                                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                                    🏆 Top Performer
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className="inline-block px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold">
                              {person.totalOrders} orders
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className="text-lg font-bold text-green-600">
                              ₹{person.totalSaleAmount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className="text-lg font-bold text-blue-600">
                              ₹{person.totalCashAmount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    collectionPercent >= 80 ? 'bg-green-500' :
                                    collectionPercent >= 50 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${collectionPercent}%` }}
                                />
                              </div>
                              <span className={`font-semibold ${
                                collectionPercent >= 80 ? 'text-green-600' :
                                collectionPercent >= 50 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {collectionPercent}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Today's Delivery List Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mt-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  Today&apos;s Delivery List
                </h2>
                <p className="text-gray-500 mt-1">Operational delivery execution for selected date/shift</p>
              </div>
            </div>

            {/* Date and Shift Selector */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date (DD-MM-YYYY)</label>
                <input
                  type="text"
                  placeholder="DD-MM-YYYY"
                  value={deliveryListDate}
                  onChange={(e) => setDeliveryListDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>
              <div className="w-full sm:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
                <select
                  value={deliveryListShift}
                  onChange={(e) => setDeliveryListShift(e.target.value as "Morning" | "Evening")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Shop/Address</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={deliveryListSearch}
                    onChange={(e) => setDeliveryListSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>
              <div className="w-full sm:w-auto flex items-end">
                <button
                  onClick={() => fetchTodayDeliveryList()}
                  disabled={deliveryListLoading}
                  className="w-full sm:w-auto px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${deliveryListLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            {todayDeliveryList && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-teal-600 font-medium">Delivery Persons</p>
                      <p className="text-2xl font-bold text-teal-800">{todayDeliveryList.totalDeliveryPersons}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-cyan-600 font-medium">Total Shops</p>
                      <p className="text-2xl font-bold text-cyan-800">{todayDeliveryList.totalShops}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Date / Shift</p>
                      <p className="text-lg font-bold text-blue-800">{todayDeliveryList.date} - {todayDeliveryList.shift}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {deliveryListLoading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading delivery list...</p>
              </div>
            )}

            {/* Empty State */}
            {!deliveryListLoading && (!filteredDeliveryListData || filteredDeliveryListData.length === 0) && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-10 h-10 text-gray-400" />
                </div>
                <h4 className="text-xl font-medium text-gray-600 mb-2">No deliveries found</h4>
                <p className="text-gray-500">
                  {todayDeliveryList?.message || `No delivery data for ${deliveryListDate} ${deliveryListShift}`}
                </p>
              </div>
            )}

            {/* Delivery Person Groups */}
            {!deliveryListLoading && filteredDeliveryListData && filteredDeliveryListData.length > 0 && (
              <div className="space-y-4">
                {filteredDeliveryListData.map((group, groupIdx) => (
                  <div key={groupIdx} className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* Delivery Person Header */}
                    <button
                      onClick={() => toggleDeliveryPersonExpand(group.deliveryPerson)}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white text-lg font-semibold shadow-md">
                          {group.deliveryPerson.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-800 text-lg">{group.deliveryPerson}</h3>
                          <p className="text-sm text-gray-500">
                            {group.totalShops} shop{group.totalShops !== 1 ? 's' : ''} • ₹{group.totalSaleAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                          {group.totalShops} deliveries
                        </span>
                        <ChevronLeft className={`w-5 h-5 text-gray-400 transition-transform ${expandedDeliveryPersons.has(group.deliveryPerson) ? '-rotate-90' : 'rotate-0'}`} />
                      </div>
                    </button>

                    {/* Shop List (Expandable) */}
                    {expandedDeliveryPersons.has(group.deliveryPerson) && (
                      <div className="divide-y divide-gray-100">
                        {group.shops.map((shop, shopIdx) => (
                          <div key={shopIdx} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold flex items-center justify-center">
                                    {shopIdx + 1}
                                  </span>
                                  <h4 className="font-semibold text-gray-800">{shop.shopName}</h4>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 ml-8">
                                  {shop.address && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-gray-400">📍</span>
                                      {shop.address}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 ml-8 sm:ml-0">
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                                  {shop.saleQty} qty
                                </span>
                                <span className="font-semibold text-green-600">
                                  ₹{shop.saleAmount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Follow-Up Calls Section - Hide in Delivery and Customers view */}
      {viewMode !== "delivery" && viewMode !== "customers" && (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
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
              <Calendar className="w-8 h-8 text-gray-400" />
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
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                    {call.callTime}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      try {
                        setMarkingCallId(`${call.name}-${call.callDate}`);
                        const response = await fetch("/api/followups/status", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            shopName: call.name,
                            callDate: call.callDate,
                          }),
                        });
                        
                        if (response.ok) {
                          // Remove from the list
                          setTodayFollowUps(prev => prev.filter(c => 
                            !(c.name === call.name && c.callDate === call.callDate)
                          ));
                        } else {
                          const error = await response.json();
                          alert("Failed to mark as called: " + (error.error || "Unknown error"));
                        }
                      } catch (err: any) {
                        console.error("Error marking call:", err);
                        alert("Error: " + (err.message || "Unknown error"));
                      } finally {
                        setMarkingCallId(null);
                      }
                    }}
                    disabled={markingCallId === `${call.name}-${call.callDate}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {markingCallId === `${call.name}-${call.callDate}` ? "Marking..." : "Mark as Called"}
                  </button>
                  <button 
                    onClick={() => {
                      const newDate = prompt("Enter new date (DD-MM-YYYY):", call.callDate);
                      if (newDate && newDate !== call.callDate) {
                        // For now, just show an alert - can implement reschedule API later
                        alert("Reschedule feature coming soon. Please use the Follow-ups page to reschedule.");
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    Reschedule
                  </button>
          </div>
              </div>
            ))}
        </div>
      )}
      </div>
      )}

      {/* Customer Insights View */}
      {viewMode === "customers" && (
        <div className="space-y-6">
          {/* Header with Date Picker */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <UserCheck className="w-7 h-7 text-purple-500" />
                  Customer Insights
                </h3>
                <p className="text-gray-500 mt-1">
                  Total Customers (All Time): <span className="font-semibold text-gray-700">{customerInsights?.totalCustomersAllTime || 0}</span>
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customer..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                {/* Date Picker */}
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={customerSelectedDate.split('-').reverse().join('-')}
                    onChange={(e) => {
                      const [year, month, day] = e.target.value.split('-');
                      const newDate = `${day}-${month}-${year}`;
                      console.log("[Dashboard] Date changed from", customerSelectedDate, "to", newDate);
                      setCustomerSelectedDate(newDate);
                    }}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {customerInsightsLoading ? (
            <div className="bg-white rounded-xl shadow-lg p-16 border border-gray-100 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading customer insights...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                  <CalendarDays className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-sm opacity-80">Date-wise</p>
                  <p className="text-2xl font-bold">{customerInsights?.dateWiseCustomers?.length || 0}</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                  <UserPlus className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-sm opacity-80">New Today</p>
                  <p className="text-2xl font-bold">{customerInsights?.newCustomers?.length || 0}</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                  <Repeat className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-sm opacity-80">Repeat</p>
                  <p className="text-2xl font-bold">
                    {((customerInsights?.repeatCustomers?.twoTimes?.length || 0) +
                      (customerInsights?.repeatCustomers?.threeTimes?.length || 0) +
                      (customerInsights?.repeatCustomers?.fourPlusTimes?.length || 0))}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                  <Gift className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-sm opacity-80">Sample</p>
                  <p className="text-2xl font-bold">{customerInsights?.sampleCustomers?.length || 0}</p>
                </div>
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white">
                  <RotateCcw className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-sm opacity-80">Returns</p>
                  <p className="text-2xl font-bold">
                    {customerInsights?.totalReturnQty ?? (customerInsights?.returnCustomers || []).reduce((sum, c) => sum + (c.returnQty || 0), 0)}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-4 text-white">
                  <Crown className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-sm opacity-80">Top Buyers</p>
                  <p className="text-2xl font-bold">{customerInsights?.topBuyers?.length || 0}</p>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Date-wise Customers */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-blue-500" />
                      Date-wise Customers ({customerSelectedDate})
                    </h4>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {(customerInsights?.dateWiseCustomers || [])
                      .filter(c => customerSearch === "" || c.shopName.toLowerCase().includes(customerSearch.toLowerCase()))
                      .length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        No customers found for this date
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {(customerInsights?.dateWiseCustomers || [])
                          .filter(c => customerSearch === "" || c.shopName.toLowerCase().includes(customerSearch.toLowerCase()))
                          .map((customer, idx) => (
                          <div key={idx} className="px-6 py-3 hover:bg-gray-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                                {customer.shopName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{customer.shopName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">₹{customer.totalSale.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* New Customers (Daily) */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-green-500" />
                      New Customers Today
                    </h4>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {(customerInsights?.newCustomers || [])
                      .filter(c => customerSearch === "" || c.shopName.toLowerCase().includes(customerSearch.toLowerCase()))
                      .length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        No new customers today
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {(customerInsights?.newCustomers || [])
                          .filter(c => customerSearch === "" || c.shopName.toLowerCase().includes(customerSearch.toLowerCase()))
                          .map((customer, idx) => (
                          <div key={idx} className="px-6 py-3 hover:bg-gray-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                                {customer.shopName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{customer.shopName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">₹{customer.totalSale.toLocaleString()}</p>
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">NEW</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Repeat Customers */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Repeat className="w-5 h-5 text-purple-500" />
                        Repeat Customers
                      </h4>
                      <div className="flex gap-2">
                        {(["2x", "3x", "4+"] as RepeatFilter[]).map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setRepeatFilter(filter)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              repeatFilter === filter
                                ? "bg-purple-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {(() => {
                      const repeatData = repeatFilter === "2x" 
                        ? customerInsights?.repeatCustomers?.twoTimes 
                        : repeatFilter === "3x" 
                          ? customerInsights?.repeatCustomers?.threeTimes 
                          : customerInsights?.repeatCustomers?.fourPlusTimes;
                      
                      const filtered = (repeatData || []).filter(c => 
                        customerSearch === "" || c.shopName.toLowerCase().includes(customerSearch.toLowerCase())
                      );
                      
                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-10 text-gray-500">
                            No {repeatFilter} repeat customers found
                          </div>
                        );
                      }
                      
                      return (
                        <div className="divide-y divide-gray-100">
                          {filtered.map((customer, idx) => (
                            <div key={idx} className="px-6 py-3 hover:bg-gray-50 flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                                  {customer.shopName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800">{customer.shopName}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-purple-600">₹{customer.totalSale.toLocaleString()}</p>
                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                  {customer.visitCount}x visits
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Sample Customers */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Gift className="w-5 h-5 text-orange-500" />
                      Sample Customers ({customerSelectedDate})
                    </h4>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {(customerInsights?.sampleCustomers || [])
                      .filter(c => customerSearch === "" || c.shopName.toLowerCase().includes(customerSearch.toLowerCase()))
                      .length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        No sample customers found
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {(customerInsights?.sampleCustomers || [])
                          .filter(c => customerSearch === "" || c.shopName.toLowerCase().includes(customerSearch.toLowerCase()))
                          .map((customer, idx) => (
                          <div key={idx} className="px-6 py-3 hover:bg-gray-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
                                {customer.shopName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{customer.shopName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {customer.sampleQty > 0 && (
                                <p className="font-semibold text-orange-600">{customer.sampleQty} samples</p>
                              )}
                              {customer.sampleAmount > 0 && (
                                <p className="text-sm text-orange-500">₹{customer.sampleAmount.toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Returns List */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-red-500" />
                      Returns ({customerSelectedDate})
                    </h4>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {(customerInsights?.returnCustomers || [])
                      .filter(c => customerSearch === "" || c.shopName.toLowerCase().includes(customerSearch.toLowerCase()))
                      .length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        No returns found
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {(customerInsights?.returnCustomers || [])
                          .filter(c => customerSearch === "" || c.shopName.toLowerCase().includes(customerSearch.toLowerCase()))
                          .map((customer, idx) => (
                          <div key={idx} className="px-6 py-3 hover:bg-gray-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">
                                {customer.shopName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{customer.shopName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {customer.returnQty > 0 && (
                                <p className="font-semibold text-red-600">{customer.returnQty} returns</p>
                              )}
                              {customer.returnAmount > 0 && (
                                <p className="text-sm text-red-500">₹{customer.returnAmount.toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Buyers */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-500" />
                      Top Buyers ({customerSelectedDate})
                    </h4>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {(customerInsights?.topBuyers || [])
                      .filter(c => customerSearch === "" || c.shopName.toLowerCase().includes(customerSearch.toLowerCase()))
                      .length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        No top buyers found
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {(customerInsights?.topBuyers || [])
                          .filter(c => customerSearch === "" || c.shopName.toLowerCase().includes(customerSearch.toLowerCase()))
                          .map((customer, idx) => (
                          <div key={idx} className="px-6 py-3 hover:bg-gray-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                                idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                                idx === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                                'bg-gradient-to-r from-amber-400 to-amber-500'
                              }`}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{customer.shopName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-amber-600">₹{customer.totalSale.toLocaleString()}</p>
                              <span className="text-xs text-gray-500">{customer.visitCount} visits</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

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
