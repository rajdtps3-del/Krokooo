/**
 * WebRTC PeerConnection Manager & Local Media Manager for Camfrog Video Chat
 */

import { VideoFilterType } from '../types';

export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export interface MediaDeviceOptions {
  videoDeviceId?: string;
  audioDeviceId?: string;
  resolution?: '720p' | '480p' | '360p';
}

export class LocalMediaManager {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  private dataArray: Uint8Array | null = null;
  private isMuted: boolean = false;
  private isVideoPaused: boolean = false;

  public async getDevices(): Promise<{ videoDevices: MediaDeviceInfo[]; audioDevices: MediaDeviceInfo[] }> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return { videoDevices: [], audioDevices: [] };
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        videoDevices: devices.filter((d) => d.kind === 'videoinput'),
        audioDevices: devices.filter((d) => d.kind === 'audioinput'),
      };
    } catch (err) {
      console.warn('Failed to enumerate devices:', err);
      return { videoDevices: [], audioDevices: [] };
    }
  }

  public async startLocalStream(options?: MediaDeviceOptions): Promise<MediaStream> {
    this.stopLocalStream();

    const videoConstraints: boolean | MediaTrackConstraints = options?.videoDeviceId
      ? { deviceId: { exact: options.videoDeviceId } }
      : true;

    const audioConstraints: boolean | MediaTrackConstraints = options?.audioDeviceId
      ? { deviceId: { exact: options.audioDeviceId } }
      : true;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });

      this.setupAudioAnalyser(this.localStream);
      return this.localStream;
    } catch (err) {
      console.warn('getUserMedia failed, trying video-only or audio-only fallback:', err);
      // Try video only or fallback
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ video: true });
        return this.localStream;
      } catch (err2) {
        // Create canvas simulated video stream if camera permission is not available or blocked in iframe
        this.localStream = this.createSyntheticStream('Broadcaster Live');
        return this.localStream;
      }
    }
  }

  public async startScreenShare(): Promise<MediaStream | null> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      return this.screenStream;
    } catch (err) {
      console.warn('Screen share cancelled or failed:', err);
      return null;
    }
  }

  public stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }
  }

  public stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
  }

  public getStream(): MediaStream | null {
    return this.screenStream || this.localStream;
  }

  public toggleAudio(enabled: boolean) {
    this.isMuted = !enabled;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  public toggleVideo(enabled: boolean) {
    this.isVideoPaused = !enabled;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  private setupAudioAnalyser(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 64;
      source.connect(this.audioAnalyser);

      const bufferLength = this.audioAnalyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    } catch (err) {
      console.warn('Audio analyser setup failed:', err);
    }
  }

  public getAudioLevel(): number {
    if (this.isMuted || !this.audioAnalyser || !this.dataArray) return 0;
    this.audioAnalyser.getByteFrequencyData(this.dataArray);
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const avg = sum / this.dataArray.length;
    return Math.min(100, Math.round((avg / 128) * 100));
  }

  // Create high quality fallback animated stream if hardware cam is unavailable
  public createSyntheticStream(userName: string): MediaStream {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    let angle = 0;
    const draw = () => {
      if (!ctx) return;
      angle += 0.03;

      // Dark studio background
      const grad = ctx.createRadialGradient(320, 240, 50, 320, 240, 320);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Ambient pulse ring
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const r = 80 + Math.sin(angle * 2) * 8;
      ctx.arc(320, 200, r, 0, Math.PI * 2);
      ctx.stroke();

      // Avatar circle
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(320, 200, 70, 0, Math.PI * 2);
      ctx.fill();

      // Avatar text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(userName.substring(0, 2).toUpperCase(), 320, 200);

      // Camfrog Live broadcast tag
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(240, 320, 160, 34, 17);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('🔴 CAMFROG LIVE', 320, 342);

      // User name below
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.fillText(userName, 320, 385);

      requestAnimationFrame(draw);
    };

    draw();
    return canvas.captureStream(30);
  }

  // Snapshot video frame to download/avatar
  public captureSnapshot(videoElement: HTMLVideoElement): string | null {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Snapshot capture failed:', e);
      return null;
    }
  }
}

export function getVideoFilterClass(filter?: VideoFilterType | string): string {
  switch (filter) {
    case 'warm':
      return 'sepia(30%) saturate(140%) brightness(105%)';
    case 'cool':
      return 'hue-rotate(180deg) saturate(110%)';
    case 'studio':
      return 'contrast(115%) brightness(108%) saturate(120%)';
    case 'cyberpunk':
      return 'hue-rotate(290deg) contrast(130%) saturate(160%)';
    case 'vintage':
      return 'sepia(60%) contrast(90%) brightness(95%)';
    case 'bw':
      return 'grayscale(100%) contrast(120%)';
    case 'blur':
      return 'blur(2px)';
    case 'none':
    default:
      return 'none';
  }
}
