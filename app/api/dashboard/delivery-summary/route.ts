// app/api/dashboard/delivery-summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDeliverySummary } from "@/lib/googleSheets";

export async function GET(req: NextRequest) {
  try {
    console.log("[DeliverySummary API] Fetching delivery person summary...");

    const summaryData = await getDeliverySummary();

    // Calculate totals
    const totals = summaryData.reduce(
      (acc, item) => ({
        totalOrders: acc.totalOrders + item.totalOrders,
        totalSaleAmount: acc.totalSaleAmount + item.totalSaleAmount,
        totalCashAmount: acc.totalCashAmount + item.totalCashAmount,
      }),
      { totalOrders: 0, totalSaleAmount: 0, totalCashAmount: 0 }
    );

    // Find top performer (by orders)
    const topPerformer = summaryData.length > 0 ? summaryData[0].deliveryPerson : null;

    console.log(
      `[DeliverySummary API] ✅ Found ${summaryData.length} delivery persons`
    );

    return NextResponse.json({
      success: true,
      summary: summaryData,
      totals,
      topPerformer,
      count: summaryData.length,
    });
  } catch (error: any) {
    console.error("[DeliverySummary API] ❌ Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch delivery summary",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
