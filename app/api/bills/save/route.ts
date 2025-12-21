// app/api/bills/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  ensureMasterCustomerSheet,
  getSheetsClient,
  saveDailyBills,
  updateOrInsertCustomer,
  updateDeliverySummary,
} from "@/lib/googleSheets";
import { DailyBillsInput } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
function toDDMMYYYY(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}-${m}-${y}`;
}

    // Validate required fields
    if (!body.top) {
      return NextResponse.json(
        {
          error: "Missing required field: top",
        },
        { status: 400 }
      );
    }

    if (!body.top.date || !body.top.shift) {
      return NextResponse.json(
        {
          error: "Missing required fields: top.date or top.shift",
        },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        {
          error: "Missing or empty items array",
        },
        { status: 400 }
      );
    }

    // Validate each item has required fields
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];
      if (!item.shopName) {
        return NextResponse.json(
          {
            error: `Item at index ${i} is missing required field: shopName`,
          },
          { status: 400 }
        );
      }
      // Validate that packetPrice, saleQty, sampleQty, returnQty are present
      if (item.packetPrice === undefined || item.saleQty === undefined || 
          item.sampleQty === undefined || item.returnQty === undefined) {
        return NextResponse.json(
          {
            error: `Item at index ${i} is missing required fields: packetPrice, saleQty, sampleQty, or returnQty.`,
          },
          { status: 400 }
        );
      }
    }

    // Construct the input data
    const dailyBillsData: DailyBillsInput = {
      top: {
        date: body.top.date,
        shift: body.top.shift,
      },
      items: body.items.map((item: any) => ({
        shopName: item.shopName || "",
        phone: item.phone || "",
        packetPrice: typeof item.packetPrice === "number" ? item.packetPrice : parseFloat(item.packetPrice) || 95,
        saleQty: typeof item.saleQty === "number" ? item.saleQty : parseFloat(item.saleQty) || 0,
        sampleQty: typeof item.sampleQty === "number" ? item.sampleQty : parseFloat(item.sampleQty) || 0,
        returnQty: typeof item.returnQty === "number" ? item.returnQty : parseFloat(item.returnQty) || 0,
        saleAmount: typeof item.saleAmount === "number" ? item.saleAmount : parseFloat(item.saleAmount) || 0,
        sampleAmount: typeof item.sampleAmount === "number" ? item.sampleAmount : parseFloat(item.sampleAmount) || 0,
        returnAmount: typeof item.returnAmount === "number" ? item.returnAmount : parseFloat(item.returnAmount) || 0,
        address: item.address || "",
        rep: typeof item.rep === "number" ? item.rep : parseFloat(item.rep) || 0,
        delPerson: item.delPerson || "",
        paymentStatus: item.paymentStatus || "",
        balanceAmount: item.balanceAmount || "",
      })),
    };

    console.log("[SaveDailyBills] Processing daily bills:", {
      date: dailyBillsData.top.date,
      shift: dailyBillsData.top.shift,
      itemCount: dailyBillsData.items.length,
    });

    // Save to Google Sheets (daily tabs)
    await saveDailyBills(dailyBillsData);

    // Update Master Customer sheet
    const spreadsheetId ="1OwmfDCO3AGBnHlViha2FPRySaGLPDPle106T0p3W-RA"
    if (!spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID not configured");
    }

    await ensureMasterCustomerSheet();
    const sheetsClient = getSheetsClient();

    for (const item of dailyBillsData.items) {
      await updateOrInsertCustomer(
        sheetsClient,
        spreadsheetId,
        item,
        dailyBillsData.top.date
      );
    }

    // Update Delivery Person Summary
    await updateDeliverySummary(dailyBillsData.items);

    const displayDate = toDDMMYYYY(dailyBillsData.top.date);
const sheetName = `${displayDate}-${dailyBillsData.top.shift}`;

    return NextResponse.json({
      success: true,
  message: `Successfully saved ${dailyBillsData.items.length} bill(s) to sheet: ${sheetName}`,
  sheetName,
    });

  } catch (error: any) {
    console.error("[SaveDailyBills] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to save daily bills",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
