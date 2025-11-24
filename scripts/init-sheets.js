// scripts/init-sheets.js
/**
 * Script to initialize Google Sheets with proper structure
 * Run this after setting up environment variables
 */

async function initializeSheets() {
  console.log("🚀 Initializing Google Sheets...\n");

  try {
    const response = await fetch("http://localhost:3000/api/sheets/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Success!");
      console.log("📊 Google Sheets initialized with:");
      console.log("   - Daily Bills sheet (with headers)");
      console.log("   - Master Customers sheet (with headers)");
      console.log("\n💡 You can now start using the application!");
      console.log("   1. Upload images");
      console.log("   2. Process with OCR");
      console.log("   3. Save to Google Sheets");
      console.log("   4. View Dashboard analytics\n");
    } else {
      console.error("❌ Error:", data.error);
      console.error("Details:", data.details);
      console.log("\n💡 Troubleshooting tips:");
      console.log("   - Make sure your dev server is running (npm run dev)");
      console.log("   - Check that .env.local has the correct credentials");
      console.log("   - Verify the service account has access to the sheet");
      console.log(
        "   - See GOOGLE_SHEETS_SETUP.md for detailed instructions\n"
      );
    }
  } catch (error) {
    console.error("❌ Failed to initialize sheets");
    console.error("Error:", error.message);
    console.log("\n💡 Make sure:");
    console.log("   1. Your development server is running");
    console.log("      Run: npm run dev");
    console.log("   2. You are running this script while the server is active");
    console.log(
      "      In a separate terminal, run: node scripts/init-sheets.js\n"
    );
  }
}

// Check if we're running this as a script
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeSheets();
}

export default initializeSheets;
