// app/api/dashboard/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient, getAllDailyBillsForMetrics } from "@/lib/googleSheets";

type PurchaseHistoryEntry = {
  date: string;
  amount: number;
};

type CustomerRow = {
  name: string;
  phone: string;
  address: string;
  purchaseCount: number;
  totalAmountSpent: number;
  lastPurchaseDate: Date | null;
  purchaseHistory: PurchaseHistoryEntry[];
};

type SalesTrendPoint = {
  month: string;
  sales: number;
  revenue: number;
};

type TopCustomer = {
  id: number;
  name: string;
  purchases: number;
  total: number;
};

type CategoryRevenue = {
  name: string;
  value: number;
};

type DashboardResponse = {
  totalCustomers: number;
  totalSales: number;
  totalOrders: number;
  newCustomers: number;
  avgOrderValue: number;
  salesTrend: SalesTrendPoint[];
  topCustomers: TopCustomer[];
  revenueBreakdown: CategoryRevenue[];
  customerInsights: {
    activeCustomers: number;
    inactiveCustomers: number;
    newCustomersCount: number;
  };
  // New financial metrics
  sampleExpense: number;
  returnExpense: number;
  netRevenue: number;
  totalBalanceAmount: number;
};

// ==================== Helper Functions ====================

/**
 * Parse date from DD-MM-YYYY format
 */
const parseDate = (dateStr: string | undefined | null): Date | null => {
  if (!dateStr) return null;
  const trimmed = dateStr.toString().trim();
  if (!trimmed) return null;

  // Handle formats like "17-11-2025" or "17-11-2025-Morning-1"
  const match = trimmed.match(/(\d{1,2})-(\d{1,2})-(\d{2,4})/);
  if (!match) return null;

  const [, dayStr, monthStr, yearStr] = match;
  const day = Number(dayStr);
  const month = Number(monthStr);
  let year = Number(yearStr);

  // Handle 2-digit years
  if (year < 100) {
    year = year < 50 ? 2000 + year : 1900 + year;
  }

  if (!day || !month || !year) return null;

  const d = new Date(year, month - 1, day);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Get month name abbreviation
 */
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

/**
 * Safely parse Purchase History JSON
 */
const parsePurchaseHistory = (
  historyStr: string | undefined | null
): PurchaseHistoryEntry[] => {
  if (!historyStr) return [];

  try {
    const parsed = JSON.parse(historyStr.toString().trim());
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry) => {
        return (
          entry &&
          typeof entry === "object" &&
          typeof entry.date === "string" &&
          typeof entry.amount === "number"
        );
      })
      .map((entry) => ({
        date: String(entry.date),
        amount: Number(entry.amount) || 0,
      }));
  } catch (error) {
    console.warn("[Dashboard] Failed to parse purchase history:", error);
    return [];
  }
};

/**
 * Extract month-year key from date string
 */
const getMonthYearKey = (dateStr: string): string | null => {
  const date = parseDate(dateStr);
  if (!date) return null;
  return `${date.getFullYear()}-${date.getMonth()}`;
};

/**
 * Check if sheet error is due to missing sheet
 */
const isMissingSheetError = (error: any): boolean => {
  const message =
    error?.errors?.[0]?.message ||
    error?.message ||
    (typeof error === "string" ? error : "");

  return (
    (typeof error?.code === "number" && (error.code === 400 || error.code === 404)) ||
    message.includes("Unable to parse range") ||
    message.includes("Requested entity was not found") ||
    message.includes("Sheet not found")
  );
};

// ==================== Data Loading ====================

/**
 * Load all customers from MasterCustomers sheet
 */
const loadCustomers = async (
  sheets: ReturnType<typeof getSheetsClient>,
  spreadsheetId: string
): Promise<CustomerRow[]> => {
  const MASTER_SHEET = "MasterCustomers";

  try {
    // Read columns A-I (all 9 columns)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${MASTER_SHEET}!A2:I`,
    });

    const rows = res.data.values || [];

    const customers: CustomerRow[] = rows.map((row) => {
      const name = (row[0] || "").toString().trim();
      const phone = (row[1] || "").toString().trim();
      const address = (row[2] || "").toString().trim();
      const purchaseCount = Number(row[3] || 0) || 0;
      const totalAmountSpent = Number(row[4] || 0) || 0;
      const lastPurchaseDate = parseDate((row[5] || "").toString().trim());
      const purchaseHistoryRaw = (row[6] || "").toString().trim();
      const purchaseHistory = parsePurchaseHistory(purchaseHistoryRaw);
      // row[7] = Flag, row[8] = Last Modified (not needed for metrics)

      return {
        name,
        phone,
        address,
        purchaseCount,
        totalAmountSpent,
        lastPurchaseDate,
        purchaseHistory,
      };
    });

    return customers;
  } catch (error) {
    if (isMissingSheetError(error)) {
      console.warn(
        "[Dashboard] MasterCustomers sheet missing, returning empty customers"
      );
      return [];
    }
    throw error;
  }
};

// ==================== Metrics Calculation ====================

/**
 * Calculate sales trend from purchase history
 * Returns last 6 months of sales data
 */
const computeSalesTrend = (
  customers: CustomerRow[]
): SalesTrendPoint[] => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

  // Initialize month buckets for last 6 months
  const monthBuckets: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
    const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
    monthBuckets[key] = 0;
  }

  // Aggregate sales from purchase history
  for (const customer of customers) {
    for (const entry of customer.purchaseHistory) {
      const monthYearKey = getMonthYearKey(entry.date);
      if (monthYearKey && monthBuckets.hasOwnProperty(monthYearKey)) {
        monthBuckets[monthYearKey] += entry.amount;
        }
    }
  }

  // Build trend array for last 6 months
  // Dashboard expects: { month, sales, revenue }
  const trend: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
    const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
    const sales = monthBuckets[key] || 0;

    trend.push({
        month: getMonthName(monthDate),
      sales: Math.round(sales),
      revenue: Math.round(sales), // Use same value for revenue
      });
    }

  return trend;
};

/**
 * Calculate customer insights (active, inactive, new)
 */
const computeCustomerInsights = (customers: CustomerRow[]) => {
  const now = new Date();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const THIRTY_DAYS_MS = 30 * DAY_MS;
  const NINETY_DAYS_MS = 90 * DAY_MS;
  const SEVEN_DAYS_MS = 7 * DAY_MS;

  let activeCustomers = 0;
  let inactiveCustomers = 0;
  let newCustomers = 0;

  for (const customer of customers) {
    const lastPurchaseDate = customer.lastPurchaseDate;

    // Check if new customer
    const isNew =
      customer.purchaseCount === 1 ||
      (lastPurchaseDate &&
        now.getTime() - lastPurchaseDate.getTime() <= SEVEN_DAYS_MS);

    if (isNew) {
      newCustomers++;
    }

    // Check active/inactive status
    if (lastPurchaseDate) {
      const daysSinceLastPurchase =
        (now.getTime() - lastPurchaseDate.getTime()) / DAY_MS;

      if (daysSinceLastPurchase <= 30) {
        activeCustomers++;
      } else if (daysSinceLastPurchase > 90) {
        inactiveCustomers++;
      } else {
        // Between 30-90 days: still active
        activeCustomers++;
      }
    } else {
      // No purchase date: consider inactive
      inactiveCustomers++;
    }
  }

  return {
    activeCustomers,
    inactiveCustomers,
    newCustomers,
  };
};

// ==================== Route Handler ====================

export async function GET(_req: NextRequest) {
  try {
    const spreadsheetId =
      process.env.GOOGLE_SPREADSHEET_ID ||
      "1OwmfDCO3AGBnHlViha2FPRySaGLPDPle106T0p3W-RA";

    if (!spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID is not configured");
    }

    const sheets = getSheetsClient();

    // Load customers from MasterCustomers sheet ONLY
    const customers = await loadCustomers(sheets, spreadsheetId);

    // Get financial metrics from daily sheets
    const dailyMetrics = await getAllDailyBillsForMetrics();

    // 1. totalCustomers = number of rows (excluding header)
    const totalCustomers = customers.length;

    // 2. totalSales = SUM of Sale Amounts from daily sheets (NOT from MasterCustomers)
    const totalSales = dailyMetrics.totalSaleAmount;

    // 3. totalOrders = Count of orders with saleQty > 0 from daily sheets
    const totalOrders = dailyMetrics.totalOrders;

    // 4. avgOrderValue = totalSales / totalOrders
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // 5. Sample Expense = SUM of Sample Amounts from daily sheets
    const sampleExpense = dailyMetrics.totalSampleAmount;

    // 6. Return Expense = SUM of Return Amounts from daily sheets
    const returnExpense = dailyMetrics.totalReturnAmount;

    // 7. Net Revenue = Total Sales - Sample Expense - Return Expense
    const netRevenue = totalSales - sampleExpense - returnExpense;

    // 8. Total Balance Amount = SUM of Balance Amounts from daily sheets
    const totalBalanceAmount = dailyMetrics.totalBalanceAmount;

    // 5. topCustomers = top 10 by Total Amount Spent
    // Dashboard expects: { id, name, purchases, total }
    const topCustomers = customers
      .slice()
      .sort((a, b) => b.totalAmountSpent - a.totalAmountSpent)
      .slice(0, 10)
      .map((c, idx) => ({
        id: idx + 1,
        name: c.name,
        purchases: c.purchaseCount,
        total: Math.round(c.totalAmountSpent),
      }));

    // 6. salesTrend = from Purchase History JSON
    const salesTrend = computeSalesTrend(customers);

    // 7. Customer insights
    const { activeCustomers, inactiveCustomers, newCustomers } =
      computeCustomerInsights(customers);

    // 8. revenueBreakdown = Always show "Dosa Batter" with totalSales
    // Dashboard expects: { name, value }
    const revenueBreakdown = [
      {
        name: "Dosa Batter",
        value: Math.round(totalSales),
      },
    ];

    const response: DashboardResponse = {
      totalCustomers,
      totalSales: Math.round(totalSales),
      totalOrders,
      newCustomers,
      avgOrderValue: Math.round(avgOrderValue),
      salesTrend,
      topCustomers,
      revenueBreakdown,
      customerInsights: {
        activeCustomers,
        inactiveCustomers,
        newCustomersCount: newCustomers,
      },
      sampleExpense: Math.round(sampleExpense),
      returnExpense: Math.round(returnExpense),
      netRevenue: Math.round(netRevenue),
      totalBalanceAmount: Math.round(totalBalanceAmount),
    };

    console.log("[Dashboard] ✅ Metrics calculated:", {
      totalCustomers,
      totalSales: Math.round(totalSales),
      totalOrders,
      sampleExpense: Math.round(sampleExpense),
      returnExpense: Math.round(returnExpense),
      netRevenue: Math.round(netRevenue),
      totalBalanceAmount: Math.round(totalBalanceAmount),
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[Dashboard] ❌ Error computing metrics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard metrics",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
