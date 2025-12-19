// components/RightPanel.tsx
"use client";

import { useState, useEffect } from "react";

type TopHeader = {
  date: string;
  balPkt: string;
  totalPkt: string;
  newPkt: string;
  shift: string;
};

type SheetRow = {
  no?: string;
  shopName?: string;
  address?: string;
  samp?: string; // Sample Qty
  rep?: string; // Return Qty
  sale?: string; // Sale Qty
  cash?: string; // Legacy field
  delPerson?: string;
  phonenumber?: string;
  packetPrice?: string; // Packet Price per row
  // Calculated amounts (read-only)
  saleAmount?: number;
  sampleAmount?: number;
  returnAmount?: number;
};

const initialTop: TopHeader = {
  date: "",
  balPkt: "",
  totalPkt: "",
  newPkt: "",
  shift: "Morning", // Default shift
};

function normalizeDate(input?: string): string {
  if (!input) return "";

  // Already correct format
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  // dd-mm-yyyy or dd/mm/yyyy
  const match = input.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  // Fallback: try JS Date parsing
  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }

  return "";
}

export default function RightPanel() {
  const [top, setTop] = useState<TopHeader>(initialTop);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    console.log("🔧 RightPanel: Setting up process-image event listener");

    async function handler(e: any) {
      console.log("📥 RightPanel: Event received", {
        hasDetail: !!e?.detail,
        hasImageData: !!e?.detail?.imageData,
        eventType: e?.type,
      });

      const imageData = e?.detail?.imageData;
      if (!imageData) {
        console.error("❌ No image data in event detail:", e);
        alert("No image data received.");
        return;
      }

      console.log("📤 RightPanel received image data, size:", imageData.length);
      console.log("📤 Image data preview:", imageData.substring(0, 50));
      setIsLoading(true);

      try {
        console.log("📡 Sending POST to /api/ocr with base64 image");
        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData }),
        });

        console.log("📥 Response status:", res.status);
        const data = await res.json();
        console.log("📥 Response data:", JSON.stringify(data, null, 2));

        if (!res.ok) {
          console.error("❌ OCR API error:", data);
          const errorMessage =
            data?.error || data?.details || "Unknown error occurred";
          alert("OCR failed: " + errorMessage);
          setIsLoading(false);
          return;
        }

        const returnedTop =
          data?.top && typeof data.top === "object" ? data.top : {};
        const returnedItems = Array.isArray(data?.items) ? data.items : [];

        console.log("✅ Extracted top:", returnedTop);
        console.log("✅ Extracted items count:", returnedItems.length);

        setTop({
           date: normalizeDate(returnedTop.date),
          balPkt: String(returnedTop.balPkt ?? ""),
          totalPkt: String(returnedTop.totalPkt ?? ""),
          newPkt: String(returnedTop.newPkt ?? ""),
          shift: String(returnedTop.shift ?? top.shift ?? "Morning"),
        });

        const normalizedRows: SheetRow[] = returnedItems.map(
          (it: any, idx: number) => {
            const packetPrice = parseFloat(String(it.packetPrice ?? "0")) || 0;
            const saleQty = parseFloat(String(it.sale ?? "0")) || 0;
            const sampleQty = parseFloat(String(it.samp ?? "0")) || 0;
            const returnQty = parseFloat(String(it.rep ?? "0")) || 0;
            
            return {
            no: String(it.no ?? idx + 1),
            shopName: String(it.shopName ?? ""),
            address: String(it.address ?? ""),
            samp: String(it.samp ?? ""),
            rep: String(it.rep ?? ""),
            sale: String(it.sale ?? ""),
            cash: String(it.cash ?? ""),
            delPerson: String(it.delPerson ?? ""),
            phonenumber: String(it.phonenumber ?? ""),
            packetPrice: String(it.packetPrice ?? ""),
              saleAmount: saleQty * packetPrice,
              sampleAmount: sampleQty * packetPrice,
              returnAmount: returnQty * packetPrice,
            };
          }
        );

        setRows(normalizedRows);
        console.log("✅ Data populated successfully");
      } catch (err: any) {
        console.error("❌ OCR request failed:", err);
        alert("OCR request failed: " + (err?.message ?? "unknown"));
      } finally {
        setIsLoading(false);
      }
    }

    window.addEventListener("process-image", handler as EventListener);
    return () =>
      window.removeEventListener("process-image", handler as EventListener);
  }, []);

  function addEmptyRow() {
    setRows((r) => [
      ...r,
      {
        no: String(r.length + 1),
        shopName: "",
        address: "",
        samp: "",
        rep: "",
        sale: "",
        cash: "",
        delPerson: "",
        phonenumber: "",
        packetPrice: "",
        saleAmount: 0,
        sampleAmount: 0,
        returnAmount: 0,
      },
    ]);
  }

  function updateRow(idx: number, key: keyof SheetRow, value: string) {
    setRows((r) => {
      const updated = r.map((row, i) => {
        if (i === idx) {
          const newRow = { ...row, [key]: value };
          // Use row-specific packetPrice
          const packetPrice = parseFloat(newRow.packetPrice || "0") || 0;
          // Auto-calculate amounts when quantities or packetPrice change
          const saleQty = parseFloat(newRow.sale || "0") || 0;
          const sampleQty = parseFloat(newRow.samp || "0") || 0;
          const returnQty = parseFloat(newRow.rep || "0") || 0;
          
          return {
            ...newRow,
            saleAmount: saleQty * packetPrice,
            sampleAmount: sampleQty * packetPrice,
            returnAmount: returnQty * packetPrice,
          };
        }
        return row;
      });
      return updated;
    });
  }


  function deleteRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }

  async function saveBills() {
    if (rows.length === 0) {
      alert("No data to save.");
      return;
    }

    // Validate top data
    const dateValue = top.date?.trim();
    // Default to "Morning" if shift is empty
    const shiftValue = (top.shift?.trim() || "Morning");
    
    if (!dateValue) {
      alert("Please fill in the Date field.");
      return;
    }

    setIsLoading(true);
    try {
      // Filter and map rows to items format
      const items = rows
        .filter((row) => {
          // Only include rows with shopName
          if (!row.shopName) {
            console.log("[SaveBills] Skipping row with missing shopName:", row);
            return false;
        }
          // At least one quantity should be > 0 (sale, sample, or return)
          const saleQty = parseFloat(String(row.sale || "0")) || 0;
          const sampleQty = parseFloat(String(row.samp || "0")) || 0;
          const returnQty = parseFloat(String(row.rep || "0")) || 0;
          if (saleQty === 0 && sampleQty === 0 && returnQty === 0) {
            console.log(
              "[SaveBills] Skipping row with all quantities zero:",
              row
            );
            return false;
          }
          return true;
        })
        .map((row) => {
          const packetPrice = parseFloat(String(row.packetPrice || "0")) || 0;
          const saleQty = parseFloat(String(row.sale || "0")) || 0;
          const sampleQty = parseFloat(String(row.samp || "0")) || 0;
          const returnQty = parseFloat(String(row.rep || "0")) || 0;
          
          return {
            shopName: row.shopName || "",
            phone: row.phonenumber || "",
            packetPrice: packetPrice,
            saleQty: saleQty,
            sampleQty: sampleQty,
            returnQty: returnQty,
            saleAmount: saleQty * packetPrice,
            sampleAmount: sampleQty * packetPrice,
            returnAmount: returnQty * packetPrice,
            address: row.address || "",
            rep: row.rep ? parseFloat(String(row.rep)) : 0, // Keep for backward compatibility
            delPerson: row.delPerson || "",
          };
        });

      if (items.length === 0) {
        alert(
          "No valid rows to save. Please ensure rows have Shop Name and Sale/Cash values."
        );
        setIsLoading(false);
        return;
      }

      // Prepare data in Daily Bills format
      const dailyBillsData = {
        top: {
          date: dateValue,
          shift: shiftValue,
        },
        items: items,
        };

      console.log("[SaveBills] Saving daily bills:", dailyBillsData);

        const response = await fetch("/api/bills/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dailyBillsData),
        });

        if (!response.ok) {
          const error = await response.json();
        console.error("[SaveBills] Error saving bills:", error);
        throw new Error(error.details || error.error || "Failed to save bills");
        }

      const result = await response.json();
      alert(
        `✅ ${
          result.message ||
          `Successfully saved ${items.length} bill(s) to Google Sheets!`
        }`
      );
      console.log("[SaveBills] Bills saved successfully:", result);
    } catch (error: any) {
      console.error("[SaveBills] Error:", error);
      alert("❌ Error saving bills: " + (error?.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }

  function exportCSV() {
    const hdr = [
      "No",
      "Shop Name",
      "Address",
      "Samp",
      "Rep",
      "Sale",
      "Cash",
      "Del.Person",
      "Phone Number",
    ];
    const lines = [hdr.join(",")];
    rows.forEach((r) =>
      lines.push(
        [
          r.no ?? "",
          r.shopName ?? "",
          r.address ?? "",
          r.samp ?? "",
          r.rep ?? "",
          r.sale ?? "",
          r.cash ?? "",
          r.delPerson ?? "",
          r.phonenumber ?? "",
        ]
          .map((v) => {
            const s = String(v ?? "");
            return s.includes(",") || s.includes('"')
              ? `"${s.replace(/"/g, '""')}"`
              : s;
          })
          .join(",")
      )
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bills_${
      top.date || new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Calculate totals
  const totalSaleAmount = rows.reduce(
    (sum, row) => sum + (row.saleAmount || 0),
    0
  );
  const totalSampleAmount = rows.reduce(
    (sum, row) => sum + (row.sampleAmount || 0),
    0
  );
  const totalReturnAmount = rows.reduce(
    (sum, row) => sum + (row.returnAmount || 0),
    0
  );
  const totalSaleQty = rows.reduce(
    (sum, row) => sum + (parseFloat(row.sale || "0") || 0),
    0
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white text-lg">📄</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Extracted Bills Data
              </h1>
              <p className="text-sm text-gray-500">
                {rows.length} {rows.length === 1 ? "bill" : "bills"} extracted
          {isLoading && (
                  <span className="ml-2 inline-flex items-center">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-1"></span>
                    Processing...
                  </span>
          )}
              </p>
            </div>
        </div>

          <div className="flex flex-wrap gap-2">
          <button
            onClick={saveBills}
            disabled={rows.length === 0 || isLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "💾"
              )}
              Save to Sheets
          </button>
            <button
              onClick={exportCSV}
              disabled={rows.length === 0}
              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              📥 Export CSV
          </button>
          </div>
        </div>
      </div>

      {/* Top Info Section */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white/50">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">📅 Date</label>
            <input
              type="date"
              value={top.date}
              onChange={(e) => setTop({ ...top, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">
              📦 Bal PKT
            </label>
            <input
              value={top.balPkt}
              onChange={(e) => setTop({ ...top, balPkt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">
              📊 Total PKT
            </label>
            <input
              value={top.totalPkt}
              onChange={(e) => setTop({ ...top, totalPkt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">
              🆕 New PKT
            </label>
            <input
              value={top.newPkt}
              onChange={(e) => setTop({ ...top, newPkt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">
              ⏰ Shift
            </label>
            <select
              value={top.shift || "Morning"}
              onChange={(e) => setTop({ ...top, shift: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
            >
              <option value="Morning">Morning</option>
            </select>
          </div>
          </div>
        </div>

      {/* Bills Table */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700">
            📋 Bill Items ({rows.length})
          </h3>
          <button
            onClick={addEmptyRow}
            className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-all flex items-center gap-2 text-sm"
          >
            ➕ Add Row
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {rows.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No bills extracted yet
              </h3>
              <p className="text-gray-500 max-w-md">
                Upload an image using the left panel to extract bill data. The
                extracted data will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      #
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Shop Details
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Financials
              </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Delivery & Contact
              </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
              </th>
            </tr>
          </thead>
                <tbody className="divide-y divide-gray-200">
            {rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-gray-50 transition ${
                        expandedRow === idx ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {row.no}
                        </div>
                </td>

                      <td className="py-4 px-4">
                        <div className="space-y-2">
                  <input
                    value={row.shopName ?? ""}
                            onChange={(e) =>
                              updateRow(idx, "shopName", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-medium"
                            placeholder="Shop Name"
                          />
                          <textarea
                            value={row.address ?? ""}
                            onChange={(e) =>
                              updateRow(idx, "address", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                            placeholder="Address"
                            rows={2}
                  />
                        </div>
                </td>

                      <td className="py-4 px-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Sale Qty
                              </div>
                  <input
                                type="number"
                                value={row.sale ?? ""}
                                onChange={(e) =>
                                  updateRow(idx, "sale", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                placeholder="0"
                                min="0"
                              />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Sample Qty
                              </div>
                  <input
                                type="number"
                    value={row.samp ?? ""}
                                onChange={(e) =>
                                  updateRow(idx, "samp", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                placeholder="0"
                                min="0"
                  />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Return Qty
                              </div>
                  <input
                                type="number"
                    value={row.rep ?? ""}
                                onChange={(e) =>
                                  updateRow(idx, "rep", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                placeholder="0"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">
                              Packet Price (₹)
                            </div>
                            <input
                              type="number"
                              value={row.packetPrice ?? ""}
                              onChange={(e) =>
                                updateRow(idx, "packetPrice", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                              placeholder="0"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                </td>

                      <td className="py-4 px-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Sale Amount (₹)
                              </div>
                              <input
                                value={row.saleAmount?.toFixed(2) ?? "0.00"}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 cursor-not-allowed outline-none text-sm font-medium"
                              />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Sample Amount (₹)
                              </div>
                  <input
                                value={row.sampleAmount?.toFixed(2) ?? "0.00"}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 cursor-not-allowed outline-none text-sm font-medium"
                  />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Return Amount (₹)
                              </div>
                  <input
                                value={row.returnAmount?.toFixed(2) ?? "0.00"}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 cursor-not-allowed outline-none text-sm font-medium"
                              />
                            </div>
                          </div>
                        </div>
                </td>

                      <td className="py-4 px-4">
                        <div className="space-y-2">
                  <input
                    value={row.delPerson ?? ""}
                    onChange={(e) =>
                      updateRow(idx, "delPerson", e.target.value)
                    }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            placeholder="Delivery Person"
                          />
                          <input
                            value={row.phonenumber ?? ""}
                            onChange={(e) =>
                              updateRow(idx, "phonenumber", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            placeholder="Phone Number"
                  />
                        </div>
                </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteRow(idx)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete row"
                  >
                            🗑️
                  </button>
                        </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {rows.length > 0 && (
          <div className="border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                📊 Total:{" "}
                <span className="font-semibold text-gray-900">
                  {rows.length}
                </span>{" "}
                bills
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-sm">
                  <span className="text-gray-600">📦 Total Sale Qty:</span>
                  <span className="font-semibold text-blue-600 ml-2">
                    {totalSaleQty}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">💰 Sale Amount:</span>
                  <span className="font-semibold text-green-600 ml-2">
                    ₹{totalSaleAmount.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">🎁 Sample Amount:</span>
                  <span className="font-semibold text-orange-600 ml-2">
                    ₹{totalSampleAmount.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">↩️ Return Amount:</span>
                  <span className="font-semibold text-red-600 ml-2">
                    ₹{totalReturnAmount.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">📊 Net Revenue:</span>
                  <span className="font-semibold text-purple-600 ml-2">
                    ₹{(totalSaleAmount - totalSampleAmount - totalReturnAmount).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={saveBills}
                  disabled={rows.length === 0 || isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    "✅"
                  )}
                  Save All Bills
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Row Details */}
      {expandedRow !== null && rows[expandedRow] && (
        <div className="border-t border-gray-200 bg-blue-50 p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-900">
              📋 Row {rows[expandedRow].no} Details
            </h4>
            <button
              onClick={() => setExpandedRow(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
        </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Shop Name</div>
              <div className="font-medium">
                {rows[expandedRow].shopName || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Address</div>
              <div className="font-medium">
                {rows[expandedRow].address || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Phone</div>
              <div className="font-medium">
                {rows[expandedRow].phonenumber || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Delivery Person</div>
              <div className="font-medium">
                {rows[expandedRow].delPerson || "—"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
