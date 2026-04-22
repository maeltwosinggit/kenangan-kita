export type CapturedPhoto = {
  blob: Blob;
  previewUrl: string;
  mimeType: string;
};

export interface CameraAdapter {
  start(): Promise<void>;
  capture(): Promise<CapturedPhoto>;
  stop(): void;
}

