import { compressImageOnWeb, type CompressOptions } from "./compress.web";

export async function compressImage(file: Blob, options?: CompressOptions) {
  return compressImageOnWeb(file, options);
}

export type { CompressOptions };

