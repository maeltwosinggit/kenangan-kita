export type ImprintOptions = {
  nickname?: string | null;
  capturedAt: string;
  eventName: string;
};

/**
 * Imprints the revamped Fujifilm-style orange stamp onto an image.
 * Uses an editorial distribution:
 * - Branding: Top Right
 * - Meta (Event, Time, User): Bottom Right
 */
export async function imprintPhoto(imageBlob: Blob, options: ImprintOptions): Promise<Blob> {
  const { nickname, capturedAt, eventName } = options;
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
  
  const timeSize = Math.round(64 * scale);
  const dateSize = Math.round(38 * scale);
  const eventSize = Math.round(34 * scale);
  const nameSize = Math.round(34 * scale);
  const brandSize = Math.round(28 * scale);
  const padding = Math.round(80 * scale);
  const spacing = 1.25;

  const fontFace = "'Share Tech Mono', 'Courier New', monospace";
  
  ctx.textAlign = "right";
  ctx.fillStyle = "#f97316"; // Fuji Orange
  ctx.shadowColor = "rgba(249, 115, 22, 0.6)";
  ctx.shadowBlur = Math.round(10 * scale);

  const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateStr = dateObj.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, ".");

  // ── TOP RIGHT: Branding ──
  ctx.font = `bold ${brandSize}px ${fontFace}`;
  ctx.globalAlpha = 0.5;
  ctx.fillText("• KENANGAN KITA •", canvas.width - padding, padding + brandSize);

  // ── BOTTOM RIGHT: Event & Time (Stacked Bottom-Up) ──
  let currentY = canvas.height - padding;

  // 1. Nickname (Bottom-most)
  if (nickname) {
    ctx.font = `bold ${nameSize}px ${fontFace}`;
    ctx.globalAlpha = 0.75;
    ctx.fillText(nickname.toUpperCase(), canvas.width - padding, currentY);
    currentY -= (nameSize * spacing);
  }

  // 2. Event Name
  ctx.font = `${eventSize}px ${fontFace}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(eventName.toUpperCase(), canvas.width - padding, currentY);
  currentY -= (eventSize * spacing);

  // 3. Date
  ctx.font = `${dateSize}px ${fontFace}`;
  ctx.globalAlpha = 0.9;
  ctx.fillText(dateStr, canvas.width - padding, currentY);
  currentY -= (dateSize * 1.1);

  // 4. Time (Top-most in stack)
  ctx.font = `bold ${timeSize}px ${fontFace}`;
  ctx.globalAlpha = 1.0;
  ctx.fillText(timeStr, canvas.width - padding, currentY);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Imprint failed"));
    }, "image/jpeg", 0.95); // High quality
  });
}
