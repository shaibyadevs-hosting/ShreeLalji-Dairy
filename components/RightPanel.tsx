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
  samp?: string;
  rep?: string;
  sale?: string;
  cash?: string;
  delPerson?: string;
  phonenumber?: string;
};

const initialTop: TopHeader = {
  date: "",
  balPkt: "",
  totalPkt: "",
  newPkt: "",
  shift: "",
};

export default function RightPanel() {
  const [top, setTop] = useState<TopHeader>(initialTop);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
          date: String(returnedTop.date ?? ""),
          balPkt: String(returnedTop.balPkt ?? ""),
          totalPkt: String(returnedTop.totalPkt ?? ""),
          newPkt: String(returnedTop.newPkt ?? ""),
          shift: String(returnedTop.shift ?? ""),
        });

        const normalizedRows: SheetRow[] = returnedItems.map(
          (it: any, idx: number) => ({
            no: String(it.no ?? idx + 1),
            shopName: String(it.shopName ?? ""),
            address: String(it.address ?? ""),
            samp: String(it.samp ?? ""),
            rep: String(it.rep ?? ""),
            sale: String(it.sale ?? ""),
            cash: String(it.cash ?? ""),
            delPerson: String(it.delPerson ?? ""),
            phonenumber: String(it.phonenumber ?? ""),
          })
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
      },
    ]);
  }

  function updateRow(idx: number, key: keyof SheetRow, value: string) {
    setRows((r) =>
      r.map((row, i) => (i === idx ? { ...row, [key]: value } : row))
    );
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
    if (!top.date || !top.shift) {
      alert("Please fill in Date and Shift fields.");
      return;
    }

    setIsLoading(true);
    try {
      // Filter and map rows to items format
      const items = rows
        .filter((row) => {
          // Only include rows with shopName and sale/cash
          if (!row.shopName) {
            console.log("[SaveBills] Skipping row with missing shopName:", row);
            return false;
          }
          if (row.sale === undefined && row.cash === undefined) {
            console.log("[SaveBills] Skipping row with missing sale/cash:", row);
            return false;
          }
          return true;
        })
        .map((row) => ({
          shopName: row.shopName || "",
          phone: row.phonenumber || "",
          sale: row.sale ? parseFloat(String(row.sale)) : 0,
          cash: row.cash ? parseFloat(String(row.cash)) : 0,
          address: row.address || "",
          rep: row.rep ? parseFloat(String(row.rep)) : 0,
          delPerson: row.delPerson || "",
        }));

      if (items.length === 0) {
        alert("No valid rows to save. Please ensure rows have Shop Name and Sale/Cash values.");
        setIsLoading(false);
        return;
      }

      // Prepare data in Daily Bills format
      const dailyBillsData = {
        top: {
          date: top.date,
          shift: top.shift,
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
      alert(`✅ ${result.message || `Successfully saved ${items.length} bill(s) to Google Sheets!`}`);
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
    a.download = "sheet_rows.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className='right-panel'>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          gap: "12px",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16 }}>
          Extracted Data{" "}
          {isLoading && (
            <span style={{ color: "#f59e0b" }}>• Processing...</span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={saveBills}
            disabled={rows.length === 0 || isLoading}
            style={{
              background: "#10b981",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              fontWeight: 600,
              cursor:
                rows.length === 0 || isLoading ? "not-allowed" : "pointer",
              opacity: rows.length === 0 || isLoading ? 0.5 : 1,
            }}
          >
            💾 Save to Sheets
          </button>
          <button onClick={exportCSV} disabled={rows.length === 0}>
            Export CSV
          </button>
        </div>
      </div>

      <section style={{ marginTop: 10, marginBottom: 8, padding: "0 16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 12,
          }}
        >
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Date</label>
            <input
              value={top.date}
              onChange={(e) => setTop({ ...top, date: e.target.value })}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Bal PKT</label>
            <input
              value={top.balPkt}
              onChange={(e) => setTop({ ...top, balPkt: e.target.value })}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Total PKT</label>
            <input
              value={top.totalPkt}
              onChange={(e) => setTop({ ...top, totalPkt: e.target.value })}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>New PKT</label>
            <input
              value={top.newPkt}
              onChange={(e) => setTop({ ...top, newPkt: e.target.value })}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Shift</label>
            <input
              value={top.shift}
              onChange={(e) => setTop({ ...top, shift: e.target.value })}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </section>

      <section
        style={{
          marginTop: 12,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "0 16px",
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6" }}>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>No</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>
                Shop Name
              </th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Address</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Samp</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Rep</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Sale</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Cash</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>
                Del.Person
              </th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>
                Phone Number
              </th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ border: "1px solid #ddd", padding: 4 }}>
                  <input
                    value={row.no ?? ""}
                    onChange={(e) => updateRow(idx, "no", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ border: "1px solid #ddd", padding: 4 }}>
                  <input
                    value={row.shopName ?? ""}
                    onChange={(e) => updateRow(idx, "shopName", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ border: "1px solid #ddd", padding: 4 }}>
                  <input
                    value={row.address ?? ""}
                    onChange={(e) => updateRow(idx, "address", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ border: "1px solid #ddd", padding: 4 }}>
                  <input
                    value={row.samp ?? ""}
                    onChange={(e) => updateRow(idx, "samp", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ border: "1px solid #ddd", padding: 4 }}>
                  <input
                    value={row.rep ?? ""}
                    onChange={(e) => updateRow(idx, "rep", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ border: "1px solid #ddd", padding: 4 }}>
                  <input
                    value={row.sale ?? ""}
                    onChange={(e) => updateRow(idx, "sale", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ border: "1px solid #ddd", padding: 4 }}>
                  <input
                    value={row.cash ?? ""}
                    onChange={(e) => updateRow(idx, "cash", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ border: "1px solid #ddd", padding: 4 }}>
                  <input
                    value={row.delPerson ?? ""}
                    onChange={(e) =>
                      updateRow(idx, "delPerson", e.target.value)
                    }
                    style={{ width: "100%" }}
                  />
                </td>
                <td style={{ border: "1px solid #ddd", padding: 4 }}>
                  <input
                    value={row.phonenumber ?? ""}
                    onChange={(e) => updateRow(idx, "phonenumber", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: 4,
                    textAlign: "center",
                  }}
                >
                  <button
                    onClick={() => deleteRow(idx)}
                    style={{ color: "#ef4444" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addEmptyRow} style={{ marginTop: 12 }}>
          Add Row
        </button>
      </section>
    </main>
  );
}
