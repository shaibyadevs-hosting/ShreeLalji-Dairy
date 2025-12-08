// app/api/followups/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateCallStatus } from "@/lib/googleSheets";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.phone || !body.callDate) {
      return NextResponse.json(
        {
          error: "Missing required fields: phone, callDate",
        },
        { status: 400 }
      );
    }

    // Update status
    await updateCallStatus(
      String(body.phone).trim(),
      String(body.callDate).trim()
    );

    return NextResponse.json({
      success: true,
      message: "Call status updated to Called",
    });
  } catch (error: any) {
    console.error("[UpdateCallStatus] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to update call status",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

