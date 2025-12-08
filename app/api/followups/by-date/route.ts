// app/api/followups/by-date/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  ensureCallFollowUpsSheet,
  getCallsByDate,
} from "@/lib/googleSheets";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        {
          error: "Missing required parameter: date (format: DD-MM-YYYY)",
        },
        { status: 400 }
      );
    }

    // Ensure sheet exists
    await ensureCallFollowUpsSheet();

    // Get calls by date
    const calls = await getCallsByDate(date);

    return NextResponse.json({
      success: true,
      date,
      calls,
      count: calls.length,
    });
  } catch (error: any) {
    console.error("[GetCallsByDate] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch calls by date",
        details: error?.message || "Unknown error",
        calls: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}


