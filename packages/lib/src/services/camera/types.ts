export type CapturedPhoto = {
  blob: Blob;
  previewUrl: string;
  mimeType: string;
};

export interface CameraAdapter {
  start(): Promise<void>;
  capture(mirror?: boolean): Promise<CapturedPhoto>;
  stop(): void;
  getZoomCapabilities?(): { min: number; max: number; step: number } | null;
  setZoom?(value: number): Promise<void>;
}

