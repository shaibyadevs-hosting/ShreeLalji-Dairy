// lib/excelStorage.ts
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { BillData } from './types'; // Assuming BillData is defined in types.ts

const ROOT_DIR = process.cwd();
const EXCEL_ROOT = path.join(ROOT_DIR, 'excel');
const INPUT_DIR = path.join(EXCEL_ROOT, 'input', 'processed_images');
const OUTPUT_DIR = path.join(EXCEL_ROOT, 'output');

// Helper to ensure directory exists
const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export async function saveToLocalSystem(
  data: BillData, 
  imageBase64: string, // The image data from the frontend
  dateStr: string // Format: YYYY-MM-DD
) {
  // 1. Setup Directory Structure
  const dateInputFolder = path.join(INPUT_DIR, dateStr);
  const dateOutputFolder = path.join(OUTPUT_DIR, dateStr);
  
  ensureDir(dateInputFolder);
  ensureDir(dateOutputFolder);

  // 2. Save Image to Input Folder
  // Remove header if present (e.g., "data:image/jpeg;base64,")
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  const imageName = `bill_${Date.now()}.jpg`;
  const imagePath = path.join(dateInputFolder, imageName);
  
  fs.writeFileSync(imagePath, buffer);

  // 3. Prepare Data Row
  const rowData = {
    ...data,
    ImageRef: imageName,
    ProcessedDate: new Date().toISOString()
  };

  // 4. Update Master Excel (excel/output/master.xlsx)
  const masterPath = path.join(OUTPUT_DIR, 'master.xlsx');
  updateExcelFile(masterPath, rowData);

  // 5. Update Daily Excel (excel/output/{date}/daily_bills.xlsx)
  const dailyPath = path.join(dateOutputFolder, 'daily_bills.xlsx');
  updateExcelFile(dailyPath, rowData);

  return { success: true, path: imagePath };
}

function updateExcelFile(filePath: string, newData: any) {
  let workbook: XLSX.WorkBook;
  let worksheet: XLSX.WorkSheet;
  const sheetName = "Bills";

  if (fs.existsSync(filePath)) {
    // Read existing file
    workbook = XLSX.readFile(filePath);
    if (workbook.Sheets[sheetName]) {
      worksheet = workbook.Sheets[sheetName];
      const existingData = XLSX.utils.sheet_to_json(worksheet);
      existingData.push(newData);
      worksheet = XLSX.utils.json_to_sheet(existingData);
    } else {
      worksheet = XLSX.utils.json_to_sheet([newData]);
    }
  } else {
    // Create new file
    workbook = XLSX.utils.book_new();
    worksheet = XLSX.utils.json_to_sheet([newData]);
  }

  // Update workbook
  workbook.Sheets[sheetName] = worksheet;
  if (!workbook.SheetNames.includes(sheetName)) {
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }
  
  console.log(`[ExcelStorage] Saving Excel file to: ${filePath}`);
  XLSX.writeFile(workbook, filePath);
}