// app/api/dashboard/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllBills, getAllCustomers } from "@/lib/googleSheets";
import { DashboardMetrics } from "@/lib/types";

// Helper: Parse date from DD-MM-YYYY
const parseDate = (dateStr: string): Date => {
  try {
    const [day, month, year] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  } catch {
    return new Date();
  }
};

// Helper: Get month name from date
const getMonthName = (date: Date): string => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[date.getMonth()];
};

export async function GET(req: NextRequest) {
  try {
    console.log("[Dashboard] Fetching metrics...");

    const [bills, customers] = await Promise.all([
      getAllBills(),
      getAllCustomers(),
    ]);

    console.log(
      `[Dashboard] Fetched ${bills.length} bills and ${customers.length} customers`
    );

    // Calculate total sales
    const totalSales = bills.reduce((sum, bill) => {
      const amount = parseFloat(bill.totalAmount) || 0;
      return sum + amount;
    }, 0);

    // Calculate average order value
    const avgOrderValue = bills.length > 0 ? totalSales / bills.length : 0;

    // Get current month and last 6 months
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Identify new customers (first purchase in last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const newCustomers = customers.filter((customer) => {
      try {
        const firstPurchaseDate =
          customer.purchaseHistory.length > 0
            ? parseDate(customer.purchaseHistory[0].date)
            : parseDate(customer.lastPurchaseDate);
        return firstPurchaseDate >= thirtyDaysAgo;
      } catch {
        return false;
      }
    }).length;

    // Sales trend for last 6 months
    const salesTrend = [];
    const monthlySales: {
      [key: string]: { sales: number; revenue: number; count: number };
    } = {};

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
      const monthKey = `${getMonthName(monthDate)}-${monthDate.getFullYear()}`;
      monthlySales[monthKey] = { sales: 0, revenue: 0, count: 0 };
    }

    bills.forEach((bill) => {
      try {
        const billDate = parseDate(bill.date);
        const monthKey = `${getMonthName(billDate)}-${billDate.getFullYear()}`;

        if (monthlySales[monthKey]) {
          const amount = parseFloat(bill.totalAmount) || 0;
          monthlySales[monthKey].revenue += amount;
          monthlySales[monthKey].count += 1;
        }
      } catch (e) {
        console.error("[Dashboard] Error parsing bill date:", e);
      }
    });

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
      const monthKey = `${getMonthName(monthDate)}-${monthDate.getFullYear()}`;
      const data = monthlySales[monthKey];

      salesTrend.push({
        month: getMonthName(monthDate),
        sales: data.count,
        revenue: Math.round(data.revenue),
      });
    }

    // Top products (grouped by product name)
    const productSales: { [key: string]: { count: number; revenue: number } } =
      {};

    bills.forEach((bill) => {
      const products = bill.products.split(",").map((p) => p.trim());
      const quantities = bill.quantity.split(",").map((q) => q.trim());
      const totalAmount = parseFloat(bill.totalAmount) || 0;

      // Distribute the total amount proportionally across products
      const amountPerProduct = totalAmount / products.length;

      products.forEach((product, idx) => {
        if (product) {
          if (!productSales[product]) {
            productSales[product] = { count: 0, revenue: 0 };
          }
          const qty = parseInt(quantities[idx]) || 1;
          productSales[product].count += qty;
          productSales[product].revenue += amountPerProduct;
        }
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({
        name,
        sales: data.count,
        revenue: Math.round(data.revenue),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top customers
    const topCustomers = customers
      .map((customer, idx) => ({
        id: idx + 1,
        name: customer.customerName,
        purchases: customer.totalPurchaseCount,
        total: Math.round(customer.totalAmountSpent),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Revenue breakdown by product categories (simplified)
    // For now, we'll categorize based on common dairy products
    const revenueBreakdown: { [key: string]: number } = {
      "Milk Products": 0,
      "Dairy Products": 0,
      "Premium Range": 0,
      Other: 0,
    };

    bills.forEach((bill) => {
      const products = bill.products.toLowerCase();
      const amount = parseFloat(bill.totalAmount) || 0;

      if (products.includes("milk") || products.includes("दूध")) {
        revenueBreakdown["Milk Products"] += amount;
      } else if (
        products.includes("curd") ||
        products.includes("paneer") ||
        products.includes("दही")
      ) {
        revenueBreakdown["Dairy Products"] += amount;
      } else if (
        products.includes("ghee") ||
        products.includes("butter") ||
        products.includes("घी")
      ) {
        revenueBreakdown["Premium Range"] += amount;
      } else {
        revenueBreakdown["Other"] += amount;
      }
    });

    const revenueBreakdownArray = Object.entries(revenueBreakdown)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .filter((item) => item.value > 0);

    // Customer metrics
    const activeCustomers = customers.filter((customer) => {
      try {
        const lastPurchase = parseDate(customer.lastPurchaseDate);
        const daysSinceLastPurchase =
          (now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastPurchase <= 60; // Active if purchased in last 60 days
      } catch {
        return false;
      }
    }).length;

    const inactiveCustomers = customers.length - activeCustomers - newCustomers;

    const customerMetrics = [
      { category: "Existing", value: activeCustomers },
      { category: "New This Month", value: newCustomers },
      { category: "Inactive", value: Math.max(0, inactiveCustomers) },
    ];

    const metrics: DashboardMetrics = {
      totalCustomers: customers.length,
      totalSales: Math.round(totalSales),
      newCustomers,
      avgOrderValue: Math.round(avgOrderValue),
      salesTrend,
      topProducts,
      topCustomers,
      revenueBreakdown: revenueBreakdownArray,
      customerMetrics,
    };

    console.log("[Dashboard] ✅ Metrics calculated successfully");
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error("[Dashboard] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard metrics",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
