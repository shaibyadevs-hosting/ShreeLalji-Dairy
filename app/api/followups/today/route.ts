// app/api/followups/today/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  ensureCallFollowUpsSheet,
  getTodayCalls,
} from "@/lib/googleSheets";

export async function GET(req: NextRequest) {
  try {
    // Ensure sheet exists
    await ensureCallFollowUpsSheet();

    // Get today's calls
    const calls = await getTodayCalls();

    return NextResponse.json({
      success: true,
      calls,
      count: calls.length,
    });
  } catch (error: any) {
    console.error("[GetTodayCalls] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch today's calls",
        details: error?.message || "Unknown error",
        calls: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}


