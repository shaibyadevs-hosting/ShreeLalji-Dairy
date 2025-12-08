// app/api/dashboard/todays-followups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTodayCalls } from "@/lib/googleSheets";

export async function GET(_req: NextRequest) {
  try {
    const calls = await getTodayCalls();

    return NextResponse.json({
      success: true,
      calls,
      count: calls.length,
    });
  } catch (error: any) {
    console.error("[TodaysFollowups] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch today's follow-ups",
        details: error?.message || "Unknown error",
        calls: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}


