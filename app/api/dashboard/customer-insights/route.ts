// app/api/dashboard/customer-insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheets";

const SPREADSHEET_ID = "1OwmfDCO3AGBnHlViha2FPRySaGLPDPle106T0p3W-RA";

type CustomerInsight = {
  shopName: string;
  phone: string;
  totalSale: number;
  visitCount: number;
  sampleQty: number;
  sampleAmount: number;
  returnQty: number;
  returnAmount: number;
  firstPurchaseDate: string;
  lastPurchaseDate: string;
  dates: string[];
  address?: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterDate = searchParams.get("date") || "";
    
    console.log("[CustomerInsights] Fetching customer data...");

    const sheets = getSheetsClient();

    // Get all sheet names
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const allSheets = spreadsheet.data.sheets || [];
    const dailySheetNames = allSheets
      .map((s) => s.properties?.title || "")
      .filter((name) => /^\d{2}-\d{2}-\d{4}-(Morning|Evening)$/i.test(name));

    // Map to store customer data
    const customerMap = new Map<string, CustomerInsight>();

    // Track all unique dates
    const allDates = new Set<string>();

    for (const sheetName of dailySheetNames) {
      try {
        // Extract date from sheet name (e.g., "23-10-2026-Morning" -> "23-10-2026")
        const dateMatch = sheetName.match(/^(\d{2}-\d{2}-\d{4})/);
        const sheetDate = dateMatch ? dateMatch[1] : "";
        
        if (sheetDate) {
          allDates.add(sheetDate);
        }

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `'${sheetName}'!A2:P`,
        });

        const rows = response.data.values || [];

        for (const row of rows) {
          const customerName = (row[1] || "").toString().trim();
          const phone = (row[2] || "").toString().trim();
          
          if (!customerName && !phone) continue;

          const key = phone || customerName.toLowerCase();
          const saleAmount = parseFloat(row[7] || "0") || 0;
          const sampleQty = parseFloat(row[5] || "0") || 0;
          const sampleAmount = parseFloat(row[8] || "0") || 0;
          const returnQty = parseFloat(row[6] || "0") || 0;
          const returnAmount = parseFloat(row[9] || "0") || 0;

          const existing = customerMap.get(key);

          if (existing) {
            existing.totalSale += saleAmount;
            existing.visitCount += 1;
            existing.sampleQty += sampleQty;
            existing.sampleAmount += sampleAmount;
            existing.returnQty += returnQty;
            existing.returnAmount += returnAmount;
            if (sheetDate && !existing.dates.includes(sheetDate)) {
              existing.dates.push(sheetDate);
            }
            // Update last purchase date
            existing.lastPurchaseDate = sheetDate || existing.lastPurchaseDate;
          } else {
            const address = (row[11] || "").toString().trim();
            customerMap.set(key, {
              shopName: customerName || "Unknown",
              phone,
              totalSale: saleAmount,
              visitCount: 1,
              sampleQty,
              sampleAmount,
              returnQty,
              returnAmount,
              firstPurchaseDate: sheetDate,
              lastPurchaseDate: sheetDate,
              dates: sheetDate ? [sheetDate] : [],
              address,
            });
          }
        }
      } catch (error) {
        console.error(`[CustomerInsights] Error processing sheet ${sheetName}:`, error);
      }
    }

    const allCustomers = Array.from(customerMap.values());

    // Sort dates to find first purchase dates correctly
    allCustomers.forEach(customer => {
      if (customer.dates.length > 0) {
        customer.dates.sort((a, b) => {
          const [d1, m1, y1] = a.split("-").map(Number);
          const [d2, m2, y2] = b.split("-").map(Number);
          return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
        });
        customer.firstPurchaseDate = customer.dates[0];
        customer.lastPurchaseDate = customer.dates[customer.dates.length - 1];
      }
    });

    // Date-wise customers (if date filter provided)
    let dateWiseCustomers: CustomerInsight[] = [];
    if (filterDate) {
      dateWiseCustomers = allCustomers.filter(c => c.dates.includes(filterDate));
    }

    // New customers for the filter date (first purchase on that date)
    let newCustomers: CustomerInsight[] = [];
    if (filterDate) {
      newCustomers = allCustomers.filter(c => c.firstPurchaseDate === filterDate);
    }

    // Repeat customers by visit count
    const repeatCustomers2 = allCustomers.filter(c => c.visitCount === 2);
    const repeatCustomers3 = allCustomers.filter(c => c.visitCount === 3);
    const repeatCustomers4Plus = allCustomers.filter(c => c.visitCount >= 4);

    // Sample customers (received samples)
    const sampleCustomers = allCustomers.filter(c => c.sampleQty > 0);

    // Return customers
    const returnCustomers = allCustomers.filter(c => c.returnQty > 0);

    // Top buyers (sorted by total sale)
    const topBuyers = [...allCustomers]
      .sort((a, b) => b.totalSale - a.totalSale)
      .slice(0, 20);

    // Available dates for the date picker
    const availableDates = Array.from(allDates).sort((a, b) => {
      const [d1, m1, y1] = a.split("-").map(Number);
      const [d2, m2, y2] = b.split("-").map(Number);
      return new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime();
    });

    console.log(`[CustomerInsights] ✅ Processed ${allCustomers.length} customers`);

    return NextResponse.json({
      success: true,
      selectedDate: filterDate,
      availableDates,
      totalCustomersAllTime: allCustomers.length,
      dateWiseCustomers,
      newCustomers,
      repeatCustomers: {
        twoTimes: repeatCustomers2,
        threeTimes: repeatCustomers3,
        fourPlusTimes: repeatCustomers4Plus,
      },
      sampleCustomers,
      returnCustomers,
      topBuyers,
    });
  } catch (error: any) {
    console.error("[CustomerInsights] ❌ Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch customer insights",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
