// app/api/dashboard/delivery-summary/init/route.ts
// This route initializes the Delivery_Summary sheet from all existing daily bill sheets
import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient, ensureDeliverySummarySheet } from "@/lib/googleSheets";

const SPREADSHEET_ID = "1OwmfDCO3AGBnHlViha2FPRySaGLPDPle106T0p3W-RA";

async function initDeliverySummary() {
  console.log("[DeliverySummary Init] Starting initialization from existing sheets...");

  const sheets = getSheetsClient();

  // Get all sheet names
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const allSheets = spreadsheet.data.sheets || [];
  const dailySheetNames = allSheets
    .map((s) => s.properties?.title || "")
    .filter((name) => {
      // Match daily bill sheets like "23-10-2026-Morning" or "21-12-2025-Morning"
      return /^\d{2}-\d{2}-\d{4}-(Morning|Evening)$/i.test(name);
    });

  console.log(`[DeliverySummary Init] Found ${dailySheetNames.length} daily sheets:`, dailySheetNames);

  // Ensure Delivery_Summary sheet exists
  await ensureDeliverySummarySheet();

  // Clear existing data (keep headers)
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: "Delivery_Summary!A2:D",
    });
  } catch (e) {
    // Sheet might be empty, ignore
  }

  // Aggregate data from all daily sheets
  const deliveryMap = new Map<
    string,
    { orders: number; saleAmount: number; cashAmount: number; originalName: string }
  >();

  for (const sheetName of dailySheetNames) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${sheetName}'!A2:P`, // Get all columns
      });

      const rows = response.data.values || [];
      console.log(`[DeliverySummary Init] Processing ${rows.length} rows from ${sheetName}`);

      for (const row of rows) {
        // Column N (index 13) is Delivery Person
        // Column H (index 7) is Sale Amount
        // Column O (index 14) is Payment Status
        const delPerson = (row[13] || "").toString().trim();
        const saleAmount = parseFloat(row[7] || "0") || 0;
        const paymentStatus = (row[14] || "").toString().toLowerCase();

        if (!delPerson) continue;

        const key = delPerson.toLowerCase();
        const existing = deliveryMap.get(key) || {
          orders: 0,
          saleAmount: 0,
          cashAmount: 0,
          originalName: delPerson,
        };

        existing.orders += 1;
        existing.saleAmount += saleAmount;

        if (paymentStatus === "cash" || paymentStatus === "paid") {
          existing.cashAmount += saleAmount;
        }

        deliveryMap.set(key, existing);
      }
    } catch (error) {
      console.error(`[DeliverySummary Init] Error processing sheet ${sheetName}:`, error);
    }
  }

  // Write aggregated data to Delivery_Summary sheet
  const summaryRows: string[][] = [];
  for (const [key, data] of deliveryMap) {
    summaryRows.push([
      data.originalName || key,
      data.orders.toString(),
      data.saleAmount.toString(),
      data.cashAmount.toString(),
    ]);
  }

  // Sort by orders descending
  summaryRows.sort((a, b) => parseInt(b[1]) - parseInt(a[1]));

  if (summaryRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Delivery_Summary!A:D",
      valueInputOption: "RAW",
      requestBody: {
        values: summaryRows,
      },
    });
  }

  console.log(`[DeliverySummary Init] ✅ Created summary for ${summaryRows.length} delivery persons`);

  return {
    success: true,
    message: `Initialized Delivery_Summary with ${summaryRows.length} delivery persons from ${dailySheetNames.length} daily sheets`,
    deliveryPersons: summaryRows.map((r) => r[0]),
    sheetsProcessed: dailySheetNames,
  };
}

export async function POST(req: NextRequest) {
  try {
    const result = await initDeliverySummary();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[DeliverySummary Init] ❌ Error:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize delivery summary",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support GET for easy browser testing
export async function GET(req: NextRequest) {
  try {
    const result = await initDeliverySummary();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[DeliverySummary Init] ❌ Error:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize delivery summary",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
