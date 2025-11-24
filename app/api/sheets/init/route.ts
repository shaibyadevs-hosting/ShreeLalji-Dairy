// app/api/sheets/init/route.ts
import { NextRequest, NextResponse } from "next/server";
import { initializeSheets } from "@/lib/googleSheets";

export async function POST(req: NextRequest) {
  try {
    console.log("[InitSheets] Initializing Google Sheets...");

    await initializeSheets();

    return NextResponse.json({
      success: true,
      message: "Google Sheets initialized successfully",
    });
  } catch (error: any) {
    console.error("[InitSheets] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize sheets",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
