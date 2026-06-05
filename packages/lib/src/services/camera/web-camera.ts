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
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available. Please use HTTPS or localhost.");
      }

      // NOTE: Do NOT include advanced/torch in getUserMedia — it causes silent
      // constraint failures on many devices. Torch is applied after stream start.
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { min: 1280, ideal: 4032 },
          height: { min: 720, ideal: 3024 }
        }
      });

      await this._attachAndPlay();

    } catch (err) {
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

  /**
   * Attach the current stream to the video element and start a background
   * play() retry loop. Resolves immediately — the caller should poll
   * videoWidth > 0 to know when frames are actually flowing.
   *
   * We never wait for play() to succeed here because on mobile (especially
   * incognito / after permission dialog) the browser silently rejects play()
   * until the page is in a true foreground context. Retrying in the background
   * means the video will start rendering as soon as the browser allows it,
   * without any timeout errors shown to the user.
   */
  private _attachAndPlay(): Promise<void> {
    const video = this.video;

    video.srcObject = this.stream;
    video.setAttribute("playsinline", "true");
    video.setAttribute("autoplay", "true");
    video.setAttribute("muted", "true");
    video.muted = true;

    const retry = () => {
      // Stop retrying if the stream has been stopped or video is playing fine
      if (!this.stream) return;
      if (video.videoWidth > 0 && !video.paused) return;
      video.play().catch(() => {});
      setTimeout(retry, 300);
    };

    video.play().catch(() => {});
    setTimeout(retry, 300);

    return Promise.resolve();
  }

  async capture(mirror?: boolean, themeFilter?: string): Promise<CapturedPhoto> {
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

    ctx.save();
    
    // Apply basic CSS filters based on theme
    if (themeFilter === 'monochrome') {
      ctx.filter = "grayscale(100%) contrast(1.2)";
    } else if (themeFilter === 'grain') {
      ctx.filter = "sepia(0.2) contrast(1.1) brightness(0.9)";
    }
    
    if (mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(this.video, 0, 0, width, height);
    ctx.restore();
    
    // For 'grain', manually add noise to the pixel data
    if (themeFilter === 'grain') {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 40;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);
    }
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      this.canvas.toBlob((nextBlob) => {
        if (!nextBlob) {
          reject(new Error("Failed to capture image"));
          return;
        }
        resolve(nextBlob);
      }, "image/jpeg", 1.0); // Use 100% quality for the intermediate capture
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

  async switchCamera(facingMode: "environment" | "user") {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // Use `exact` to force the facing mode — `ideal` is only a hint and browsers
    // (especially Safari/iOS) often ignore it when the previous camera is still
    // preferred. Fall back to `ideal` for devices with a single camera.
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { exact: facingMode },
          width: { min: 1280, ideal: 4032 },
          height: { min: 720, ideal: 3024 }
        }
      });
    } catch {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { min: 1280, ideal: 4032 },
          height: { min: 720, ideal: 3024 }
        }
      });
    }

    await this._attachAndPlay();
  }

  /** Enable or disable the hardware torch. Returns false if not supported. */
  async setTorch(on: boolean): Promise<boolean> {
    if (!this.stream) return false;
    const track = this.stream.getVideoTracks()[0];
    if (!track) return false;
    // Check device capabilities before attempting — avoids silent failures
    if (typeof track.getCapabilities === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const caps = track.getCapabilities() as any;
      if (!caps.torch) return false;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await track.applyConstraints({ advanced: [{ torch: on } as any] });
      return true;
    } catch {
      return false;
    }
  }

  getZoomCapabilities(): { min: number; max: number; step: number } | null {
    if (!this.stream) return null;
    const track = this.stream.getVideoTracks()[0];
    if (!track || typeof track.getCapabilities !== "function") return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const caps = track.getCapabilities() as any;
    if (caps.zoom) {
      return {
        min: caps.zoom.min,
        max: caps.zoom.max,
        step: caps.zoom.step || 0.1
      };
    }
    return null;
  }

  async setZoom(value: number): Promise<void> {
    if (!this.stream) return;
    const track = this.stream.getVideoTracks()[0];
    if (!track) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await track.applyConstraints({ advanced: [{ zoom: value } as any] });
    } catch (err) {
      console.warn("Failed to apply zoom constraint:", err);
    }
  }
}

