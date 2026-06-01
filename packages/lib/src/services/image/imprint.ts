export type ImprintOptions = {
  nickname?: string | null;
  capturedAt: string;
  eventName: string;
};

/**
 * Imprints the revamped Fujifilm-style orange stamp onto an image.
 * Editorial Layout with Digital Typography:
 * - Top Left: Event Name (Clean Mono)
 * - Top Right: Branding (Subtle Mono)
 * - Bottom Right: Date & Time (DS-Digital)
 */
export async function imprintPhoto(imageBlob: Blob, options: ImprintOptions): Promise<Blob> {
  const { capturedAt, eventName } = options;
  const dateObj = new Date(capturedAt);

  const img = new Image();
  const imageUrl = URL.createObjectURL(imageBlob);
  
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(imageUrl);

  // Responsive scaling (Base: 2048px)
  const scale = img.width / 2048;
  
  const digitalSize = Math.round(62 * scale); // Refined size for digital font
  const eventSize = Math.round(34 * scale);
  const brandSize = Math.round(28 * scale);
  const padding = Math.round(80 * scale);

  // Fonts
  const cleanMono = "'Share Tech Mono', monospace";
  const digitalFont = "'DS-Digital', sans-serif";
  
  ctx.fillStyle = "#f97316"; // Fuji Orange
  ctx.shadowColor = "rgba(249, 115, 22, 0.7)";
  ctx.shadowBlur = Math.round(12 * scale);

  const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateStr = dateObj.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, ".");
  const combinedDateTime = `${dateStr} ${timeStr}`;

  // ── TOP LEFT: Event Name ──
  ctx.textAlign = "left";
  ctx.font = `bold ${eventSize}px ${cleanMono}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(eventName.toUpperCase(), padding, padding + eventSize);

  // ── TOP RIGHT: Branding ──
  ctx.textAlign = "right";
  ctx.font = `bold ${brandSize}px ${cleanMono}`;
  ctx.globalAlpha = 0.5;
  ctx.fillText("• KENANGAN KITA •", canvas.width - padding, padding + brandSize);

  // ── BOTTOM RIGHT: Date & Time (DS-Digital) ──
  ctx.textAlign = "right";
  ctx.font = `italic bold ${digitalSize}px ${digitalFont}`;
  ctx.globalAlpha = 1.0;
  ctx.fillText(combinedDateTime, canvas.width - padding, canvas.height - padding);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Imprint failed"));
    }, "image/jpeg", 0.95);
  });
}
