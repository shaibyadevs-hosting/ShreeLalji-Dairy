// app/api/bills/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { processBill } from "@/lib/googleSheets";
import { BillData } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.customerName || !body.phoneNumber || !body.totalAmount) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: customerName, phoneNumber, totalAmount",
        },
        { status: 400 }
      );
    }

    const billData: BillData = {
      date:
        body.date ||
        new Date().toLocaleDateString("en-GB").split("/").join("-"),
      billNumber: body.billNumber,
      customerName: body.customerName,
      phoneNumber: body.phoneNumber,
      products: body.products || "",
      quantity: body.quantity || "",
      price: body.price || "",
      totalAmount: body.totalAmount,
      paymentMethod: body.paymentMethod || "Cash",
      notes: body.notes,
      imageSource: body.imageSource,
      timestamp: new Date().toISOString(),
      shift: body.shift,
      address: body.address,
    };

    console.log("[SaveBill] Processing bill data:", billData);

    await processBill(billData);

    return NextResponse.json({
      success: true,
      message: "Bill saved and customer updated successfully",
    });
  } catch (error: any) {
    console.error("[SaveBill] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to save bill",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
