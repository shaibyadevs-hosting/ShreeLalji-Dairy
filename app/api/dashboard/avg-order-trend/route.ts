// app/api/dashboard/avg-order-trend/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheets";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "1OwmfDCO3AGBnHlViha2FPRySaGLPDPle106T0p3W-RA";

type PurchaseHistoryEntry = {
  date: string;
  amount: number;
};

/**
 * Parse date from DD-MM-YYYY format
 */
function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(/(\d{1,2})-(\d{1,2})-(\d{2,4})/);
  if (match) {
    const [, day, month, year] = match;
    const fullYear = year.length === 2 ? (parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year)) : parseInt(year);
    const d = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Get month name
 */
function getMonthName(date: Date): string {
  return date.toLocaleString("default", { month: "short" });
}

export async function GET(_req: NextRequest) {
  try {
    const sheets = getSheetsClient();

    // Read MasterCustomers sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "MasterCustomers!A2:I",
    });

    const rows = response.data.values || [];

    // Initialize month buckets for last 6 months
    const now = new Date();
    const monthBuckets: Record<string, { sales: number; orders: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
      monthBuckets[key] = { sales: 0, orders: 0 };
    }

    // Process each customer's purchase history
    for (const row of rows) {
      // Column G (index 6) is Purchase History JSON
      // MasterCustomers: 0: Customer Name, 1: Normalized Shop Name, 2: Address, 3: Total Purchase Count,
      // 4: Total Amount Spent, 5: Last Purchase Date, 6: Purchase History, 7: Flag, 8: Last Modified
      const purchaseHistoryJson = (row[6] || "[]").toString();

      let purchaseHistory: PurchaseHistoryEntry[] = [];
      try {
        purchaseHistory = JSON.parse(purchaseHistoryJson);
      } catch (e) {
        continue;
      }

      for (const entry of purchaseHistory) {
        const purchaseDate = parseDate(entry.date);
        if (!purchaseDate) continue;

        const key = `${purchaseDate.getFullYear()}-${purchaseDate.getMonth()}`;
        if (monthBuckets.hasOwnProperty(key)) {
          monthBuckets[key].sales += entry.amount || 0;
          monthBuckets[key].orders += 1;
        }
      }
    }

    // Convert to array and calculate avg order value
    const trend = Object.entries(monthBuckets)
      .map(([key, data]) => {
        const [year, month] = key.split("-").map(Number);
        const monthDate = new Date(year, month, 1);
        const avgOrderValue = data.orders > 0 ? data.sales / data.orders : 0;

        return {
          month: getMonthName(monthDate),
          year: monthDate.getFullYear(),
          avgOrderValue: Math.round(avgOrderValue),
          sales: Math.round(data.sales),
          orders: data.orders,
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const monthA = new Date(a.year, 0, 1).toLocaleString("default", { month: "short" });
        const monthB = new Date(b.year, 0, 1).toLocaleString("default", { month: "short" });
        return monthA.localeCompare(monthB);
      });

    return NextResponse.json({
      success: true,
      trend,
      count: trend.length,
    });
  } catch (error: any) {
    console.error("[AvgOrderTrend] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch avg order trend",
        details: error?.message || "Unknown error",
        trend: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}


