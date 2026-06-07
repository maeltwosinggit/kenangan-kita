"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { compressImageOnWeb } from "@kenangan/lib/src/services/image/compress.web";
import AdminHeaderWrapper from "../admin-header-wrapper";

export default function MaintenancePage() {
  const supabase = getSupabaseBrowserClient();
  const [status, setStatus] = useState<string>("Idle");
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const startBackfill = async () => {
    setIsRunning(true);
    setStatus("Fetching photo records...");
    setProgress(null);

    try {
      // 1. Fetch all photos
      const { data: photos, error } = await supabase
        .from("photos")
        .select("id, event_id, storage_path")
        .eq("is_deleted", false);

      if (error) throw error;
      if (!photos || photos.length === 0) {
        setStatus("No photos found.");
        setIsRunning(false);
        return;
      }

      setStatus(`Found ${photos.length} photos. Checking for missing thumbnails...`);

      // We don't have a direct way to check storage existence efficiently for thousands of files,
      // so we'll fetch the list of files in the event-photos bucket.
      const { data: filesList, error: listError } = await supabase.storage
        .from("event-photos")
        .list("events", { limit: 100000, search: "" }); // This might not recursively list subfolders easily.

      // Alternatively, we just try downloading the thumb for each, or we just re-generate for all photos taken before today.
      // Let's just process ALL of them, but check if the thumb exists first by doing a lightweight HEAD request or by generating signed URLs.
      
      const thumbPaths = photos.map(p => p.storage_path.replace('.jpg', '_thumb.jpg'));
      const { data: signedThumbs } = await supabase.storage.from("event-photos").createSignedUrls(thumbPaths, 60);
      
      const missingThumbPhotos = [];
      
      // A signed URL is always returned, but if we fetch it and get a 400/404, it means it doesn't exist.
      // To save time, we will just iterate and check.
      setStatus("Starting batch processing...");
      setProgress({ current: 0, total: photos.length });

      let successCount = 0;
      let skipCount = 0;
      let failCount = 0;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setProgress({ current: i + 1, total: photos.length });
        setStatus(`Processing ${i + 1} of ${photos.length}...`);

        const thumbPath = photo.storage_path.replace('.jpg', '_thumb.jpg');
        
        // 1. Check if thumb exists by attempting to download a tiny piece of it
        const { data: thumbCheck } = await supabase.storage.from("event-photos").download(thumbPath);
        if (thumbCheck) {
          skipCount++;
          continue; // Thumbnail already exists
        }

        // 2. Download original
        const { data: originalBlob, error: downloadError } = await supabase.storage.from("event-photos").download(photo.storage_path);
        if (downloadError || !originalBlob) {
          failCount++;
          continue;
        }

        // 3. Compress
        try {
          const { blob: thumbBlob } = await compressImageOnWeb(originalBlob, { maxWidth: 400, maxHeight: 400, quality: 0.6 });
          
          // 4. Upload
          const { error: uploadError } = await supabase.storage.from("event-photos").upload(thumbPath, thumbBlob, {
            contentType: "image/jpeg",
            upsert: true
          });

          if (uploadError) {
            failCount++;
          } else {
            successCount++;
          }
        } catch (e) {
          failCount++;
        }
      }

      setStatus(`Done! Created: ${successCount}. Skipped (Already existed): ${skipCount}. Failed: ${failCount}.`);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeaderWrapper userInfo={{ id: "admin", name: "Admin" }} />
      <main className="mx-auto max-w-[448px] p-6 space-y-6">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
          <h1 className="text-xl font-black text-indigo-900 uppercase tracking-tight mb-2">Thumbnail Backfill Tool</h1>
          <p className="text-sm text-indigo-700 font-medium mb-6 leading-relaxed">
            This tool scans all historical photos in your database and generates missing 30KB thumbnails to save your Supabase egress bandwidth.
            <br/><br/>
            <strong>Note:</strong> This runs directly in your browser. Ensure you are on a fast Wi-Fi network, and do not close this tab until it finishes.
          </p>

          <div className="bg-white rounded-xl p-4 mb-6 border border-indigo-100 shadow-inner">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
            <p className="text-sm font-medium text-slate-900">{status}</p>
            
            {progress && (
              <div className="mt-4">
                <div className="flex justify-between text-[10px] font-bold text-indigo-600 mb-1">
                  <span>{progress.current} / {progress.total}</span>
                  <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={startBackfill}
            disabled={isRunning}
            className="w-full rounded-xl bg-indigo-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
          >
            {isRunning ? "Processing..." : "Start Backfill"}
          </button>
        </div>
      </main>
    </div>
  );
}