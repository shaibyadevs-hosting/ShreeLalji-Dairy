// components/Dashboard.tsx
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
} from "recharts";
import { DashboardMetrics } from "@/lib/types";

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

  const COLORS = ["#1f6feb", "#0ea5e9", "#06b6d4", "#10b981", "#f59e0b"];

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
      change: "+12%",
      color: "bg-blue-50",
      icon: "👥",
    },
    {
      title: "Total Sales",
      value: formatCurrency(metrics?.totalSales || 0),
      change: "+8%",
      color: "bg-green-50",
      icon: "📊",
    },
    {
      title: "New Customers",
      value: metrics?.newCustomers?.toString() || "0",
      change: "+25%",
      color: "bg-purple-50",
      icon: "✨",
    },
    {
      title: "Avg Order Value",
      value: formatCurrency(metrics?.avgOrderValue || 0),
      change: "+3%",
      color: "bg-orange-50",
      icon: "💰",
    },
  ];

  // Prepare repeat vs new data for donut chart
  const repeatVsNewData = [
    { name: "Repeat Customers", value: repeatVsNew.repeat },
    { name: "New Customers", value: repeatVsNew.new },
  ];

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          padding: "20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
          <div style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937" }}>
            Loading Dashboard...
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>
            Fetching data from Google Sheets
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ minHeight: "100vh", background: "#f3f4f6", padding: "20px" }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            marginTop: "100px",
            background: "#fff",
            padding: "40px",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#ef4444",
              marginBottom: "12px",
            }}
          >
            Error Loading Dashboard
          </div>
          <div
            style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}
          >
            {error}
          </div>
          <button
            onClick={onBack}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              background: "#1f6feb",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "20px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "28px", fontWeight: 700 }}>Dashboard</h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={fetchAllData}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 500,
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            🔄 Refresh
          </button>
          <div
            style={{
              display: "flex",
              gap: "8px",
              background: "#fff",
              padding: "6px",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
            }}
          >
            <button
              onClick={() => setViewMode("chart")}
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                border: "none",
                background: viewMode === "chart" ? "#1f6feb" : "transparent",
                color: viewMode === "chart" ? "#fff" : "#6b7280",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              📈 Chart
            </button>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                border: "none",
                background: viewMode === "grid" ? "#1f6feb" : "transparent",
                color: viewMode === "grid" ? "#fff" : "#6b7280",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              📋 Grid
            </button>
          </div>
          <button
            onClick={onBack}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 500,
              color: "#1f6feb",
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {kpiCards.map((card, idx) => (
          <div
            key={idx}
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "12px",
              }}
            >
              <div style={{ fontSize: "24px" }}>{card.icon}</div>
              <span
                style={{
                  fontSize: "12px",
                  color: "#10b981",
                  fontWeight: 600,
                  background: "#f0fdf4",
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
              >
                {card.change}
              </span>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "6px",
              }}
            >
              {card.title}
            </div>
            <div
              style={{ fontSize: "24px", fontWeight: 700, color: "#1f2937" }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {viewMode === "chart" ? (
        // Chart View
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          {/* Monthly Sales Trend */}
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              Monthly Sales (Last 6 Months)
            </h3>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='month' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='sales'
                  stroke='#1f6feb'
                  strokeWidth={2}
                  name='Sales'
                />
                <Line
                  type='monotone'
                  dataKey='revenue'
                  stroke='#10b981'
                  strokeWidth={2}
                  name='Revenue'
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Sales Trend (Last 30 Days) */}
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              Daily Sales Trend (Last 30 Days)
            </h3>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='date' angle={-45} textAnchor='end' height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='revenue'
                  stroke='#10b981'
                  strokeWidth={2}
                  name='Revenue'
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Repeat vs New Customers */}
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              Repeat vs New Customers
            </h3>
            <ResponsiveContainer width='100%' height={300}>
              <PieChart>
                <Pie
                  data={repeatVsNewData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  innerRadius={40}
                  fill='#8884d8'
                  dataKey='value'
                >
                  {repeatVsNewData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#1f6feb" : "#10b981"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Avg Order Value Trend */}
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              Monthly Avg Order Value Trend
            </h3>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={avgOrderTrend}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='month' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='avgOrderValue'
                  stroke='#f59e0b'
                  strokeWidth={2}
                  name='Avg Order Value'
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Customers */}
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              Top Customers
            </h3>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #e5e7eb",
                      background: "#f9fafb",
                      position: "sticky",
                      top: 0,
                    }}
                  >
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    >
                      Customer
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    >
                      Purchases
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.slice(0, 10).map((customer, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px", fontSize: "13px" }}>
                        {customer.name}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontSize: "13px",
                          fontWeight: 500,
                        }}
                      >
                        {customer.purchases}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#1f6feb",
                        }}
                      >
                        ₹{(customer.total || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Follow-Up Calls Due Today */}
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              📞 Follow-Up Calls Due Today ({todayFollowUps.length})
            </h3>
            {todayFollowUps.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                No calls scheduled for today
              </div>
            ) : (
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: "2px solid #e5e7eb",
                        background: "#f9fafb",
                        position: "sticky",
                        top: 0,
                      }}
                    >
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: "12px",
                        }}
                      >
                        Name
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: "12px",
                        }}
                      >
                        Phone
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontWeight: 600,
                          fontSize: "12px",
                        }}
                      >
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayFollowUps.map((call, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "12px", fontSize: "13px" }}>
                          {call.name}
                        </td>
                        <td style={{ padding: "12px", fontSize: "13px" }}>
                          {call.phone}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          {call.callTime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Grid View
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          {/* Top Customers Grid */}
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              Top Customers
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f9fafb",
                  }}
                >
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    Customer
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    Purchases
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px", fontSize: "13px" }}>
                      {customer.name}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      {customer.purchases}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#1f6feb",
                      }}
                    >
                      ₹{(customer.total || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Monthly Sales Grid */}
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              Monthly Sales
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f9fafb",
                  }}
                >
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    Month
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    Sales
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((data, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      {data.month}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "13px",
                      }}
                    >
                      {data.sales}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#10b981",
                      }}
                    >
                      ₹{(data.revenue || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Follow-Up Calls Due Today Grid */}
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              📞 Follow-Up Calls Due Today ({todayFollowUps.length})
            </h3>
            {todayFollowUps.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                No calls scheduled for today
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                  >
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    >
                      Phone
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    >
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {todayFollowUps.map((call, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px", fontSize: "13px" }}>
                        {call.name}
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px" }}>
                        {call.phone}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontSize: "13px",
                          fontWeight: 500,
                        }}
                      >
                        {call.callTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
