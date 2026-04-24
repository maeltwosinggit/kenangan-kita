import type { CameraAdapter, CapturedPhoto } from "./types";

export class WebCameraAdapter implements CameraAdapter {
  private stream: MediaStream | null = null;
  private readonly video: HTMLVideoElement;
  private readonly canvas: HTMLCanvasElement;

  constructor(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this.video = video;
    this.canvas = canvas;
  }

  async start() {
    try {
      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available. Please use HTTPS or localhost.");
      }

      // Request good resolution for quality captures but don't force frameRate —
      // let the device run at its native rate (30 or 60fps). The browser will
      // pick the closest supported resolution >= the ideal values.
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { min: 720, ideal: 1280 },
          height: { min: 960, ideal: 1280 }
        }
      });
      
      this.video.srcObject = this.stream;
      this.video.setAttribute('playsinline', 'true'); // Critical for iOS Safari
      this.video.setAttribute('autoplay', 'true');
      this.video.setAttribute('muted', 'true');
      
      // Handle video play promise properly to avoid interruption errors
      try {
        const playPromise = this.video.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } catch (playError) {
        // Ignore play interruption errors if video is already playing
        if (playError instanceof Error && 
            !playError.message.includes('interrupted') && 
            !playError.message.includes('aborted')) {
          throw playError;
        }
        // Video is likely already playing, continue
      }
      
      // Wait for video to be ready with dimensions
      return new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max
        
        const checkReady = () => {
          attempts++;
          if (this.video.videoWidth > 0 && this.video.videoHeight > 0) {
            resolve();
          } else if (attempts >= maxAttempts) {
            reject(new Error("Camera timeout - please refresh and allow camera permission"));
          } else {
            setTimeout(checkReady, 100);
          }
        };
        
        checkReady();
      });
      
    } catch (err) {
      // Enhanced error messages for mobile debugging
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          throw new Error("Camera permission denied. Please allow camera access and refresh.");
        } else if (err.name === "NotFoundError") {
          throw new Error("No camera found on this device.");
        } else if (err.name === "NotReadableError") {
          throw new Error("Camera is already in use by another app.");
        } else if (err.message.includes("Camera API not available")) {
          throw new Error("Camera requires HTTPS. Try: localhost:3000 on your computer instead.");
        } else {
          throw new Error(`Camera error: ${err.message}`);
        }
      }
      throw new Error("Failed to access camera");
    }
  }

  async capture(): Promise<CapturedPhoto> {
    const width = this.video.videoWidth;
    const height = this.video.videoHeight;
    if (!width || !height) {
      throw new Error("Camera is not ready yet");
    }

    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context is unavailable");
    }

    ctx.drawImage(this.video, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      this.canvas.toBlob((nextBlob) => {
        if (!nextBlob) {
          reject(new Error("Failed to capture image"));
          return;
        }
        resolve(nextBlob);
      }, "image/jpeg");
    });

    return {
      blob,
      previewUrl: URL.createObjectURL(blob),
      mimeType: blob.type || "image/jpeg"
    };
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.video.srcObject = null;
  }
}

