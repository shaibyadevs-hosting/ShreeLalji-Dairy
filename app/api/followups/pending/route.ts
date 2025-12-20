// app/api/followups/pending/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  ensureCallFollowUpsSheet,
  getAllPendingCalls,
} from "@/lib/googleSheets";

export async function GET(req: NextRequest) {
  try {
    // Ensure sheet exists
    await ensureCallFollowUpsSheet();

    // Get all pending calls
    const calls = await getAllPendingCalls();

    return NextResponse.json({
      success: true,
      calls,
      count: calls.length,
    });
  } catch (error: any) {
    console.error("[GetPendingCalls] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch pending calls",
        details: error?.message || "Unknown error",
        calls: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}

