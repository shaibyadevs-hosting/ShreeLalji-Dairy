// lib/googleSheets.ts
import { google, sheets_v4 } from "googleapis";
import {
  BillData,
  CustomerData,
  PurchaseRecord,
  DailyBillsInput,
  DailyBillItem,
} from "./types"; 

// Initialize Google Sheets API
const getGoogleSheetsClient = () => {
  const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;
 
  if (!credentials) {
    throw new Error(
      "GOOGLE_SHEETS_CREDENTIALS not found in environment variables"
    );
  }

  const parsedCredentials = JSON.parse(credentials);

  const auth = new google.auth.GoogleAuth({
    credentials: parsedCredentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
};

/**
 * Export getSheetsClient for Daily Bills functionality
 */
export function getSheetsClient() {
  return getGoogleSheetsClient();
}

const SPREADSHEET_ID = "1OwmfDCO3AGBnHlViha2FPRySaGLPDPle106T0p3W-RA";

if (!SPREADSHEET_ID) {
  throw new Error("GOOGLE_SPREADSHEET_ID not found in environment variables");
}

const DAILY_BILLS_SHEET = "Daily Bills";
const MASTER_CUSTOMER_SHEET = "MasterCustomers";
const MASTER_CUSTOMER_HEADERS = [
  "Customer Name",
  "Phone Number",
  "Address",
  "Total Purchase Count",
  "Total Amount Spent",
  "Last Purchase Date",
  "Purchase History",
  "Flag",
  "Last Modified",
];

// Helper: Normalize phone number (remove spaces, dashes, etc.)
const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/[\s\-\(\)]/g, "");
};

// Helper: Format date to DD-MM-YYYY
const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper: Parse date from DD-MM-YYYY to Date object
const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Append a new bill to the Daily Bills sheet
 */
export async function appendBillToSheet(billData: BillData): Promise<void> {
  const sheets = getGoogleSheetsClient();

  const timestamp = billData.timestamp || new Date().toISOString();
  const formattedDate = billData.date || formatDate(new Date());

  const row = [
    formattedDate,
    billData.billNumber || "",
    billData.customerName,
    normalizePhoneNumber(billData.phoneNumber),
    billData.products,
    billData.quantity,
    billData.price,
    billData.totalAmount,
    billData.paymentMethod || "Cash",
    billData.notes || "",
    billData.imageSource || "",
    timestamp,
    billData.shift || "",
    billData.address || "",
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${DAILY_BILLS_SHEET}!A:N`,
    valueInputOption: "RAW",
    requestBody: {
      values: [row],
    },
  });

  console.log("[GoogleSheets] ✅ Bill appended to Daily Bills sheet");
}

const isMissingSheetError = (error: any): boolean => {
  const message =
    error?.errors?.[0]?.message ||
    error?.message ||
    (typeof error === "string" ? error : "");
  return (
    (typeof error?.code === "number" &&
      (error.code === 400 || error.code === 404)) ||
    message.includes("Unable to parse range") ||
    message.includes("Requested entity was not found") ||
    message.includes("Sheet not found")
  );
};

/**
 * Get all bills from Daily Bills sheet
 */
export async function getAllBills(): Promise<BillData[]> {
  const sheets = getGoogleSheetsClient();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${DAILY_BILLS_SHEET}!A2:N`, // Skip header row
    });

    const rows = response.data.values || [];

    return rows.map((row) => ({
      date: row[0] || "",
      billNumber: row[1] || "",
      customerName: row[2] || "",
      phoneNumber: row[3] || "",
      products: row[4] || "",
      quantity: row[5] || "",
      price: row[6] || "",
      totalAmount: row[7] || "",
      paymentMethod: row[8] || "",
      notes: row[9] || "",
      imageSource: row[10] || "",
      timestamp: row[11] || "",
      shift: row[12] || "",
      address: row[13] || "",
    }));
  } catch (error) {
    if (isMissingSheetError(error)) {
      console.warn(
        "[GoogleSheets] Daily Bills sheet missing, returning empty result"
      );
      return [];
    }
    throw error;
  }
}

/**
 * Find a customer by phone number in Master Customer sheet
 */

export async function findCustomerByPhone(
  phoneNumber: string
): Promise<{ customer: CustomerData | null; rowIndex: number }> {
  const sheets = getGoogleSheetsClient();
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${MASTER_CUSTOMER_SHEET}!A2:H`, // Skip header row
  });

  const rows = response.data.values || [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const customerPhone = normalizePhoneNumber(row[1] || "");

    if (customerPhone === normalizedPhone) {
      let purchaseHistory: PurchaseRecord[] = [];
      try {
        purchaseHistory = row[7] ? JSON.parse(row[7]) : [];
      } catch (e) {
        console.error("[GoogleSheets] Error parsing purchase history:", e);
      }

      return {
        customer: {
          customerName: row[0] || "",
          phoneNumber: row[1] || "",
          email: row[2] || "",
          address: row[3] || "",
          totalPurchaseCount: parseInt(row[4] || "0"),
          totalAmountSpent: parseFloat(row[5] || "0"),
          lastPurchaseDate: row[6] || "",
          purchaseHistory,
        },
        rowIndex: i + 2, // +2 because sheets are 1-indexed and we skipped header
      };
    }
  }

  return { customer: null, rowIndex: -1 };
}

/**
 * Create a new customer in Master Customer sheet
 */
export async function createCustomer(billData: BillData): Promise<void> {
  const sheets = getGoogleSheetsClient();

  const purchaseHistory: PurchaseRecord[] = [
    {
      date: billData.date || formatDate(new Date()),
      products: billData.products,
      quantity: billData.quantity,
      totalAmount: billData.totalAmount,
      billNumber: billData.billNumber,
    },
  ];

  const row = [
    billData.customerName,
    normalizePhoneNumber(billData.phoneNumber),
    "", // email (optional)
    billData.address || "",
    1, // totalPurchaseCount
    parseFloat(billData.totalAmount) || 0, // totalAmountSpent
    billData.date || formatDate(new Date()), // lastPurchaseDate
    JSON.stringify(purchaseHistory), // purchaseHistory as JSON string
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${MASTER_CUSTOMER_SHEET}!A:H`,
    valueInputOption: "RAW",
    requestBody: {
      values: [row],
    },
  });

  console.log(
    "[GoogleSheets] ✅ New customer created in Master Customer sheet"
  );
}

/**
 * Update existing customer in Master Customer sheet
 */
export async function updateCustomer(
  rowIndex: number,
  existingCustomer: CustomerData,
  billData: BillData
): Promise<void> {
  const sheets = getGoogleSheetsClient();

  const newPurchase: PurchaseRecord = {
    date: billData.date || formatDate(new Date()),
    products: billData.products,
    quantity: billData.quantity,
    totalAmount: billData.totalAmount,
    billNumber: billData.billNumber,
  };

  const updatedPurchaseHistory = [
    ...existingCustomer.purchaseHistory,
    newPurchase,
  ];
  const updatedTotalPurchaseCount = existingCustomer.totalPurchaseCount + 1;
  const updatedTotalAmountSpent =
    existingCustomer.totalAmountSpent + (parseFloat(billData.totalAmount) || 0);
  const updatedLastPurchaseDate = billData.date || formatDate(new Date());

  // Update the address if it's not already set and new bill has address
  const updatedAddress = existingCustomer.address || billData.address || "";

  const row = [
    existingCustomer.customerName,
    normalizePhoneNumber(existingCustomer.phoneNumber),
    existingCustomer.email || "",
    updatedAddress,
    updatedTotalPurchaseCount,
    updatedTotalAmountSpent,
    updatedLastPurchaseDate,
    JSON.stringify(updatedPurchaseHistory),
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${MASTER_CUSTOMER_SHEET}!A${rowIndex}:H${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [row],
    },
  });

  console.log("[GoogleSheets] ✅ Customer updated in Master Customer sheet");
}

/**
 * Get all customers from Master Customer sheet
 */
export async function getAllCustomers(): Promise<CustomerData[]> {
  const sheets = getGoogleSheetsClient();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${MASTER_CUSTOMER_SHEET}!A2:H`, // Skip header row
    });

    const rows = response.data.values || [];

    return rows.map((row) => {
      let purchaseHistory: PurchaseRecord[] = [];
      try {
        purchaseHistory = row[7] ? JSON.parse(row[7]) : [];
      } catch (e) {
        console.error("[GoogleSheets] Error parsing purchase history:", e);
      }

      return {
        customerName: row[0] || "",
        phoneNumber: row[1] || "",
        email: row[2] || "",
        address: row[3] || "",
        totalPurchaseCount: parseInt(row[4] || "0"),
        totalAmountSpent: parseFloat(row[5] || "0"),
        lastPurchaseDate: row[6] || "",
        purchaseHistory,
      };
    });
  } catch (error) {
    if (isMissingSheetError(error)) {
      console.warn(
        "[GoogleSheets] MasterCustomers sheet missing, returning empty result"
      );
      return [];
    }
    throw error;
  }
}

/**
 * Process a bill: Add to Daily Bills and update/create customer
 */
export async function processBill(billData: BillData): Promise<void> {
  // 1. Append to Daily Bills sheet
  await appendBillToSheet(billData);

  // 2. Check if customer exists
  const { customer, rowIndex } = await findCustomerByPhone(
    billData.phoneNumber
  );

  if (customer) {
    // 3a. Update existing customer
    await updateCustomer(rowIndex, customer, billData);
  } else {
    // 3b. Create new customer
    await createCustomer(billData);
  }

  console.log("[GoogleSheets] ✅ Bill processed successfully");
}

/**
 * Initialize sheets with headers if they don't exist
 */
export async function initializeSheets(): Promise<void> {
  const sheets = getGoogleSheetsClient();

  try {
    // Check if sheets exist, if not create them
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetNames =
      spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];

    // Create Daily Bills sheet if it doesn't exist
    if (!sheetNames.includes(DAILY_BILLS_SHEET)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: DAILY_BILLS_SHEET,
                },
              },
            },
          ],
        },
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${DAILY_BILLS_SHEET}!A1:N1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [
            [
              "Date",
              "Bill Number",
              "Customer Name",
              "Phone Number",
              "Products",
              "Quantity",
              "Price",
              "Total Amount",
              "Payment Method",
              "Notes",
              "Image Source",
              "Timestamp",
              "Shift",
              "Address",
            ],
          ],
        },
      });
    }

    // Create Master Customer sheet if it doesn't exist
    if (!sheetNames.includes(MASTER_CUSTOMER_SHEET)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: MASTER_CUSTOMER_SHEET,
                },
              },
            },
          ],
        },
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${MASTER_CUSTOMER_SHEET}!A1:H1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [
            [
              "Customer Name",
              "Phone Number",
              "Email",
              "Address",
              "Total Purchase Count",
              "Total Amount Spent",
              "Last Purchase Date",
              "Purchase History (JSON)",
            ],
          ],
        },
      });
    }

    console.log("[GoogleSheets] ✅ Sheets initialized successfully");
  } catch (error) {
    console.error("[GoogleSheets] ❌ Error initializing sheets:", error);
    throw error;
  }
}

// ============================================
// DAILY BILLS FUNCTIONALITY
// ============================================

/**
 * Check if a sheet exists in the spreadsheet
 */
export async function sheetExists(sheetName: string): Promise<boolean> {
  try {
    const sheets = getSheetsClient();
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetNames =
      spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];

    return sheetNames.includes(sheetName);
  } catch (error) {
    console.error(`[DailyBills] Error checking if sheet exists: ${sheetName}`, error);
    throw error;
  }
}

/**
 * Create a new daily sheet with headers
 */
export async function createDailySheet(sheetName: string): Promise<void> {
  try {
    const sheets = getSheetsClient();
    // Create the sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });

    // Add headers
    const headers = [
      "Date",
      "Shop Name",
      "Phone",
      "Sale",
      "Cash",
      "Shift",
      "Address",
      "Rep",
      "Delivery Person",
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:I1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    });

    console.log(`[DailyBills] ✅ Created sheet: ${sheetName} with headers`);
  } catch (error) {
    console.error(`[DailyBills] ❌ Error creating sheet: ${sheetName}`, error);
    throw error;
  }
}

/**
 * Append rows to a daily sheet
 */
export async function appendDailyRows(
  sheetName: string,
  date: string,
  shift: string,
  items: Array<{
    shopName: string;
    phone: string;
    sale: number;
    cash: number;
    address: string;
    rep: number;
    delPerson: string;
  }>
): Promise<void> {
  try {
    const sheets = getSheetsClient();
    // Convert items to rows
    const rows = items.map((item) => [
      date,
      item.shopName,
      item.phone,
      item.sale.toString(),
      item.cash.toString(),
      shift,
      item.address,
      item.rep.toString(),
      item.delPerson,
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:I`,
      valueInputOption: "RAW",
      requestBody: {
        values: rows,
      },
    });

    console.log(
      `[DailyBills] ✅ Appended ${rows.length} row(s) to sheet: ${sheetName}`
    );
  } catch (error) {
    console.error(
      `[DailyBills] ❌ Error appending rows to sheet: ${sheetName}`,
      error
    );
    throw error;
  }
}

/**
 * Save daily bills to the appropriate sheet
 * Creates the sheet if it doesn't exist
 */
export async function saveDailyBills(data: DailyBillsInput): Promise<void> {
  try {
    const { top, items } = data;

    // Validate input
    if (!top.date || !top.shift) {
      throw new Error("Missing required fields: top.date or top.shift");
    }

    if (!items || items.length === 0) {
      throw new Error("No items provided");
    }

    // Construct sheet name: ${date}-${shift}
    const sheetName = `${top.date}-${top.shift}`;

    // Check if sheet exists
    const exists = await sheetExists(sheetName);

    if (!exists) {
      // Create sheet with headers
      await createDailySheet(sheetName);
    }

    // Append rows
    await appendDailyRows(sheetName, top.date, top.shift, items);

    console.log(
      `[DailyBills] ✅ Successfully saved ${items.length} bill(s) to ${sheetName}`
    );
  } catch (error) {
    console.error("[DailyBills] ❌ Error saving daily bills:", error);
    throw error;
  }
}

// ============================================
// MASTER CUSTOMER FUNCTIONALITY
// ============================================

export async function ensureMasterCustomerSheet(): Promise<void> {
  try {
    const sheets = getSheetsClient();
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetNames =
      spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];

    if (!sheetNames.includes(MASTER_CUSTOMER_SHEET)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: MASTER_CUSTOMER_SHEET,
                },
              },
            },
          ],
        },
      });
    }

    // Always enforce header row (9 columns: A-I)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${MASTER_CUSTOMER_SHEET}!A1:I1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [MASTER_CUSTOMER_HEADERS],
      },
    });

    console.log("[MasterCustomers] ✅ Sheet ready");
  } catch (error) {
    console.error("[MasterCustomers] ❌ Error ensuring sheet:", error);
    throw error;
  }
}

type PurchaseHistoryEntry = {
  date: string;
  amount: number;
};

export async function updateOrInsertCustomer(
  sheetsClient: sheets_v4.Sheets,
  spreadsheetId: string,
  item: DailyBillItem,
  date: string
): Promise<void> {
  try {
    const phoneRaw = (item.phone ?? "").toString().trim();

    if (!phoneRaw) {
      console.warn("[MasterCustomers] Skipping entry without phone number");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phoneRaw);
    // Use cash value as specified (numeric cash value from bill)
    const totalAmount = Number(item.cash) || 0;
    const historyEntry: PurchaseHistoryEntry = { date, amount: totalAmount };
    
    // Get today's date in DD-MM-YYYY format
    const today = formatDate(new Date());

    const range = `${MASTER_CUSTOMER_SHEET}!A2:I`;
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    let existingIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      const currentPhone = normalizePhoneNumber(rows[i][1] || "");
      if (currentPhone === normalizedPhone) {
        existingIndex = i;
        break;
      }
    }

    if (existingIndex === -1) {
      // INSERT NEW CUSTOMER
      const newRow = [
        item.shopName || "Unknown Customer",
        normalizedPhone,
        item.address || "",
        1, // Total Purchase Count
        totalAmount, // Total Amount Spent
        date, // Last Purchase Date
        JSON.stringify([historyEntry]), // Purchase History
        1, // Flag = 1 for insert
        today, // Last Modified
      ];

      await sheetsClient.spreadsheets.values.append({
        spreadsheetId,
        range: `${MASTER_CUSTOMER_SHEET}!A:I`,
        valueInputOption: "RAW",
        requestBody: {
          values: [newRow],
        },
      });

      console.log(
        `[MasterCustomers] 🆕 Added new customer: ${item.shopName || normalizedPhone} (Flag=1)`
      );
      return;
    }

    // UPDATE EXISTING CUSTOMER
    const existingRow = rows[existingIndex];
    const existingCount = parseInt(existingRow[3] || "0", 10) || 0;
    const existingAmount = parseFloat(existingRow[4] || "0") || 0;
    const purchaseHistoryRaw = existingRow[6];
    let purchaseHistory: PurchaseHistoryEntry[] = [];
    if (purchaseHistoryRaw) {
      try {
        const parsed = JSON.parse(purchaseHistoryRaw);
        if (Array.isArray(parsed)) {
          purchaseHistory = parsed;
        }
      } catch (error) {
        console.warn(
          "[MasterCustomers] Failed to parse purchase history, resetting it."
        );
      }
    }

    const updatedHistory = [...purchaseHistory, historyEntry];
    const updatedRow = [
      existingRow[0] || item.shopName || "Unknown Customer",
      normalizedPhone,
      item.address || existingRow[2] || "",
      existingCount + 1, // Increment purchase count
      existingAmount + totalAmount, // Add to total amount
      date, // Update last purchase date
      JSON.stringify(updatedHistory), // Append to purchase history
      0, // Flag = 0 for update
      today, // Last Modified
    ];

    const rowNumber = existingIndex + 2; // account for header
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId,
      range: `${MASTER_CUSTOMER_SHEET}!A${rowNumber}:I${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [updatedRow],
      },
    });

    console.log(
      `[MasterCustomers] ✏️ Updated customer row ${rowNumber} (${normalizedPhone}, Flag=0)`
    );
  } catch (error) {
    console.error("[MasterCustomers] ❌ Error updating customer:", error);
    throw error;
  }
}
