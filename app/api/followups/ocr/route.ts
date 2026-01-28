// app/api/followups/ocr/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_API;
const MODEL = "gemini-3-pro-preview";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

/**
 * Extract model text from Gemini response
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
 * Normalize date to DD-MM-YYYY format
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";
  const str = String(dateStr).trim();
  if (!str) return "";

  // Try DD/MM/YYYY or DD-MM-YYYY
  let match = str.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (match) {
    const [, day, month, year] = match;
    const fullYear = year.length === 2 ? (parseInt(year) < 50 ? `20${year}` : `19${year}`) : year;
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${fullYear}`;
  }

  // Try YYYY-MM-DD or YYYY/MM/DD
  match = str.match(/(\d{2,4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (match) {
    const [, year, month, day] = match;
    const fullYear = year.length === 2 ? (parseInt(year) < 50 ? `20${year}` : `19${year}`) : year;
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${fullYear}`;
  }

  return str;
}

/**
 * Normalize time to HH:mm format
 */
function normalizeTime(timeStr: string): string {
  if (!timeStr) return "";
  const str = String(timeStr).trim();
  
  // Already in HH:mm format
  if (/^\d{2}:\d{2}$/.test(str)) {
    return str;
  }
  
  // Try to extract time from various formats
  const timeMatch = str.match(/(\d{1,2}):?(\d{2})/);
  if (timeMatch) {
    const [, hours, minutes] = timeMatch;
    return `${hours.padStart(2, "0")}:${minutes}`;
  }
  
  return str;
}

/**
 * Validate date format (DD-MM-YYYY)
 */
function isValidDate(dateStr: string): boolean {
  const match = dateStr.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (!match) return false;
  const [, day, month, year] = match;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return (
    date.getDate() === parseInt(day) &&
    date.getMonth() === parseInt(month) - 1 &&
    date.getFullYear() === parseInt(year)
  );
}

/**
 * Validate time format (HH:mm)
 */
function isValidTime(timeStr: string): boolean {
  return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageData = body?.imageData;

    if (!imageData) {
      return NextResponse.json(
        { error: "No image data provided" },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        {
          error: "Gemini API key not configured",
          details: "Please set GEMINI_API_KEY or GEMINI_API in your environment variables",
        },
        { status: 500 }
      );
    }

    console.log("[FollowUpOCR] === START OCR REQUEST ===");
    console.log("[FollowUpOCR] Image data size:", imageData.length, "bytes");

    // Extract base64 from data URL if needed
    let base64Image = imageData;
    if (imageData.startsWith("data:image")) {
      base64Image = imageData.split(",")[1];
      console.log("[FollowUpOCR] Extracted base64 from data URL");
    }

    const prompt = `
You are an extractor for ShreeLalJI Dairy Follow-Up Call Reminders OCR. Analyze the handwritten/typed call reminder sheet image.

TASK: Return ONLY valid JSON array:
[
  {
    "name": "",
    "callDate": "",
    "callTime": "",
    "notes": ""
  }
]

IMPORTANT EXTRACTION RULES:
1. Return ONLY JSON array, no explanation or metadata
2. Extract ALL visible rows from the image
3. For each row, extract:
   - name: Customer/Person/shopname name (REQUIRED - this is the unique identifier)
   - callDate: Date in DD-MM-YYYY format (or as written, we'll normalize)
   - callTime: Time in HH:mm format (24-hour format preferred)
   - notes: Any additional notes or comments (optional)
4. If a field is missing or unclear, use empty string ""
5. Dates: Extract as written (DD/MM/YYYY, DD-MM-YYYY, etc.)
6. Times: Extract in 24-hour format if possible (HH:mm)
7. Return empty array [] if no valid data found
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

    console.log("[FollowUpOCR] Sending to Gemini...");
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorCode = data?.error?.code;
      const errorMessage = data?.error?.message || "";

      if (errorCode === 429) {
        console.error("[FollowUpOCR] ❌ Rate limit exceeded");
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            details: "You've exceeded your Gemini API quota. Please try again later.",
            code: 429,
          },
          { status: 429 }
        );
      }

      console.error("[FollowUpOCR] Gemini API error:", {
        code: errorCode,
        message: errorMessage,
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
    console.log("[FollowUpOCR] Extracted model text:", modelText.substring(0, 300));

    // Parse JSON from response
    let parsed: any[] = [];
    try {
      // Try to extract JSON array from response
      const jsonMatch = modelText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing entire response
        parsed = JSON.parse(modelText);
      }

      if (!Array.isArray(parsed)) {
        return NextResponse.json(
          {
            error: "Invalid response format",
            details: "Expected JSON array but got different format",
            raw: modelText.substring(0, 500),
          },
          { status: 500 }
        );
      }
    } catch (err) {
      console.error("[FollowUpOCR] JSON parse error:", err);
      return NextResponse.json(
        {
          error: "Could not parse JSON from OCR response",
          raw: modelText.substring(0, 500),
        },
        { status: 500 }
      );
    }

    // Validate and normalize extracted data
    const validCalls: any[] = [];
    const invalidCalls: any[] = [];

    for (const item of parsed) {
      const name = String(item.name || "").trim();
      const callDate = normalizeDate(String(item.callDate || ""));
      const callTime = normalizeTime(String(item.callTime || ""));
      const notes = String(item.notes || "").trim();

      // Validate required fields (name is the unique identifier now, not phone)
      if (!name || !callDate || !callTime) {
        invalidCalls.push({ ...item, reason: "Missing required fields (name, callDate, callTime)" });
        continue;
      }

      if (!isValidDate(callDate)) {
        invalidCalls.push({ ...item, reason: "Invalid date format" });
        continue;
      }

      if (!isValidTime(callTime)) {
        invalidCalls.push({ ...item, reason: "Invalid time format" });
        continue;
      }

      validCalls.push({
        name,
        callDate,
        callTime,
        notes,
      });
    }

    console.log(`[FollowUpOCR] Valid calls: ${validCalls.length}, Invalid: ${invalidCalls.length}`);

    if (validCalls.length === 0) {
      return NextResponse.json(
        {
          error: "No valid calls found",
          details: invalidCalls.length > 0 
            ? `Found ${parsed.length} entries but none were valid. Issues: ${invalidCalls.map(c => c.reason).join(", ")}`
            : "No call data could be extracted from the image",
          invalidCalls,
        },
        { status: 400 }
      );
    }

    console.log("[FollowUpOCR] === END OCR REQUEST ===");
    return NextResponse.json({
      success: true,
      calls: validCalls,
      count: validCalls.length,
      invalidCount: invalidCalls.length,
      invalidCalls: invalidCalls.length > 0 ? invalidCalls : undefined,
    });
  } catch (err: any) {
    console.error("[FollowUpOCR] Route error:", err?.message);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


