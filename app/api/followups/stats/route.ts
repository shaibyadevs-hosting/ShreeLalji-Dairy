// app/api/followups/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  ensureCallFollowUpsSheet,
  getAllCalls,
} from "@/lib/googleSheets";

export async function GET(_req: NextRequest) {
  try {
    // Ensure sheet exists
    await ensureCallFollowUpsSheet();

    // Get all calls
    const calls = await getAllCalls();

    // Calculate stats
    const totalCalls = calls.length;
    const pendingCalls = calls.filter(
      (call) => call.status.toLowerCase() === "pending"
    ).length;
    const completedCalls = calls.filter(
      (call) => call.status.toLowerCase() === "called"
    ).length;

    return NextResponse.json({
      success: true,
      stats: {
        total: totalCalls,
        pending: pendingCalls,
        completed: completedCalls,
      },
    });
  } catch (error: any) {
    console.error("[GetFollowUpsStats] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch follow-up stats",
        details: error?.message || "Unknown error",
        stats: {
          total: 0,
          pending: 0,
          completed: 0,
        },
      },
      { status: 500 }
    );
  }
}

