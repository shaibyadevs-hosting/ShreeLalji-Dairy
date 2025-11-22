// app/page.tsx
"use client";

import ImageViewer from "../components/ImageViewer";
import RightPanel from "../components/RightPanel";

export default function Home() {
  return (
    <div className="two-panel-root">
      <ImageViewer />
      <RightPanel />
    </div>
  );
}
