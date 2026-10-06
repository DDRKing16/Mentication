// @ts-check
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlusGate from "@/components/plus/PlusGate";

export default function Dear2100() {
  const navigate = useNavigate();
  const frame = useRef(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const receive = event => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === "dear2100-saved-exit") {
        setSaving(false);
        navigate("/");
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [navigate]);
  return (
    <PlusGate route="dear-2100" name="Dear 2100" background="#112b50"
      previewImage="/media/plus-preview/dear2100.jpg"
      promise="Understand the pattern behind what you keep postponing."
      detail="Then choose your next small step, and keep it in your own book.">
      <div className="fixed inset-0 flex flex-col bg-[#f7f1e6]" aria-label="Dear 2100">
        <div className="flex shrink-0 items-center justify-end border-b border-[#112b50]/15 px-4 py-1">
          <button type="button" onClick={() => {
            setSaving(true);
            frame.current?.contentWindow?.postMessage({ type: "dear2100-save-exit" }, window.location.origin);
          }} className="min-h-11 text-sm font-medium text-[#112b50]">
            {saving ? "Saving… check any message below" : "Save & return Home"}
          </button>
        </div>
        <iframe ref={frame} title="Dear 2100" src="/dear2100-updated/index.html" className="min-h-0 flex-1 w-full border-0" allow="autoplay" />
      </div>
    </PlusGate>
  );
}
