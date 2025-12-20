// app/api/followups/pending/route.ts
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

    // Filter only pending calls
    const pendingCalls = calls.filter(
      (call) => call.status.toLowerCase() === "pending"
    );

    return NextResponse.json({
      success: true,
      calls: pendingCalls,
      count: pendingCalls.length,
    });
  } catch (error: any) {
    console.error("[GetPendingCalls] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pending calls",
        details: error?.message || "Unknown error",
        calls: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}

