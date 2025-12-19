// app/api/dashboard/daily-sales/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheets";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "1OwmfDCO3AGBnHlViha2FPRySaGLPDPle106T0p3W-RA";

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
 * Format date to DD-MM-YYYY
 */
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Check if sheet name matches daily sheet pattern (DD-MM-YYYY-Shift)
 */
function isDailySheetName(sheetName: string): boolean {
  return /^\d{2}-\d{2}-\d{4}-/.test(sheetName);
}

export async function GET(_req: NextRequest) {
  try {
    const sheets = getSheetsClient();

    // Get all sheets
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetNames =
      spreadsheet.data.sheets
        ?.map((s) => s.properties?.title || "")
        .filter((title) => !!title) || [];

    // Filter daily sheets
    const dailySheets = (sheetNames as string[]).filter(
      (name) =>
        isDailySheetName(name) &&
        name !== "MasterCustomers" &&
        name !== "FollowUpCalls"
    );

    // Get last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Initialize date buckets for last 30 days
    const dateBuckets: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dateBuckets[formatDate(date)] = 0;
    }

    // Process each daily sheet
    for (const sheetName of dailySheets) {
      try {
        // Extract date from sheet name (DD-MM-YYYY-Shift)
        const dateMatch = sheetName.match(/^(\d{2}-\d{2}-\d{4})-/);
        if (!dateMatch) continue;

        const sheetDateStr = dateMatch[1];
        const sheetDate = parseDate(sheetDateStr);

        if (!sheetDate) continue;

        // Check if within last 30 days
        if (sheetDate < thirtyDaysAgo || sheetDate > today) continue;

        // Read sheet data (columns A-N)
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A:N`,
        });

        const rows = response.data.values || [];
        if (rows.length < 2) continue; // Skip if no data rows

        // Sum Sale Amount column (column H, index 7)
        // New structure: Date, Shop Name, Phone, Packet Price, Sale Qty, Sample Qty, Return Qty, Sale Amount, Sample Amount, Return Amount, Shift, Address, Rep, Delivery Person
        let dailyTotal = 0;
        for (let i = 1; i < rows.length; i++) {
          // Try new structure first (Sale Amount at index 7)
          const saleAmount = parseFloat((rows[i][7] || "0").toString().replace(/[^\d.-]/g, "")) || 0;
          dailyTotal += saleAmount;
        }

        // Add to bucket
        if (dateBuckets.hasOwnProperty(sheetDateStr)) {
          dateBuckets[sheetDateStr] += dailyTotal;
        }
      } catch (error) {
        console.warn(`[DailySales] Error processing sheet ${sheetName}:`, error);
        continue;
      }
    }

    // Convert to array and sort by date
    const dailySales = Object.entries(dateBuckets)
      .map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue),
      }))
      .sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      });

    return NextResponse.json({
      success: true,
      dailySales,
      count: dailySales.length,
    });
  } catch (error: any) {
    console.error("[DailySales] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch daily sales",
        details: error?.message || "Unknown error",
        dailySales: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}


