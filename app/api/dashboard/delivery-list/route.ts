// app/api/dashboard/delivery-list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheets";

const SPREADSHEET_ID = "1OwmfDCO3AGBnHlViha2FPRySaGLPDPle106T0p3W-RA";

type DeliveryShop = {
  shopName: string;
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // Format: DD-MM-YYYY
    const shift = searchParams.get("shift"); // Morning or Evening

    if (!date || !shift) {
      return NextResponse.json(
        { error: "Missing required parameters: date and shift" },
        { status: 400 }
      );
    }

    console.log(`[DeliveryList API] Fetching delivery list for ${date}-${shift}...`);

    const sheets = getSheetsClient();
    const sheetName = `${date}-${shift}`;

    // Check if sheet exists
    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });

      const sheetNames = spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];
      
      if (!sheetNames.includes(sheetName)) {
        console.log(`[DeliveryList API] Sheet ${sheetName} not found`);
        return NextResponse.json({
          success: true,
          deliveryGroups: [],
          totalDeliveryPersons: 0,
          totalShops: 0,
          date,
          shift,
          message: `No data found for ${date} ${shift}`,
        });
      }
    } catch (err) {
      console.error("[DeliveryList API] Error checking sheet:", err);
      return NextResponse.json(
        { error: "Failed to check sheet existence" },
        { status: 500 }
      );
    }

    // Get data from the sheet
    // Sheet columns: Date, ShopName, PacketPrice, SaleQty, SampleQty, ReturnQty, 
    //                SaleAmt, SampleAmt, ReturnAmt, Shift, Address, Rep, DelPerson, PaymentStatus, BalanceAmount
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:O`, // Skip header row
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        deliveryGroups: [],
        totalDeliveryPersons: 0,
        totalShops: 0,
        date,
        shift,
        message: `No deliveries found for ${date} ${shift}`,
      });
    }

    // Group by delivery person
    const deliveryMap = new Map<string, DeliveryShop[]>();

    for (const row of rows) {
      // Column mapping based on appendDailyRows in googleSheets.ts (updated - no phone column):
      // 0: date, 1: shopName, 2: packetPrice, 3: saleQty, 4: sampleQty,
      // 5: returnQty, 6: saleAmount, 7: sampleAmount, 8: returnAmount, 9: shift,
      // 10: address, 11: rep, 12: delPerson, 13: paymentStatus, 14: balanceAmount
      const deliveryPerson = (row[12] || "Unassigned").toString().trim();
      const shopName = (row[1] || "").toString().trim();
      const address = (row[10] || "").toString().trim();
      const saleQty = parseFloat(row[3] || "0") || 0;
      const saleAmount = parseFloat(row[6] || "0") || 0;

      if (!shopName) continue; // Skip empty entries

      const shop: DeliveryShop = {
        shopName,
        address,
        saleQty,
        saleAmount,
      };

      if (!deliveryMap.has(deliveryPerson)) {
        deliveryMap.set(deliveryPerson, []);
      }
      deliveryMap.get(deliveryPerson)!.push(shop);
    }

    // Convert to array and sort
    const deliveryGroups: DeliveryPersonGroup[] = Array.from(deliveryMap.entries())
      .map(([deliveryPerson, shops]) => ({
        deliveryPerson,
        shops: shops.sort((a, b) => a.shopName.localeCompare(b.shopName)),
        totalShops: shops.length,
        totalSaleAmount: shops.reduce((sum, s) => sum + s.saleAmount, 0),
      }))
      .sort((a, b) => {
        // Put "Unassigned" at the end, otherwise sort by name
        if (a.deliveryPerson === "Unassigned") return 1;
        if (b.deliveryPerson === "Unassigned") return -1;
        return a.deliveryPerson.localeCompare(b.deliveryPerson);
      });

    const totalShops = deliveryGroups.reduce((sum, g) => sum + g.totalShops, 0);

    console.log(`[DeliveryList API] ✅ Found ${deliveryGroups.length} delivery persons with ${totalShops} shops`);

    return NextResponse.json({
      success: true,
      deliveryGroups,
      totalDeliveryPersons: deliveryGroups.length,
      totalShops,
      date,
      shift,
    });
  } catch (error: any) {
    console.error("[DeliveryList API] ❌ Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch delivery list",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
