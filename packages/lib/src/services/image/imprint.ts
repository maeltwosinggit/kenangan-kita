export type ImprintOptions = {
  nickname?: string | null;
  capturedAt: string;
  eventName: string;
};

/**
 * Imprints the revamped Fujifilm-style orange stamp onto an image.
 * Includes: Time, Date, Event Name, Capturer, and Product Branding.
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
  
  const timeSize = Math.round(72 * scale);
  const dateSize = Math.round(42 * scale);
  const metaSize = Math.round(38 * scale);
  const brandSize = Math.round(30 * scale);
  const padding = Math.round(60 * scale);
  const lineSpacing = 1.3;

  const fontFace = "'Share Tech Mono', 'Courier New', monospace";
  
  ctx.textAlign = "right";
  ctx.fillStyle = "#f97316"; // Fuji Orange
  ctx.shadowColor = "rgba(249, 115, 22, 0.7)";
  ctx.shadowBlur = Math.round(12 * scale);

  const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateStr = dateObj.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, ".");

  // Draw Bottom-Up
  let currentY = canvas.height - padding;

  // 1. Product Branding (Bottom-most)
  ctx.font = `${brandSize}px ${fontFace}`;
  ctx.globalAlpha = 0.6;
  ctx.fillText("• KENANGAN KITA •", canvas.width - padding, currentY);
  currentY -= (brandSize * lineSpacing);

  // 2. Capturer
  if (nickname) {
    ctx.font = `bold ${metaSize}px ${fontFace}`;
    ctx.globalAlpha = 0.8;
    ctx.fillText(`BY: ${nickname.toUpperCase()}`, canvas.width - padding, currentY);
    currentY -= (metaSize * lineSpacing);
  }

  // 3. Event Name
  ctx.font = `bold ${metaSize}px ${fontFace}`;
  ctx.globalAlpha = 0.9;
  ctx.fillText(eventName.toUpperCase(), canvas.width - padding, currentY);
  currentY -= (metaSize * lineSpacing);

  // 4. Date
  ctx.font = `${dateSize}px ${fontFace}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(dateStr, canvas.width - padding, currentY);
  currentY -= (dateSize * 1.15);

  // 5. Time (Top-most / Primary)
  ctx.font = `bold ${timeSize}px ${fontFace}`;
  ctx.globalAlpha = 1.0;
  ctx.fillText(timeStr, canvas.width - padding, currentY);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Imprint failed"));
    }, "image/jpeg", 0.92);
  });
}
