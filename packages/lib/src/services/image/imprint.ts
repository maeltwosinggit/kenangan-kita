export type ImprintOptions = {
  nickname?: string | null;
  capturedAt: string;
};

/**
 * Imprints the Fujifilm-style orange stamp onto an image using Canvas.
 * This is used for downloads to ensure the memory preserved has the same
 * aesthetic as the in-app lightbox.
 */
export async function imprintPhoto(imageBlob: Blob, options: ImprintOptions): Promise<Blob> {
  const { nickname, capturedAt } = options;
  const dateObj = new Date(capturedAt);

  // 1. Create Image and wait for load
  const img = new Image();
  const imageUrl = URL.createObjectURL(imageBlob);
  
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });

  // 2. Setup Canvas
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // 3. Draw original image
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(imageUrl);

  // 4. Calculate responsive font sizes based on image width
  // Standard base is 2048px (our high-res target)
  const baseWidth = 2048;
  const scale = img.width / baseWidth;
  
  const timeSize = Math.round(72 * scale);
  const dateSize = Math.round(44 * scale);
  const nameSize = Math.round(44 * scale);
  const padding = Math.round(60 * scale);

  // 5. Setup Font (Ensuring Share Tech Mono fallback)
  // Note: Caller should ensure font is loaded
  const fontFace = "'Share Tech Mono', 'Courier New', monospace";
  
  ctx.textAlign = "right";
  ctx.fillStyle = "#f97316"; // Fuji Orange
  
  // Add a soft glow to the text
  ctx.shadowColor = "rgba(249, 115, 22, 0.8)";
  ctx.shadowBlur = Math.round(15 * scale);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  const timeStr = dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const dateStr = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, ".");

  // 6. Draw Text (Bottom-Up)
  let currentY = canvas.height - padding;

  // Nickname
  if (nickname) {
    ctx.font = `bold ${nameSize}px ${fontFace}`;
    ctx.fillText(nickname.toUpperCase(), canvas.width - padding, currentY);
    currentY -= (nameSize * 1.3);
  }

  // Date
  ctx.font = `${dateSize}px ${fontFace}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(dateStr, canvas.width - padding, currentY);
  currentY -= (dateSize * 1.2);

  // Time
  ctx.font = `bold ${timeSize}px ${fontFace}`;
  ctx.globalAlpha = 1.0;
  ctx.fillText(timeStr, canvas.width - padding, currentY);

  // 7. Export as JPEG
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create imprinted blob"));
    }, "image/jpeg", 0.92);
  });
}
