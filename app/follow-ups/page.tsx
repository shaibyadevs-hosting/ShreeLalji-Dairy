// app/follow-ups/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type CallFollowUp = {
  name: string;
  phone: string;
  callDate: string;
  callTime: string;
  notes: string;
  status: string;
  createdAt: string;
};

export default function FollowUpsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    callDate: "",
    callTime: "",
    notes: "",
  });
  const [todayCalls, setTodayCalls] = useState<CallFollowUp[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<CallFollowUp[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // OCR Image Upload States
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<{
    success: boolean;
    message: string;
    saved?: number;
    duplicates?: number;
  } | null>(null);

  // Load today's calls on mount
  useEffect(() => {
    loadTodayCalls();
  }, []);

  // Load today's calls
  const loadTodayCalls = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/followups/today");
      const data = await response.json();

      if (data.success) {
        setTodayCalls(data.calls || []);
        if (!selectedDate) {
          setFilteredCalls(data.calls || []);
        }
      } else {
        console.error("Failed to load today's calls:", data.error);
        setTodayCalls([]);
        setFilteredCalls([]);
      }
    } catch (error) {
      console.error("Error loading today's calls:", error);
      setTodayCalls([]);
      setFilteredCalls([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load calls by date
  const loadCallsByDate = async (date: string) => {
    if (!date) {
      loadTodayCalls();
      return;
    }

    try {
      setIsLoading(true);
      // Convert date from YYYY-MM-DD to DD-MM-YYYY
      const [year, month, day] = date.split("-");
      const formattedDate = `${day}-${month}-${year}`;

      const response = await fetch(
        `/api/followups/by-date?date=${formattedDate}`
      );
      const data = await response.json();

      if (data.success) {
        setFilteredCalls(data.calls || []);
      } else {
        console.error("Failed to load calls by date:", data.error);
        setFilteredCalls([]);
      }
    } catch (error) {
      console.error("Error loading calls by date:", error);
      setFilteredCalls([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.callDate || !formData.callTime) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);
      // Convert date from YYYY-MM-DD to DD-MM-YYYY
      const [year, month, day] = formData.callDate.split("-");
      const formattedDate = `${day}-${month}-${year}`;

      const response = await fetch("/api/followups/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          callDate: formattedDate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Call follow-up saved successfully!");
        // Reset form
        setFormData({
          name: "",
          phone: "",
          callDate: "",
          callTime: "",
          notes: "",
        });
        // Refresh today's list
        loadTodayCalls();
      } else {
        alert("Failed to save: " + (data.error || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error saving follow-up:", error);
      alert("Error saving follow-up: " + (error?.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle mark as called
  const handleMarkAsCalled = async (phone: string, callDate: string) => {
    if (!confirm("Mark this call as 'Called'?")) {
      return;
    }

    try {
      const response = await fetch("/api/followups/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, callDate }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Call marked as Called!");
        // Refresh lists
        loadTodayCalls();
        if (selectedDate) {
          loadCallsByDate(selectedDate);
        }
      } else {
        alert("Failed to update: " + (data.error || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      alert("Error updating status: " + (error?.message || "Unknown error"));
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64DataUrl = event.target?.result as string;
      setUploadedImage(base64DataUrl);
      setOcrResult(null); // Clear previous result
    };
    reader.readAsDataURL(file);
  };

  // Handle OCR extraction and save
  const handleOcrExtract = async () => {
    if (!uploadedImage) {
      alert("Please upload an image first");
      return;
    }

    try {
      setIsOcrProcessing(true);
      setOcrResult(null);

      // Step 1: Extract data using OCR
      console.log("📤 Sending image to OCR API...");
      const ocrResponse = await fetch("/api/followups/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: uploadedImage }),
      });

      const ocrData = await ocrResponse.json();

      if (!ocrResponse.ok || !ocrData.success) {
        throw new Error(ocrData.error || ocrData.details || "OCR extraction failed");
      }

      if (!ocrData.calls || ocrData.calls.length === 0) {
        throw new Error("No valid calls found in the image");
      }

      console.log(`✅ OCR extracted ${ocrData.calls.length} call(s)`);

      // Step 2: Save extracted calls
      console.log("💾 Saving extracted calls...");
      const saveResponse = await fetch("/api/followups/save-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calls: ocrData.calls }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok || !saveData.success) {
        throw new Error(saveData.error || saveData.details || "Failed to save calls");
      }

      // Success!
      setOcrResult({
        success: true,
        message: `Successfully extracted and saved ${saveData.saved} call(s)`,
        saved: saveData.saved,
        duplicates: saveData.duplicates,
      });

      // Clear image and refresh lists
      setUploadedImage(null);
      const fileInput = document.getElementById("ocr-image-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh today's calls
      await loadTodayCalls();
      if (selectedDate) {
        await loadCallsByDate(selectedDate);
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => setOcrResult(null), 5000);
    } catch (error: any) {
      console.error("❌ OCR extraction error:", error);
      setOcrResult({
        success: false,
        message: error?.message || "Failed to extract and save calls",
      });
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Clear uploaded image
  const clearImage = () => {
    setUploadedImage(null);
    setOcrResult(null);
    const fileInput = document.getElementById("ocr-image-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  // Handle date filter change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (date) {
      loadCallsByDate(date);
    } else {
      setFilteredCalls(todayCalls);
    }
  };

  // Format date for display (DD-MM-YYYY to readable)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  };

  // Convert DD-MM-YYYY to YYYY-MM-DD for date input
  const convertToInputDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };

  const displayCalls = selectedDate ? filteredCalls : todayCalls;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1f2937" }}>
            📞 Follow-Up Call Reminders
          </h1>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            ← Back to Home
          </button>
        </div>

        {/* Section 0: OCR Image Upload */}
        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            marginBottom: "24px",
            border: "2px solid #e0e7ff",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "20px",
              color: "#1f2937",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            📸 Upload Call Sheet Image (OCR)
          </h2>

          <div style={{ marginBottom: "16px" }}>
            <input
              id="ocr-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isOcrProcessing}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
                cursor: isOcrProcessing ? "not-allowed" : "pointer",
              }}
            />
          </div>

          {uploadedImage && (
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "#374151",
                }}
              >
                Image Preview:
              </div>
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  maxWidth: "100%",
                }}
              >
                <img
                  src={uploadedImage}
                  alt="Uploaded call sheet"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "300px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                />
                <button
                  onClick={clearImage}
                  disabled={isOcrProcessing}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: "rgba(220, 38, 38, 0.9)",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: isOcrProcessing ? "not-allowed" : "pointer",
                    fontSize: "12px",
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={handleOcrExtract}
              disabled={!uploadedImage || isOcrProcessing}
              style={{
                padding: "12px 24px",
                borderRadius: "6px",
                border: "none",
                background: !uploadedImage || isOcrProcessing ? "#9ca3af" : "#6366f1",
                color: "#fff",
                fontWeight: 600,
                cursor: !uploadedImage || isOcrProcessing ? "not-allowed" : "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isOcrProcessing ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "16px",
                      height: "16px",
                      border: "2px solid #fff",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Processing...
                </>
              ) : (
                <>
                  🔍 Extract & Save Calls
                </>
              )}
            </button>

            {ocrResult && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "6px",
                  background: ocrResult.success ? "#dcfce7" : "#fee2e2",
                  color: ocrResult.success ? "#166534" : "#dc2626",
                  fontSize: "14px",
                  fontWeight: 500,
                  flex: 1,
                }}
              >
                {ocrResult.success ? "✅ " : "❌ "}
                {ocrResult.message}
                {ocrResult.success && ocrResult.duplicates !== undefined && ocrResult.duplicates > 0 && (
                  <span style={{ display: "block", marginTop: "4px", fontSize: "12px" }}>
                    (Skipped {ocrResult.duplicates} duplicate(s))
                  </span>
                )}
              </div>
            )}
          </div>

          <style jsx>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>

        {/* Section 1: Add Call Form */}
        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "20px",
              color: "#1f2937",
            }}
          >
            Add New Call Reminder
          </h2>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  Call Date *
                </label>
                <input
                  type="date"
                  value={formData.callDate}
                  onChange={(e) =>
                    setFormData({ ...formData, callDate: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  Call Time *
                </label>
                <input
                  type="time"
                  value={formData.callTime}
                  onChange={(e) =>
                    setFormData({ ...formData, callTime: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "6px",
                  color: "#374151",
                }}
              >
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: "12px 24px",
                borderRadius: "6px",
                border: "none",
                background: isSaving ? "#9ca3af" : "#10b981",
                color: "#fff",
                fontWeight: 600,
                cursor: isSaving ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              {isSaving ? "Saving..." : "💾 Save Call Reminder"}
            </button>
          </form>
        </div>

        {/* Section 2: Today's Calls & Date Filter */}
        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#1f2937",
              }}
            >
              {selectedDate
                ? `Calls for ${formatDate(
                    selectedDate.split("-").reverse().join("-")
                  )} (${filteredCalls.length} found)`
                : `Today's Calls (${todayCalls.length} pending)`}
            </h2>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                placeholder="Filter by date"
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                }}
              />
              <button
                onClick={() => {
                  setSelectedDate("");
                  setFilteredCalls(todayCalls);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Show Today
              </button>
              <button
                onClick={loadTodayCalls}
                disabled={isLoading}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: "18px", color: "#6b7280" }}>
                Loading calls...
              </div>
            </div>
          ) : displayCalls.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: "18px", color: "#6b7280" }}>
                No calls found for this date
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      Phone
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      Time
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      Notes
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontWeight: 600,
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayCalls.map((call, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        background: call.status === "Called" ? "#f0fdf4" : "#fff",
                      }}
                    >
                      <td style={{ padding: "12px", fontWeight: 500 }}>
                        {call.name}
                      </td>
                      <td style={{ padding: "12px" }}>{call.phone}</td>
                      <td style={{ padding: "12px" }}>
                        {formatDate(call.callDate)}
                      </td>
                      <td style={{ padding: "12px" }}>{call.callTime}</td>
                      <td style={{ padding: "12px", maxWidth: "200px" }}>
                        {call.notes || "-"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            background:
                              call.status === "Called"
                                ? "#dcfce7"
                                : "#fef3c7",
                            color:
                              call.status === "Called" ? "#166534" : "#92400e",
                          }}
                        >
                          {call.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {call.status.toLowerCase() === "pending" && (
                          <button
                            onClick={() =>
                              handleMarkAsCalled(call.phone, call.callDate)
                            }
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "none",
                              background: "#10b981",
                              color: "#fff",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            ✓ Mark as Called
                          </button>
                        )}
                        {call.status === "Called" && (
                          <span style={{ color: "#6b7280", fontSize: "12px" }}>
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

