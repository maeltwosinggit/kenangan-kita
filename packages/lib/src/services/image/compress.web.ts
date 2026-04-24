export type CompressOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

export async function compressImageOnWeb(file: Blob, options: CompressOptions = {}) {
  const maxWidth = options.maxWidth ?? 1600;
  const maxHeight = options.maxHeight ?? 1600;
  const quality = options.quality ?? 0.72;

  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context is unavailable");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (!nextBlob) {
        reject(new Error("Compression failed"));
        return;
      }
      resolve(nextBlob);
    }, "image/jpeg", quality);
  });

  return { blob, width, height, mimeType: blob.type || "image/jpeg" };
}

