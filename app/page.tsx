// app/page.tsx
"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header Section */}
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        <div
          style={{
            fontSize: "64px",
            marginBottom: "16px",
            animation: "fadeInDown 0.8s ease-out",
          }}
        >
          🥛
        </div>
        <h1
          style={{
            fontSize: "48px",
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: "16px",
            textShadow: "0 4px 6px rgba(0,0,0,0.1)",
            animation: "fadeIn 1s ease-out",
          }}
        >
          ShreeLalJI Dairy
        </h1>
        <p
          style={{
            fontSize: "20px",
            color: "#f0f0f0",
            fontWeight: 500,
            letterSpacing: "0.5px",
            animation: "fadeIn 1.2s ease-out",
          }}
        >
          Automated Sales Tracking & Analytics Platform
        </p>
      </div>

      {/* Navigation Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "32px",
          maxWidth: "1000px",
          width: "100%",
          animation: "fadeInUp 1s ease-out",
        }}
      >
        {/* OCR Processing Card */}
        <Link
          href='/shreelalji-dairy'
          style={{
            textDecoration: "none",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "40px 32px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
            cursor: "pointer",
            border: "2px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px)";
            e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.3)";
            e.currentTarget.style.borderColor = "#667eea";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            📸
          </div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#1f2937",
              marginBottom: "12px",
              textAlign: "center",
            }}
          >
            OCR Processing
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "#6b7280",
              lineHeight: "1.6",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            Upload bill images and extract data automatically using AI-powered
            OCR technology
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                background: "#ede9fe",
                color: "#7c3aed",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              AI Extraction
            </span>
            <span
              style={{
                background: "#dbeafe",
                color: "#2563eb",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Real-time
            </span>
            <span
              style={{
                background: "#dcfce7",
                color: "#16a34a",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Save to Sheets
            </span>
          </div>
        </Link>

        {/* Dashboard Card */}
        <Link
          href='/dashboard'
          style={{
            textDecoration: "none",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "40px 32px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
            cursor: "pointer",
            border: "2px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px)";
            e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.3)";
            e.currentTarget.style.borderColor = "#764ba2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            📊
          </div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#1f2937",
              marginBottom: "12px",
              textAlign: "center",
            }}
          >
            Analytics Dashboard
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "#6b7280",
              lineHeight: "1.6",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            View real-time insights, sales trends, and customer analytics from
            Google Sheets data
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                background: "#fef3c7",
                color: "#d97706",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Live Metrics
            </span>
            <span
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Charts & Graphs
            </span>
            <span
              style={{
                background: "#e0e7ff",
                color: "#4f46e5",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Customer Insights
            </span>
          </div>
        </Link>

        {/* Follow-Ups Card */}
        <Link
          href='/follow-ups'
          style={{
            textDecoration: "none",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "40px 32px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
            cursor: "pointer",
            border: "2px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px)";
            e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.3)";
            e.currentTarget.style.borderColor = "#10b981";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            📞
          </div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#1f2937",
              marginBottom: "12px",
              textAlign: "center",
            }}
          >
            Follow-Up Calls
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "#6b7280",
              lineHeight: "1.6",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            Manage call reminders, track follow-ups, and mark calls as completed
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                background: "#dcfce7",
                color: "#166534",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Reminders
            </span>
            <span
              style={{
                background: "#dbeafe",
                color: "#1e40af",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Date Filter
            </span>
            <span
              style={{
                background: "#fef3c7",
                color: "#92400e",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Status Tracking
            </span>
          </div>
        </Link>
      </div>

      {/* Features Section */}
      <div
        style={{
          marginTop: "80px",
          textAlign: "center",
          maxWidth: "800px",
          animation: "fadeIn 1.5s ease-out",
        }}
      >
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#ffffff",
            marginBottom: "24px",
            opacity: 0.95,
          }}
        >
          Key Features
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          {[
            { icon: "🤖", text: "AI-Powered OCR" },
            { icon: "💾", text: "Google Sheets Integration" },
            { icon: "👥", text: "Customer Tracking" },
            { icon: "📈", text: "Sales Analytics" },
          ].map((feature, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                {feature.icon}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                {feature.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "60px",
          fontSize: "14px",
          color: "rgba(255,255,255,0.8)",
          textAlign: "center",
        }}
      >
        <p>Built By EI · Powered by Google Gemini AI & Google Sheets</p>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
