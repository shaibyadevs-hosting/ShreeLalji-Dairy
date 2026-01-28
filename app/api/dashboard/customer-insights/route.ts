// app/api/dashboard/customer-insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheets";
import { normalizeShopName } from "@/lib/normalizeShopName";

const SPREADSHEET_ID = "1OwmfDCO3AGBnHlViha2FPRySaGLPDPle106T0p3W-RA";

type CustomerInsight = {
  shopName: string;
  normalizedShopName: string;
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
          
          if (!customerName) continue;

          const key = normalizeShopName(customerName);
          // Updated column indices after removing Phone column:
          // 0: Date, 1: Shop Name, 2: Packet Price, 3: Sale Qty, 4: Sample Qty, 
          // 5: Return Qty, 6: Total Amount, 7: Sample Amount, 8: Return Amount, 
          // 9: Shift, 10: Address, 11: Rep, 12: Delivery Person
          const saleAmount = parseFloat(row[6] || "0") || 0;
          const sampleQty = parseFloat(row[4] || "0") || 0;
          const sampleAmount = parseFloat(row[7] || "0") || 0;
          const returnQty = parseFloat(row[5] || "0") || 0;
          const returnAmount = parseFloat(row[8] || "0") || 0;

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
            const address = (row[10] || "").toString().trim();
            customerMap.set(key, {
              shopName: customerName || "Unknown",
              normalizedShopName: key,
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

    // Now get date-specific data by reading the specific date sheet again
    // This is needed because aggregated data doesn't have per-day sample/return counts
    const dateSpecificCustomers: CustomerInsight[] = [];
    
    if (filterDate) {
      // Convert filterDate (DD-MM-YYYY) to find matching sheets
      const morningSheet = `${filterDate}-Morning`;
      const eveningSheet = `${filterDate}-Evening`;
      const matchingSheets = dailySheetNames.filter(
        name => name === morningSheet || name === eveningSheet
      );

      console.log(`[CustomerInsights] Looking for sheets: ${morningSheet}, ${eveningSheet}`);
      console.log(`[CustomerInsights] Found matching sheets:`, matchingSheets);
      console.log(`[CustomerInsights] Available sheet dates:`, dailySheetNames.slice(0, 10));

      for (const sheetName of matchingSheets) {
        try {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${sheetName}'!A2:P`,
          });

          const rows = response.data.values || [];
          
          // Log first 3 rows for debugging
          console.log(`[CustomerInsights] Sheet ${sheetName} has ${rows.length} rows`);
          if (rows.length > 0) {
            console.log(`[CustomerInsights] First row data:`, {
              shopName: rows[0][1],
              sampleQty: rows[0][4],
              returnQty: rows[0][5],
              totalAmount: rows[0][6]
            });
          }

          for (const row of rows) {
            const customerName = (row[1] || "").toString().trim();
            
            if (!customerName) continue;

            const normalizedName = normalizeShopName(customerName);
            // Updated column indices after removing Phone column:
            // 0: Date, 1: Shop Name, 2: Packet Price, 3: Sale Qty, 4: Sample Qty, 
            // 5: Return Qty, 6: Total Amount, 7: Sample Amount, 8: Return Amount, 
            // 9: Shift, 10: Address, 11: Rep, 12: Delivery Person
            const saleAmount = parseFloat(row[6] || "0") || 0;
            const sampleQty = parseFloat(row[4] || "0") || 0;
            const sampleAmount = parseFloat(row[7] || "0") || 0;
            const returnQty = parseFloat(row[5] || "0") || 0;
            const returnAmount = parseFloat(row[8] || "0") || 0;
            const address = (row[10] || "").toString().trim();

            // Check if customer already exists in dateSpecificCustomers
            const existingIdx = dateSpecificCustomers.findIndex(
              c => c.normalizedShopName === normalizedName
            );

            if (existingIdx >= 0) {
              // Merge data (Morning + Evening on same day)
              dateSpecificCustomers[existingIdx].totalSale += saleAmount;
              dateSpecificCustomers[existingIdx].sampleQty += sampleQty;
              dateSpecificCustomers[existingIdx].sampleAmount += sampleAmount;
              dateSpecificCustomers[existingIdx].returnQty += returnQty;
              dateSpecificCustomers[existingIdx].returnAmount += returnAmount;
              dateSpecificCustomers[existingIdx].visitCount += 1;
            } else {
              dateSpecificCustomers.push({
                shopName: customerName || "Unknown",
                normalizedShopName: normalizedName,
                totalSale: saleAmount,
                visitCount: 1,
                sampleQty,
                sampleAmount,
                returnQty,
                returnAmount,
                firstPurchaseDate: filterDate,
                lastPurchaseDate: filterDate,
                dates: [filterDate],
                address,
              });
            }
          }
        } catch (error) {
          console.error(`[CustomerInsights] Error reading date-specific sheet ${sheetName}:`, error);
        }
      }
    }

    // Date-wise customers for the selected date (from date-specific data)
    const dateWiseCustomers = filterDate ? dateSpecificCustomers : [];

    console.log(`[CustomerInsights] Date-specific customers for ${filterDate}:`, dateSpecificCustomers.length);
    console.log(`[CustomerInsights] Sample customers (date):`, dateSpecificCustomers.filter(c => c.sampleQty > 0).length);
    console.log(`[CustomerInsights] Return customers (date):`, dateSpecificCustomers.filter(c => c.returnQty > 0).length);

    // New customers for the filter date (first purchase on that date)
    // Use date-specific data for amounts, but check allCustomers for firstPurchaseDate
    let newCustomers: CustomerInsight[] = [];
    if (filterDate) {
      // Get list of customers whose first purchase was on this date
      const newCustomerNames = new Set(
        allCustomers
          .filter(c => c.firstPurchaseDate === filterDate)
          .map(c => c.normalizedShopName)
      );
      
      // Return their date-specific data (not all-time totals)
      newCustomers = dateSpecificCustomers.filter(c => 
        newCustomerNames.has(c.normalizedShopName)
      );
    }

    // Repeat customers by visit count (all-time, but still useful)
    const repeatCustomers2 = allCustomers.filter(c => c.visitCount === 2);
    const repeatCustomers3 = allCustomers.filter(c => c.visitCount === 3);
    const repeatCustomers4Plus = allCustomers.filter(c => c.visitCount >= 4);

    // Sample customers - date-specific if date is provided, otherwise all-time
    const sampleCustomers = filterDate 
      ? dateSpecificCustomers.filter(c => c.sampleQty > 0 || c.sampleAmount > 0)
      : allCustomers.filter(c => c.sampleQty > 0 || c.sampleAmount > 0);

    // Return customers - date-specific if date is provided, otherwise all-time
    // Count customers with returnQty > 0 OR returnAmount > 0
    const returnCustomers = filterDate
      ? dateSpecificCustomers.filter(c => c.returnQty > 0 || c.returnAmount > 0)
      : allCustomers.filter(c => c.returnQty > 0 || c.returnAmount > 0);

    // Total return quantity (sum of Return Qty, not count of customers)
    const totalReturnQty = returnCustomers.reduce((sum, c) => sum + (c.returnQty || 0), 0);

    // Debug logging for returns
    if (filterDate) {
      console.log(`[CustomerInsights] Return customers for ${filterDate}:`, 
        returnCustomers.map(c => ({ name: c.shopName, returnQty: c.returnQty, returnAmount: c.returnAmount }))
      );
    }

    // Top buyers - date-specific if date is provided (sorted by sale on that date)
    const topBuyers = filterDate
      ? [...dateSpecificCustomers]
          .sort((a, b) => b.totalSale - a.totalSale)
          .slice(0, 20)
      : [...allCustomers]
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
      totalReturnQty,
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
