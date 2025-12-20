// app/follow-ups/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Phone, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Users,
  MessageSquare,
  BarChart3,
  Shield
} from "lucide-react";

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
    timePeriod: "AM", // AM or PM
    notes: "",
  });
  const [phoneError, setPhoneError] = useState("");
  const [todayCalls, setTodayCalls] = useState<CallFollowUp[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<CallFollowUp[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
  });
  
  // OCR Image Upload States
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<{
    success: boolean;
    message: string;
    saved?: number;
    duplicates?: number;
  } | null>(null);

  // Pending Calls Modal States
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingCalls, setPendingCalls] = useState<CallFollowUp[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);

  // Load today's calls and stats on mount
  useEffect(() => {
    loadTodayCalls();
    loadStats();
  }, []);

  // Load stats
  const loadStats = async () => {
    try {
      const response = await fetch("/api/followups/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  // Load all pending calls
  const loadPendingCalls = async () => {
    try {
      setIsLoadingPending(true);
      const response = await fetch("/api/followups/pending");
      const data = await response.json();
      if (data.success) {
        setPendingCalls(data.calls || []);
        setShowPendingModal(true);
      } else {
        alert("Failed to load pending calls: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error loading pending calls:", error);
      alert("Error loading pending calls");
    } finally {
      setIsLoadingPending(false);
    }
  };

  // Filter calls based on search
  useEffect(() => {
    if (searchQuery) {
      const filtered = filteredCalls.filter(call => 
        call.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.phone.includes(searchQuery) ||
        call.notes.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCalls(filtered);
    } else {
      // If no search query, show appropriate data
      if (selectedDate) {
        loadCallsByDate(selectedDate);
      } else {
        setFilteredCalls(todayCalls);
      }
    }
  }, [searchQuery, selectedDate]);

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
        // Reload stats after loading calls
        loadStats();
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
      console.log(`[FollowUps] Loading calls for date: ${date} (formatted: ${formattedDate})`);

      const response = await fetch(
        `/api/followups/by-date?date=${formattedDate}`
      );
      const data = await response.json();

      if (data.success) {
        console.log(`[FollowUps] Found ${data.calls?.length || 0} calls for ${formattedDate}`);
        setFilteredCalls(data.calls || []);
        // Reload stats after loading calls
        loadStats();
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

  // Handle phone number input with validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    if (value.length <= 10) {
      setFormData({ ...formData, phone: value });
      if (value.length > 0 && value.length !== 10) {
        setPhoneError("Phone number must be 10 digits");
      } else {
        setPhoneError("");
      }
    }
  };

  // Convert 12-hour time to 24-hour format
  const convertTo24Hour = (time: string, period: string): string => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    if (!hours) return "";
    
    let hour24 = parseInt(hours, 10);
    const min = minutes || "00";
    
    // Validate hour range (1-12)
    if (hour24 < 1 || hour24 > 12) {
      return "";
    }
    
    // Convert to 24-hour format
    if (period === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period === "AM" && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${String(hour24).padStart(2, "0")}:${min.padStart(2, "0")}`;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (formData.phone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      return;
    }
    
    // Validate time format (1-12 hours, 00-59 minutes)
    // Allow both single digit (1-9) and double digit (01-12) hours
    const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])$/;
    if (!timeRegex.test(formData.callTime)) {
      alert("Please enter a valid time in HH:MM format (e.g., 9:30 or 09:30)");
      return;
    }
    
    if (!formData.name || !formData.phone || !formData.callDate || !formData.callTime) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);
      // Convert date from YYYY-MM-DD to DD-MM-YYYY
      const [year, month, day] = formData.callDate.split("-");
      const formattedDate = `${day}-${month}-${year}`;
      
      // Convert time to 24-hour format
      const time24Hour = convertTo24Hour(formData.callTime, formData.timePeriod);

      const response = await fetch("/api/followups/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          callDate: formattedDate,
          callTime: time24Hour,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ Call follow-up saved successfully!");
        // Reset form
        setFormData({
          name: "",
          phone: "",
          callDate: "",
          callTime: "",
          timePeriod: "AM",
          notes: "",
        });
        setPhoneError("");
        // Refresh today's list and stats
        loadStats();
        loadTodayCalls();
      } else {
        alert("❌ Failed to save: " + (data.error || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error saving follow-up:", error);
      alert("❌ Error saving follow-up: " + (error?.message || "Unknown error"));
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
        alert("✅ Call marked as Called!");
        // Refresh lists and stats
        loadStats();
        loadTodayCalls();
        if (selectedDate) {
          loadCallsByDate(selectedDate);
        }
      } else {
        alert("❌ Failed to update: " + (data.error || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      alert("❌ Error updating status: " + (error?.message || "Unknown error"));
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

      // Refresh today's calls and stats
      await loadStats();
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

  const displayCalls = selectedDate ? filteredCalls : todayCalls;

  // Handle "Show Today" button
  const handleShowToday = () => {
    setSelectedDate("");
    setSearchQuery("");
    loadTodayCalls();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Follow-Up Calls</h1>
                <p className="text-sm text-gray-500">Manage customer call reminders and track follow-ups</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleShowToday}
                disabled={isLoading}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all font-medium flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
              >
                <Calendar className="w-4 h-4" />
                Show Today
              </button>
              <button
                onClick={loadTodayCalls}
                disabled={isLoading}
                className="px-4 py-2.5 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Calls</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div 
            onClick={loadPendingCalls}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 cursor-pointer hover:shadow-xl hover:border-amber-200 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
                <p className="text-xs text-amber-500 mt-1  group-hover:opacity-100 transition-opacity">Click to view all</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                {isLoadingPending ? (
                  <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                ) : (
                  <Clock className="w-6 h-6 text-amber-600" />
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-50 to-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - OCR Upload & Add Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* OCR Upload Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Upload Call Sheet (OCR)</h2>
                  <p className="text-sm text-gray-500">Extract multiple calls from an image</p>
                </div>
              </div>

              <div className="space-y-4">
                {!uploadedImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <label htmlFor="ocr-image-input" className="cursor-pointer">
                      <div className="text-sm text-gray-600 mb-2">Drop your call sheet image here or click to browse</div>
                      <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 rounded-lg font-medium inline-flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Choose File
                      </div>
                    </label>
                    <input
                      id="ocr-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={uploadedImage}
                        alt="Uploaded call sheet"
                        className="w-full h-48 object-contain bg-gray-50"
                      />
                      <button
                        onClick={clearImage}
                        disabled={isOcrProcessing}
                        className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleOcrExtract}
                  disabled={!uploadedImage || isOcrProcessing}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                >
                  {isOcrProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Extract & Save Calls
                    </>
                  )}
                </button>

                {ocrResult && (
                  <div className={`p-4 rounded-lg ${
                    ocrResult.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      {ocrResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${
                          ocrResult.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {ocrResult.message}
                        </p>
                        {ocrResult.success && ocrResult.duplicates !== undefined && ocrResult.duplicates > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            Skipped {ocrResult.duplicates} duplicate(s)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Add New Call Form */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-50 to-green-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add New Call Reminder</h2>
                  <p className="text-sm text-gray-500">Add a single call reminder manually</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      required
                      maxLength={10}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                        phoneError ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter 10-digit phone number"
                    />
                    {phoneError && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {phoneError}
                      </p>
                    )}
                    {!phoneError && formData.phone.length > 0 && formData.phone.length < 10 && (
                      <p className="text-sm text-gray-500">
                        {10 - formData.phone.length} digit(s) remaining
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Call Date *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.callDate}
                        onChange={(e) => setFormData({ ...formData, callDate: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                      <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-500">Select date (will be saved as DD-MM-YYYY)</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Call Time *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.callTime}
                        onChange={(e) => {
                          let value = e.target.value;
                          // Allow digits and colon only
                          value = value.replace(/[^\d:]/g, "");
                          
                          // Auto-format as user types
                          if (value.length === 2 && !value.includes(":")) {
                            value = value + ":";
                          } else if (value.length > 5) {
                            value = value.slice(0, 5);
                          }
                          
                          // Validate hours (1-12) and minutes (00-59)
                          if (value.includes(":")) {
                            const [hours, minutes] = value.split(":");
                            if (hours) {
                              const hourNum = parseInt(hours, 10);
                              if (hourNum > 12) {
                                value = "12" + (minutes ? ":" + minutes : ":");
                              } else if (hourNum === 0) {
                                value = "1" + (minutes ? ":" + minutes : ":");
                              }
                            }
                            if (minutes) {
                              const minNum = parseInt(minutes, 10);
                              if (minNum > 59) {
                                value = (hours || "12") + ":59";
                              } else if (minutes.length === 1) {
                                // Allow single digit minutes while typing
                                value = (hours || "12") + ":" + minutes;
                              }
                            }
                          }
                          
                          setFormData({ ...formData, callTime: value });
                        }}
                        onBlur={(e) => {
                          // Ensure proper format on blur
                          const [hours, minutes] = e.target.value.split(":");
                          let formattedTime = e.target.value;
                          
                          if (hours && !minutes) {
                            formattedTime = hours + ":00";
                          } else if (hours && minutes) {
                            // Ensure minutes are 2 digits
                            formattedTime = hours + ":" + minutes.padStart(2, "0");
                            // Validate hour range
                            const hourNum = parseInt(hours, 10);
                            if (hourNum < 1 || hourNum > 12) {
                              formattedTime = "12:" + minutes.padStart(2, "0");
                            }
                          } else if (!hours) {
                            formattedTime = "";
                          }
                          
                          setFormData({ ...formData, callTime: formattedTime });
                        }}
                        required
                        maxLength={5}
                        pattern="[0-9]{1,2}:[0-9]{2}"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        placeholder="HH:MM"
                      />
                      <select
                        value={formData.timePeriod}
                        onChange={(e) => setFormData({ ...formData, timePeriod: e.target.value as "AM" | "PM" })}
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white font-medium"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-500">Enter time in 12-hour format (e.g., 09:30 AM)</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="Add any additional notes..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Save Call Reminder
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Calls List */}
          <div className="space-y-8">
            {/* Filter Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Filter by Date
                  </label>
                  <div className="flex gap-2">
                    <div 
                      className="relative flex-1 cursor-pointer"
                      onClick={() => {
                        const dateInput = document.getElementById('filter-date-input') as HTMLInputElement;
                        if (dateInput) {
                          dateInput.showPicker();
                        }
                      }}
                    >
                      <input
                        id="filter-date-input"
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex items-center justify-between px-4 py-3 border border-gray-300 rounded-xl bg-white cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all">
                        <span className={selectedDate ? "text-gray-900 font-medium" : "text-gray-400"}>
                          {selectedDate 
                            ? selectedDate.split("-").reverse().join("-")
                            : "Select date"}
                        </span>
                        <Calendar className="w-5 h-5 text-blue-500" />
                      </div>
                    </div>
                    {selectedDate && (
                      <button
                        onClick={handleShowToday}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Search Calls
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, phone, or notes..."
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="text-sm text-gray-600">
                    Showing {filteredCalls.length} calls
                  </div>
                  <div className="flex-1"></div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Calls List */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Call List</h3>
                <p className="text-sm text-gray-500">
                  {selectedDate ? formatDate(selectedDate.split("-").reverse().join("-")) : "Today"}
                </p>
              </div>

              <div className="overflow-hidden">
                {isLoading ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Loading calls...</p>
                  </div>
                ) : filteredCalls.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No calls found</h4>
                    <p className="text-gray-500 max-w-xs mx-auto">
                      {selectedDate 
                        ? `No calls scheduled for ${formatDate(selectedDate.split("-").reverse().join("-"))}`
                        : "No pending calls for today"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                    {filteredCalls.map((call, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 hover:bg-gray-50 transition ${call.status === "Called" ? 'bg-green-50/50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm">
                              {call.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-semibold text-gray-900 truncate">{call.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                call.status === "Called" 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {call.status}
                              </span>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-3 h-3" />
                                <span>{call.phone}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(call.callDate)} at {call.callTime}</span>
                              </div>
                              
                              {call.notes && (
                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                  <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                  <span className="line-clamp-2">{call.notes}</span>
                                </div>
                              )}
                            </div>
                            
                            {call.status === "Pending" && (
                              <button
                                onClick={() => handleMarkAsCalled(call.phone, call.callDate)}
                                className="mt-3 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center gap-2"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Mark as Called
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 text-center text-sm text-gray-500 pt-6 border-t border-gray-200">
          <p className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Data is securely stored in Google Sheets
            <span className="mx-2">•</span>
            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </main>

      {/* Pending Calls Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPendingModal(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Pending Calls</h2>
                      <p className="text-amber-100 text-sm">{pendingCalls.length} calls waiting</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPendingModal(false)}
                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
                {pendingCalls.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h4>
                    <p className="text-gray-500">No pending calls at the moment.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {pendingCalls.map((call, idx) => (
                      <div 
                        key={idx}
                        className="p-4 hover:bg-amber-50/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {call.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900 text-lg">{call.name}</h4>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-2 mb-3">
                              <a 
                                href={`tel:${call.phone}`}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                <Phone className="w-4 h-4" />
                                <span>{call.phone}</span>
                              </a>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>Scheduled: {formatDate(call.callDate)} at {call.callTime}</span>
                              </div>
                              
                              {call.notes && (
                                <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                  <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <span>{call.notes}</span>
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={async () => {
                                await handleMarkAsCalled(call.phone, call.callDate);
                                // Refresh the pending calls list
                                const response = await fetch("/api/followups/pending");
                                const data = await response.json();
                                if (data.success) {
                                  setPendingCalls(data.calls || []);
                                }
                              }}
                              className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark as Completed
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}