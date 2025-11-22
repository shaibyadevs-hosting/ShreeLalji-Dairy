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

// --- Replace inline key with process.env in production ---
const API_KEY = "AIzaSyD8xpTjAdl5H6ECVRZkgrXAZ2Eh38Q6Scw";
const MODEL = "gemini-2.0-flash";
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
 * Ensure returned top and items have proper defaults and shape expected by client.
 */
function sanitizeResult(parsed: any) {
  const topRaw = parsed?.top ?? {};
  const top = {
    date: String(topRaw.date ?? ""),
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
      "delPerson":""
    }
  ]
}

RULES:
1. Return ONLY JSON, no explanation
2. Preserve sheet order
3. Empty string "" for unknown fields
4. No extra metadata
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

    console.log("[OCR] Sending to Gemini...");
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log("[OCR] Gemini response status:", response.status);
    console.log("[OCR] Gemini response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("[OCR] Gemini API error:", data);
      return NextResponse.json({ error: "Gemini API error", details: data }, { status: 500 });
    }

    const modelText = extractModelText(data);
    console.log("[OCR] Extracted model text:", modelText.substring(0, 300));

    let parsed: any;
    try {
      parsed = JSON.parse(modelText);
    } catch (err) {
      const match = String(modelText).match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return NextResponse.json({ error: "Could not parse JSON", raw: modelText.substring(0, 500) }, { status: 500 });
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
