// app/api/followups/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  ensureCallFollowUpsSheet,
  saveCallFollowUp,
} from "@/lib/googleSheets";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields (now uses name instead of phone as unique identifier)
    if (!body.name || !body.callDate || !body.callTime) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, callDate, callTime",
        },
        { status: 400 }
      );
    }

    // Ensure sheet exists
    await ensureCallFollowUpsSheet();

    // Save the follow-up
    const result = await saveCallFollowUp({
      name: String(body.name).trim(),
      callDate: String(body.callDate).trim(),
      callTime: String(body.callTime).trim(),
      notes: body.notes ? String(body.notes).trim() : "",
    });

    if (result.duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate call reminder",
          message: "A call reminder with the same shop name, date, and time already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Call follow-up saved successfully",
    });
  } catch (error: any) {
    console.error("[SaveFollowUp] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to save call follow-up",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

