// components/Dashboard.tsx
"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
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

type ViewMode = "chart" | "grid";

const Dashboard = ({ onBack }: { onBack: () => void }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("chart");

  // Dummy data
  const salesData = [
    { month: "Jan", sales: 4000, revenue: 2400 },
    { month: "Feb", sales: 3000, revenue: 1398 },
    { month: "Mar", sales: 2000, revenue: 9800 },
    { month: "Apr", sales: 2780, revenue: 3908 },
    { month: "May", sales: 1890, revenue: 4800 },
    { month: "Jun", sales: 2390, revenue: 3800 },
  ];

  const topProducts = [
    { name: "Milk (1L)", sales: 1245, revenue: 24900 },
    { name: "Curd (500g)", sales: 987, revenue: 19740 },
    { name: "Paneer (500g)", sales: 756, revenue: 37800 },
    { name: "Ghee (250ml)", sales: 654, revenue: 32700 },
    { name: "Butter (200g)", sales: 543, revenue: 16290 },
  ];

  const customerMetrics = [
    { category: "Existing", value: 324 },
    { category: "New This Month", value: 48 },
    { category: "Inactive", value: 12 },
  ];

  const topCustomers = [
    { id: 1, name: "Arjun Grocery Store", purchases: 156, total: 78000 },
    { id: 2, name: "Fresh Mart", purchases: 142, total: 71000 },
    { id: 3, name: "Local Dairy Hub", purchases: 128, total: 64000 },
    { id: 4, name: "Sharma Retail", purchases: 115, total: 57500 },
    { id: 5, name: "Dairy Express", purchases: 98, total: 49000 },
  ];

  const revenueBreakdown = [
    { name: "Milk Products", value: 45000 },
    { name: "Dairy Products", value: 38000 },
    { name: "Premium Range", value: 25000 },
    { name: "Bulk Orders", value: 18000 },
  ];

  const COLORS = ["#1f6feb", "#0ea5e9", "#06b6d4", "#10b981"];

  const kpiCards = [
    {
      title: "Total Customers",
      value: "384",
      change: "+12%",
      color: "bg-blue-50",
      icon: "👥",
    },
    {
      title: "Total Sales",
      value: "₹126K",
      change: "+8%",
      color: "bg-green-50",
      icon: "📊",
    },
    {
      title: "New Customers",
      value: "48",
      change: "+25%",
      color: "bg-purple-50",
      icon: "✨",
    },
    {
      title: "Avg Order Value",
      value: "₹325",
      change: "+3%",
      color: "bg-orange-50",
      icon: "💰",
    },
  ];

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
          {/* Sales Trend */}
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
              Sales Trend (Last 6 Months)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#1f6feb"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Breakdown */}
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
              Revenue by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueBreakdown.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products */}
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
              Top 5 Products
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#1f6feb" />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Customer Distribution */}
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
              Customer Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerMetrics}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ payload }) =>
                    `${payload?.category} (${payload?.value})`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {customerMetrics.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
          {/* Top Products Grid */}
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
              Top Products
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
                    Product
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
                {topProducts.map((product, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px", fontSize: "13px" }}>
                      {product.name}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      {product.sales}
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
                      ₹{product.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                      ₹{customer.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sales Data Grid */}
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
                      ₹{data.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Revenue Breakdown Grid */}
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
              Revenue by Category
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
                    Category
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    Amount
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {revenueBreakdown.map((item, idx) => {
                  const total = revenueBreakdown.reduce(
                    (sum, x) => sum + x.value,
                    0
                  );
                  const percentage = ((item.value / total) * 100).toFixed(1);
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px", fontSize: "13px" }}>
                        {item.name}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        ₹{item.value.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontSize: "13px",
                          color: "#1f6feb",
                        }}
                      >
                        {percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
