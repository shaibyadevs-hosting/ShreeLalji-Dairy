// app/page.tsx
"use client";

import { useState } from "react";
import ImageViewer from "../../components/ImageViewer";
import RightPanel from "../../components/RightPanel";
import Dashboard from "../../components/Dashboard";

export default function ShreelaljiDairyForm() {
  const [showDashboard, setShowDashboard] = useState(false);

  const handleViewDashboard = () => {
    console.log("🚀 View Dashboard button clicked");
    console.log("Current showDashboard state:", showDashboard);
    setShowDashboard(true);
    console.log("✅ Set showDashboard to true");
  };

  const handleBackFromDashboard = () => {
    console.log("🔙 Back button clicked from Dashboard");
    setShowDashboard(false);
    console.log("✅ Set showDashboard to false");
  };

  console.log("📊 Rendering - showDashboard:", showDashboard);

  return (
    <div>
      {showDashboard ? (
        <>
          <Dashboard onBack={handleBackFromDashboard} />
        </>
      ) : (
        <div className='two-panel-root'>
          <ImageViewer onViewDashboard={handleViewDashboard} />
          <RightPanel />
        </div>
      )}
    </div>
  );
}
