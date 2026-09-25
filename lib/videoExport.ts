export type VideoExportAspectRatio = '16:9' | '9:16' | '1:1' | 'fill';
export type VideoExportQuality = '720p' | '1080p';

export interface VideoExportDimensions {
  width: number;
  height: number;
}

export function getVideoExportDimensions(
  aspectRatio: VideoExportAspectRatio,
  quality: VideoExportQuality
): VideoExportDimensions {
  if (aspectRatio === '9:16') {
    return quality === '1080p' ? { width: 1080, height: 1920 } : { width: 720, height: 1280 };
  }

  if (aspectRatio === '1:1') {
    return quality === '1080p' ? { width: 1080, height: 1080 } : { width: 720, height: 720 };
  }

  return quality === '1080p' ? { width: 1920, height: 1080 } : { width: 1280, height: 720 };
}

export function getSupportedVideoMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return null;

  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

export function getVideoExtension(mimeType: string): 'webm' | 'mp4' {
  return mimeType.includes('mp4') ? 'mp4' : 'webm';
}

export function getRecordingBitrate(width: number, height: number, fps: number): number {
  const estimated = Math.round(width * height * fps * 0.11);
  return Math.min(12_000_000, Math.max(2_500_000, estimated));
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function combineMediaStreams(videoStream: MediaStream, audioStream?: MediaStream | null): MediaStream {
  const tracks = [
    ...videoStream.getVideoTracks(),
    ...(audioStream?.getAudioTracks() ?? []),
  ];
  return new MediaStream(tracks);
}
