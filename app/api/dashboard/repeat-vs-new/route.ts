// app/api/dashboard/repeat-vs-new/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheets";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "1OwmfDCO3AGBnHlViha2FPRySaGLPDPle106T0p3W-RA";

export async function GET(_req: NextRequest) {
  try {
    const sheets = getSheetsClient();

    // Read MasterCustomers sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "MasterCustomers!A2:I",
    });

    const rows = response.data.values || [];

    let repeatCustomers = 0;
    let newCustomers = 0;

    for (const row of rows) {
      // Column D (index 3) is Total Purchase Count
      // MasterCustomers: 0: Customer Name, 1: Normalized Shop Name, 2: Address, 3: Total Purchase Count
      const purchaseCount = parseInt((row[3] || "0").toString()) || 0;

      if (purchaseCount > 1) {
        repeatCustomers++;
      } else if (purchaseCount === 1) {
        newCustomers++;
      }
    }

    return NextResponse.json({
      success: true,
      repeat: repeatCustomers,
      new: newCustomers,
      total: repeatCustomers + newCustomers,
    });
  } catch (error: any) {
    console.error("[RepeatVsNew] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch customer data",
        details: error?.message || "Unknown error",
        repeat: 0,
        new: 0,
        total: 0,
      },
      { status: 500 }
    );
  }
}


