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
 * Normalize follow-up date from various formats to YYYY-MM-DD (HTML date input format)
 * Handles formats like: "25th Dec 2025", "28th Dec 2025", "25-12-2025", "25/12/2025", etc.
 */
function normalizeFollowUpDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  
  const str = String(dateStr).trim();
  if (!str) return "";

  // Format: "25th Dec 2025" or "28th Dec 2025"
  const monthMap: { [key: string]: string } = {
    jan: "01", january: "01",
    feb: "02", february: "02",
    mar: "03", march: "03",
    apr: "04", april: "04",
    may: "05",
    jun: "06", june: "06",
    jul: "07", july: "07",
    aug: "08", august: "08",
    sep: "09", sept: "09", september: "09",
    oct: "10", october: "10",
    nov: "11", november: "11",
    dec: "12", december: "12"
  };

  // Match "25th Dec 2025" or "25 Dec 2025"
  let match = str.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)\s+(\d{4})/i);
  if (match) {
    const [, day, monthName, year] = match;
    const month = monthMap[monthName.toLowerCase()];
    if (month) {
      return `${year}-${month}-${day.padStart(2, "0")}`;
    }
  }

  // DD-MM-YYYY format
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const parts = str.split("-");
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }

  // DD/MM/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split("/");
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const parts = str.split("-");
    return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
  }

  // MM/DD/YYYY format (US)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split("/");
    // Assume DD/MM/YYYY for non-US context (already handled above)
  }

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
    cashAmount: String(it.cashAmount ?? ""),
    followUpsDate: normalizeFollowUpDate(it.followUpsDate ?? it.followupDate ?? it.followUpDate ?? ""),
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
You are an OCR field extractor for ShreeLalji Dairy daily sales sheet. Read the grid and output ONLY JSON matching the sheet structure below. Do not add markdown or explanations.

CRITICAL ROW ISOLATION RULES (MUST FOLLOW):
- Treat each horizontal row as a fully independent record.(very important)
- NEVER copy, infer, or borrow values from the previous or next row.
- If a value is not clearly present within the SAME row boundaries, return "" or "0" as applicable.
- Do NOT assume repeated values (e.g., price, sale qty, delivery person) continue across rows.
- Sale Qty, Sample Qty, and Rep Qty MUST come from the same visual row as the customer name.
- If two adjacent rows have similar layouts, do NOT merge or shift numbers between them.

Expected JSON:
{
  "top": {
    "date":"",      // top header date (as written)
    "balPkt":"",    // BAL PKT from header
    "totalPkt":"",  // TOTAL PKT from header
    "newPkt":"",    // NEW PKT from header
    "shift":""      // header shift text (if missing, "")
  },
  "items": [
    {
      "no":"",            // row serial no
      "shopName":"",      // customer name
      "address":"",       // address/area
      "samp":"",          // Sample Qty
      "rep":"",           // Replacement Qty
      "sale":"",          // Sale Qty
      "cash":"",          // (legacy) keep "" if not present
      "delPerson":"",     // Delivery Person
      "phonenumber":"",   // phone/mobile
      "packetPrice":"",   // price per packet
      "cashAmount":"",    // Cash Amount
      "followUpsDate":"", // Follow Up Date (YYYY-MM-DD if parsed, else empty)
      "balanceAmount":""  // Balance Amount or BAL AMT
    }
  ]
}

Sheet column order (left to right):
1 sr | 2 customer name | 3 address | 4 price (packet price) | 5 sample qty | 6 rep qty | 7 sale qty | 8 cash amt | 9 bal amt | 10 delivery person | 11 follow up date. Use this order to map values.

Top header fields:
- date: read from top header line (e.g., "DATE 01-01-26"). Return exactly as written.
- balPkt: from "BAL PKT" header.
- newPkt: from "NEW PKT" header.
- totalPkt: from "TOTAL PKT" header.
- shift: if a shift label exists, return it; otherwise "".

Field rules:
- Always output valid JSON only. No markdown, no comments.
- Use empty string "" when a cell is blank or unreadable.
- Remove currency symbols and commas; keep plain numbers as strings.
- packetPrice, samp, rep, sale, cashAmount, balanceAmount: numeric strings ("0" if blank).
- phonenumber: numeric string; if absent, "".
- followUpsDate: if a date is present, convert to YYYY-MM-DD; if unclear, return "".

Row extraction discipline:
- Respect the grid columns; do not mix Cash Amount with Balance Amount.
- Use the visible serial number as "no"; keep row order.
- Only include rows that have a customer name.

Return JSON only.
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
