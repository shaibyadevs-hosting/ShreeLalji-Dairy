// app/api/followups/save-batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  ensureCallFollowUpsSheet,
  batchSaveCallFollowUps,
} from "@/lib/googleSheets";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const calls = body?.calls;

    if (!Array.isArray(calls) || calls.length === 0) {
      return NextResponse.json(
        {
          error: "Missing or empty calls array",
        },
        { status: 400 }
      );
    }

    // Validate each call
    for (const call of calls) {
      if (!call.name || !call.phone || !call.callDate || !call.callTime) {
        return NextResponse.json(
          {
            error: "Each call must have: name, phone, callDate, callTime",
          },
          { status: 400 }
        );
      }
    }

    // Ensure sheet exists
    await ensureCallFollowUpsSheet();

    // Batch save calls
    const result = await batchSaveCallFollowUps(
      calls.map((call) => ({
        name: String(call.name).trim(),
        phone: String(call.phone).trim(),
        callDate: String(call.callDate).trim(),
        callTime: String(call.callTime).trim(),
        notes: call.notes ? String(call.notes).trim() : "",
      }))
    );

    return NextResponse.json({
      success: true,
      message: `Saved ${result.saved} call(s), skipped ${result.duplicates} duplicate(s)`,
      saved: result.saved,
      duplicates: result.duplicates,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error("[SaveBatchFollowUps] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to save call follow-ups",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

