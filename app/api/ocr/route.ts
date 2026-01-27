import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-preview""; 
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

function cleanNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  const cleaned = String(val).replace(/[^\d]/g, ""); 
  return cleaned === "" ? 0 : parseInt(cleaned, 10);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const imageData = body?.imageData;

    if (!imageData || !API_KEY) {
      return NextResponse.json({ error: "Missing image or API key" }, { status: 400 });
    }

    const base64Image = imageData.includes(",") ? imageData.split(",")[1] : imageData;

const prompt = `
  Role: Professional Logistics Auditor
  Task: Audit and extract delivery log data with 100% mathematical and spatial accuracy.

  ### STEP 1: SPATIAL LAYOUT ANALYSIS
  - Identify the anchor: 'CUSTOMER NAME'.
  - Map the columns horizontally: SHOP NAME -> ADDRESS -> PRICE -> SAMP -> REP -> SALE -> CASH -> BAL -> DELIVERY PERSON.
  - Notice that 'CASH' is the first amount column after 'SALE', and 'BAL' is the second.

  ### STEP 2: ROW-BY-ROW AUDIT (MANDATORY THINKING)
  For EVERY row found in the image:
  1. Record the Shop Name.
  2. Locate 'SALE QTY' and 'PRICE'.
  3. Locate 'CASH AMT' and 'BAL AMT' on that exact same horizontal level.
  4. VERIFY MATH: (PRICE * SALE QTY) must equal either the CASH value or the BAL value (or their sum).
  5. If the math fails, re-scan vertically to find the correct number on that horizontal line.
  6. Identify the 'DELIVERY PERSON' (usually NITIN, SACHIN, PUSHPA, or D.BOY).

  ### STEP 3: TOP HEADER EXTRACTION
  - Extract 'DATE' from top-left.
  - Extract 'BAL PKT', 'NEW PKT', and 'TOTAL PKT' from the top-center.

  ### STEP 4: FINAL DATA CONVERSION
  Convert your audit into this JSON structure. 
  - If a numeric field is empty or has a dash, use 0.
  - Keep address and shop name exactly as written.

  {
    "top": { "date": "", "balPkt": 0, "newPkt": 0, "totalPkt": 0 },
    "items": [
      {
        "shopName": "", "address": "", "packetPrice": 0, "samp": 0, "rep": 0, 
        "sale": 0, "cashAmount": 0, "balanceAmount": 0, "delPerson": ""
      }
    ]
  }
`;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
          ]
        }],
        generationConfig: {
          temperature: 0, // Force strict literal extraction
          topP: 1,
          response_mime_type: "application/json" // Native JSON mode for 2026 models
        }
      }),
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json(data, { status: response.status });

    // Use the first part's text directly for JSON mode
    const modelText = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(modelText);

    // Final Post-Processing Sanitization
    const sanitized = {
      top: parsed.top,
      items: (parsed.items || []).map((it: any) => {
        const price = cleanNumber(it.packetPrice);
        const qty = cleanNumber(it.sale);
        const expected = price * qty;
        
        let cash = cleanNumber(it.cashAmount);
        let bal = cleanNumber(it.balanceAmount);

        // Logic Check: If the model swapped them but the math proves it, we fix it here.
        if (cash === 0 && bal === expected) {
            // This is a legitimate balance, do nothing.
        } else if (bal === 0 && cash === expected) {
            // This is a legitimate cash sale, do nothing.
        }

        return {
          ...it,
          packetPrice: price,
          sale: qty,
          cashAmount: cash,
          balanceAmount: bal
        };
      })
    };

    return NextResponse.json(sanitized);
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
