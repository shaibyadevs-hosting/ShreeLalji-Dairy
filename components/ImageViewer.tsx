// components/ImageViewer.tsx
"use client";

import React, { useRef, useState } from "react";

/**
 * Developer/test local path included as requested.
 * Your deployment should map the local path to a public URL before Gemini is called.
 */
const LOCAL_TEST_PATH = "/mnt/data/PHOTO-2025-11-22-01-31-25.jpg";

export default function ImageViewer({
  onViewDashboard,
}: {
  onViewDashboard: () => void;
}) {
  const [images, setImages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const dragging = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((f) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Store as base64 data URL, not blob URL
        const base64DataUrl = event.target?.result as string;
        setImages((prev) => [...prev, base64DataUrl]);
      };
      reader.readAsDataURL(f);
    });
    setScale(1);
    setRotate(0);
    setOffset({ x: 0, y: 0 });
  }

  function addLocalTestImage() {
    setImages((prev) => [...prev, LOCAL_TEST_PATH]);
    setIndex(images.length);
  }

  function clearAll() {
    setImages([]);
    setIndex(0);
    setScale(1);
    setRotate(0);
    setOffset({ x: 0, y: 0 });
  }

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
    resetTransforms();
  }
  function next() {
    setIndex((i) => Math.min(images.length - 1, i + 1));
    resetTransforms();
  }
  function resetTransforms() {
    setScale(1);
    setRotate(0);
    setOffset({ x: 0, y: 0 });
  }
  function zoom(delta: number) {
    setScale((s) => Math.min(6, Math.max(0.2, +(s + delta).toFixed(2))));
  }
  function rotateLeft() {
    setRotate((r) => r - 90);
  }
  function rotateRight() {
    setRotate((r) => r + 90);
  }

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current || !last.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  }
  function onMouseUp() {
    dragging.current = false;
    last.current = null;
  }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    zoom(e.deltaY > 0 ? -0.08 : 0.08);
  }

  function processImage() {
    if (!images[index]) {
      alert("No image to process");
      return;
    }
    
    const imageData = images[index];
    console.log("🎬 Processing image, length:", imageData.length);
    console.log("🎬 Image data type:", typeof imageData);
    console.log("🎬 Image data preview:", imageData.substring(0, 50));
    
    // Check if it's a local file path (not base64)
    if (imageData.startsWith("/") && !imageData.startsWith("data:")) {
      alert("Cannot process local file path. Please upload an image file.");
      return;
    }
    
    // Ensure it's base64 data URL
    if (!imageData.startsWith("data:image")) {
      console.warn("⚠️ Image data doesn't start with 'data:image', might be invalid");
    }
    
    setIsProcessing(true);
    
    try {
      const event = new CustomEvent("process-image", { 
        detail: { imageData },
        bubbles: true,
        cancelable: true
      });
      
      console.log("📤 Dispatching process-image event");
      const dispatched = window.dispatchEvent(event);
      console.log("📤 Event dispatched:", dispatched);
      
      if (!dispatched) {
        console.warn("⚠️ Event was prevented");
      }
    } catch (error) {
      console.error("❌ Error dispatching event:", error);
      alert("Error processing image: " + (error as Error).message);
      setIsProcessing(false);
      return;
    }
    
    setTimeout(() => setIsProcessing(false), 30000);
  }

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.addEventListener("wheel", onWheel as any, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel as any);
  }, [scale]);

  return (
    <aside className="left-panel fixed-viewport">
      <div className="viewer-header">
        <div className="title">Image Viewer</div>
        <div className="controls">
          <button onClick={addLocalTestImage}>Add Local Test</button>
          <button onClick={prev} disabled={index <= 0}>
            Prev
          </button>
          <button onClick={next} disabled={index >= images.length - 1}>
            Next
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="viewport"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {images.length === 0 ? (
          <div className="empty-msg">
            No image. Upload or use "Add Local Test".
          </div>
        ) : (
          <img
            src={images[index]}
            alt="active"
            className="viewport-img"
            draggable={false}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotate}deg)`,
            }}
          />
        )}
      </div>

      <div className="tool-row">
        <input type="file" accept="image/*" onChange={onFileChange} />
        <button onClick={() => zoom(0.2)}>Zoom +</button>
        <button onClick={() => zoom(-0.2)}>Zoom -</button>
        <button onClick={rotateLeft}>Rotate ⟲</button>
        <button onClick={rotateRight}>Rotate ⟳</button>
        <button onClick={resetTransforms}>Reset</button>
        <button
          className="primary"
          onClick={processImage}
          disabled={images.length === 0 || isProcessing}
        >
          {isProcessing ? "Processing..." : "Process Image"}
        </button>
        <button className="danger" onClick={clearAll}>
          Clear All
        </button>
      </div>

      <div className="tool-row">
        <button
          onClick={onViewDashboard}
          style={{
            flex: 1,
            padding: "10px",
            background: "#1f6feb",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          📊 View Dashboard
        </button>
      </div>

      <div className="status-row">
        <div>
          Image: {images.length === 0 ? 0 : index + 1}/{images.length}
        </div>
        <div>
          Zoom: {Math.round(scale * 100)}% Rotate:{" "}
          {((rotate % 360) + 360) % 360}°
        </div>
      </div>
    </aside>
  );
}
