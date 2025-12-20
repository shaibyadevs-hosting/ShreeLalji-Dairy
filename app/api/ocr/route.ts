// app/api/ocr/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * OCR API route -> calls Google Gemini (gemini-2.5-flash) generateContent
 * - If client doesn't send image_url, uses local fallback path (from conversation)
 *
 * IMPORTANT:
 * - For production, move API key to process.env.GEMINI_API_KEY and do NOT hardcode.
 * - Ensure Gemini can access the image_url (public URL or multimodal upload).
 */

// Next.js automatically loads .env.local, no need for dotenv
const API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_API;

if (API_KEY) {
  console.log(
    `[OCR] ✅ Gemini API key loaded from ${
      process.env.GEMINI_API_KEY ? "GEMINI_API_KEY" : "GEMINI_API"
    } (length: ${API_KEY.length})`
  );
} else {
  console.error(
    "[OCR] ❌ Gemini API key missing (GEMINI_API_KEY / GEMINI_API not set)"
  );
}

const MODEL = "gemini-2.5-flash";

if (!API_KEY) {
  console.error("[OCR] ❌ GEMINI_API_KEY is not set in environment variables");
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;


/**
 * Helper: try to extract human text output from various Gemini response shapes
 */
function extractModelText(respObj: any): string {
  if (!respObj) return "";
  if (Array.isArray(respObj.candidates) && respObj.candidates.length > 0) {
    const c = respObj.candidates[0];
    if (c?.content?.parts && Array.isArray(c.content.parts)) {
      return c.content.parts.map((p: any) => (p.text ?? p.rawText ?? "")).join("\n");
    }
  }
  return JSON.stringify(respObj);
}

/**
 * Normalize date from any format to DD-MM-YYYY
 * Accepts formats like: 17/09/2025, 17-09-25, 17-09-2025, 17/09/25, etc.
 */
function normalizeDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  
  const str = String(dateStr).trim();
  if (!str) return "";

  // Try to parse various date formats
  // Format 1: DD/MM/YYYY or DD/MM/YY
  let match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (match) {
    const [, day, month, year] = match;
    const fullYear = year.length === 2 ? (parseInt(year) < 50 ? `20${year}` : `19${year}`) : year;
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${fullYear}`;
  }

  // Format 2: DD-MM-YYYY or DD-MM-YY
  match = str.match(/(\d{1,2})-(\d{1,2})-(\d{2,4})/);
  if (match) {
    const [, day, month, year] = match;
    const fullYear = year.length === 2 ? (parseInt(year) < 50 ? `20${year}` : `19${year}`) : year;
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${fullYear}`;
  }

  // Format 3: YYYY-MM-DD or YY-MM-DD
  match = str.match(/(\d{2,4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const [, year, month, day] = match;
    const fullYear = year.length === 2 ? (parseInt(year) < 50 ? `20${year}` : `19${year}`) : year;
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${fullYear}`;
  }

  // Format 4: YYYY/MM/DD or YY/MM/DD
  match = str.match(/(\d{2,4})\/(\d{1,2})\/(\d{1,2})/);
  if (match) {
    const [, year, month, day] = match;
    const fullYear = year.length === 2 ? (parseInt(year) < 50 ? `20${year}` : `19${year}`) : year;
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${fullYear}`;
  }

  // If no pattern matches, return as-is (might already be in correct format)
  return str;
}

/**
 * Ensure returned top and items have proper defaults and shape expected by client.
 */
function sanitizeResult(parsed: any) {
  const topRaw = parsed?.top ?? {};
  const rawDate = String(topRaw.date ?? "");
  const normalizedDate = normalizeDate(rawDate);
  
  const top = {
    date: normalizedDate,
    balPkt: String(topRaw.balPkt ?? topRaw["Bal PKT"] ?? ""),
    totalPkt: String(topRaw.totalPkt ?? topRaw["Total PKT"] ?? ""),
    newPkt: String(topRaw.newPkt ?? topRaw["New PKT"] ?? ""),
    shift: String(topRaw.shift ?? ""),
  };

  const itemsRaw = Array.isArray(parsed?.items) ? parsed.items : [];
  const items = itemsRaw.map((it: any, idx: number) => ({
    no: String(it.no ?? idx + 1),
    shopName: String(it.shopName ?? it.name ?? ""),
    address: String(it.address ?? ""),
    samp: String(it.samp ?? ""),
    rep: String(it.rep ?? ""),
    sale: String(it.sale ?? ""),
    cash: String(it.cash ?? ""),
    delPerson: String(it.delPerson ?? ""),
    phonenumber: String(it.phonenumber ?? it.phone ?? it.phoneNumber ?? ""),
    packetPrice: String(it.packetPrice ?? ""),
    paymentStatus: String(it.paymentStatus ?? it.payment ?? it.status ?? ""),
    balanceAmount: String(it.balanceAmount ?? it.balance ?? it.dueAmount ?? it.outstanding ?? ""),
  }));

  return { top, items };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const imageData = body?.imageData;

    if (!imageData) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    console.log("[OCR] === START OCR REQUEST ===");
    console.log("[OCR] Image data size:", imageData.length, "bytes");

    // Extract base64 from data URL if needed
    let base64Image = imageData;
    if (imageData.startsWith("data:image")) {
      base64Image = imageData.split(",")[1];
      console.log("[OCR] Extracted base64 from data URL");
    }

    const prompt = `
You are an extractor for ShreeLalJI Dairy SalesTrack OCR. Analyze the handwritten/typed sales sheet image.

TASK: Return ONLY valid JSON:
{
  "top": {
    "date":"",
    "balPkt":"",
    "totalPkt":"",
    "newPkt":"",
    "shift":""
  },
  "items": [
    {
      "no":"",
      "shopName":"",
      "address":"",
      "samp":"",
      "rep":"",
      "sale":"",
      "cash":"",
      "delPerson":"",
      "phonenumber":"",
      "packetPrice":"",
      "paymentStatus":"",
      "balanceAmount":""
    }
  ]
}

IMPORTANT EXTRACTION RULES:
1. Return ONLY valid JSON, no explanation, no markdown, no code blocks
2. Preserve sheet order exactly as shown
3. Empty string "" for unknown or missing fields
4. No extra metadata or comments in JSON
5. DATE: Extract the date from the top header section. Accept ANY date format (e.g., 17/09/2025, 17-09-25, 17-09-2025, 17/09/25, etc.). Return exactly as written.
6. PHONE NUMBER: Extract from "Mobile Number" column. Include all 10 digits. If missing, use empty string "".
7. SHOP NAME: Extract from "Shop / Customer Name" column.
8. ADDRESS/AREA: Extract from "Area" column into the address field.
9. PACKET PRICE: Extract from "Price / Packet (₹)" column. Extract as number string (e.g., "195", "185", "190"). Remove ₹ symbol if present.
10. SAMPLE QTY: Extract from "Sample Qty" column. Extract as number string (e.g., "0", "2", "1").
11. SALE QTY: Extract from "Sale Qty" column. Extract as number string (e.g., "0", "3", "4", "6").
12. REPLACEMENT QTY: Extract from "Replacement Qty" column into the rep field. Extract as number string (e.g., "0", "1").
13. DELIVERY PERSON: Extract from "Delivery Person" column. Should be "Nitin" or "Pushpa".
14. PAYMENT STATUS (CRITICAL - COLUMN 8): Extract the ACTUAL CELL VALUE from the "Payment Status" column for EACH DATA ROW.
    - IMPORTANT: The column HEADER is "Payment Status" - DO NOT extract this header text
    - Extract the VALUE inside each DATA CELL below the header row
    - For Row 1: Look at the cell in Payment Status column, Row 1 - extract "Paid" or "Balance" (the actual value)
    - For Row 2: Look at the cell in Payment Status column, Row 2 - extract "Paid" or "Balance" (the actual value)
    - Continue for all rows
    - Extract the status text from each cell:
      * If cell shows "Paid", extract "Paid" (not "Payment Status")
      * If cell shows "Balance", extract "Balance" (not "Payment Status")
      * If cell shows "Pending", extract "Pending"
      * Extract EXACTLY what is written in the DATA CELL, not the column header
    - Example: If header says "Payment Status" and Row 1 cell says "Paid", extract "Paid" (not "Payment Status")
    - If cell is empty, use empty string ""
15. BALANCE AMOUNT (CRITICAL - COLUMN 9): Extract the ACTUAL NUMERIC VALUE from the "Balance Amount (₹)" column for EACH DATA ROW.
    - IMPORTANT: The column HEADER is "Balance Amount (₹)" - DO NOT extract this header text
    - Extract the NUMERIC VALUE inside each DATA CELL below the header row
    - For Row 1: Look at the cell in Balance Amount column, Row 1 - extract the number like "0", "370", etc.
    - For Row 2: Look at the cell in Balance Amount column, Row 2 - extract the number like "0", "370", etc.
    - Continue for all rows
    - Extract the numeric value from each cell:
      * If cell shows "0" or "0.00", extract "0" (not "Balance Amount")
      * If cell shows "370", extract "370" (not "Balance Amount")
      * If cell shows "360", extract "360"
      * If cell shows "600", extract "600"
      * Extract ONLY the NUMBER from the cell, not the words "Balance" or "Amount"
    - Remove currency symbol ₹ if present in the cell value
    - Remove commas if present (e.g., "1,000" becomes "1000")
    - Always extract as plain number string (e.g., "0", "370", "360", "600")
    - Example: If header says "Balance Amount (₹)" and Row 1 cell shows "0", extract "0" (not "Balance Amount")
    - If cell is empty but Payment Status is "Paid", use "0"
    - If cell is empty but Payment Status is "Balance", try to infer from context or use empty string ""
16. CRITICAL ROW-BY-ROW EXTRACTION: For EVERY data row, extract paymentStatus and balanceAmount from that row's cells:
    - Row 1: paymentStatus = value from Payment Status column, Row 1 cell (e.g., "Paid")
             balanceAmount = value from Balance Amount column, Row 1 cell (e.g., "0")
    - Row 2: paymentStatus = value from Payment Status column, Row 2 cell (e.g., "Balance")
             balanceAmount = value from Balance Amount column, Row 2 cell (e.g., "370")
    - Continue for all rows - match each row's values correctly
    - NEVER use the column header text - always use the cell value from that specific row
17. Ensure all JSON strings are properly escaped. Use double quotes for all JSON keys and string values.
18. Return valid JSON only - check that all brackets and braces are properly closed.
19. FINAL REMINDER: Column headers are "Payment Status" and "Balance Amount (₹)" - these are LABELS. 
    Extract the VALUES from the cells below these headers, not the header text itself.
    If you see "Payment Status" as a header and "Paid" in a cell below it, extract "Paid" for that row.
    If you see "Balance Amount (₹)" as a header and "370" in a cell below it, extract "370" for that row.
`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image,
              },
            },
          ],
        },
      ],
    };

    // Check if API key is available
    if (!API_KEY) {
      return NextResponse.json(
        {
          error: "Gemini API key not configured",
          details: "Please set GEMINI_API_KEY or GEMINI_API in your environment variables",
        },
        { status: 500 }
      );
    }

    // Call Gemini API directly
    console.log("[OCR] Sending to Gemini...");
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorCode = data?.error?.code;
      const errorMessage = data?.error?.message || "";

      // Handle invalid API key
      if (errorCode === 400 && errorMessage.includes("API key")) {
        console.error("[OCR] ❌ Invalid API key");
        return NextResponse.json(
          {
            error: "Invalid API key",
            details: "The Gemini API key is invalid or expired. Please check your API key.",
            code: 400,
          },
          { status: 400 }
        );
      }

      // Handle rate limit errors
      if (errorCode === 429) {
        console.error("[OCR] ❌ Rate limit exceeded");
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            details: "You've exceeded your Gemini API quota. Please try again later.",
            code: 429,
          },
          { status: 429 }
        );
      }

      // Other errors
      console.error("[OCR] Gemini API error:", {
        code: errorCode,
        message: errorMessage,
        status: data?.error?.status,
      });
      
      return NextResponse.json(
        {
          error: "Gemini API error",
          details: errorMessage || JSON.stringify(data),
          code: errorCode,
        },
        { status: response.status || 500 }
      );
    }

    const modelText = extractModelText(data);
    console.log("[OCR] Extracted model text:", modelText.substring(0, 500));

    let parsed: any;
    try {
      // First, try to clean the text - remove markdown code blocks if present
      let cleanedText = modelText.trim();
      
      // Remove markdown code blocks (```json ... ```)
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Remove leading/trailing whitespace
      cleanedText = cleanedText.trim();
      
      // Try to find JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the whole cleaned text
        parsed = JSON.parse(cleanedText);
      }
    } catch (err: any) {
      console.error("[OCR] JSON parse error:", err?.message);
      console.error("[OCR] Raw text (first 1000 chars):", modelText.substring(0, 1000));
      
      // Try to extract JSON more aggressively
      try {
        // Try to find JSON between first { and last }
        const firstBrace = modelText.indexOf('{');
        const lastBrace = modelText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonSubstring = modelText.substring(firstBrace, lastBrace + 1);
          parsed = JSON.parse(jsonSubstring);
        } else {
          throw new Error("Could not find JSON structure");
        }
      } catch (retryErr: any) {
        return NextResponse.json(
          {
            error: "Could not parse JSON from OCR response",
            details: err?.message || "Invalid JSON format",
            raw: modelText.substring(0, 1000),
          },
          { status: 500 }
        );
      }
    }

    const result = sanitizeResult(parsed);
    console.log("[OCR] === END OCR REQUEST ===");
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[OCR] Route error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
