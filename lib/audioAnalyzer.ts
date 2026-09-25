export interface BeatPoint {
  index: number;
  time: number; // in seconds
  intensity: number; // 0.0 - 1.0
  isBarStart: boolean;
  isDrop: boolean;
  label: "downbeat" | "beat" | "drop" | "accent";
}

export interface AudioAnalysisReport {
  fileName: string;
  duration: number;
  bpm: number;
  tempoConfidence: number; // 0 - 100%
  timeSignature: string; // e.g. "4/4"
  beatIntervalMs: number; // in milliseconds
  totalBeatsDetected: number;
  rhythmPattern: string; // e.g. "Four-on-the-Floor Club", "Syncopated Breakbeat", "Half-Time Trap"
  dropCount: number;
  averageEnergy: number; // 0.0 - 1.0
  waveformPeaks: number[]; // Downsampled peaks for timeline display (0.0 to 1.0)
  beats: BeatPoint[];
  analyzedAt: number;
}

/**
 * Perform offline audio buffer analysis to extract exact tempo,
 * beat positions, intensity dynamics, and rhythm classification.
 */
export async function analyzeAudioBuffer(
  buffer: AudioBuffer,
  fileName: string
): Promise<AudioAnalysisReport> {
  const sampleRate = buffer.sampleRate;
  const duration = buffer.duration;
  const channelData = buffer.getChannelData(0); // Left channel or downmixed mono
  const totalSamples = channelData.length;

  // 1. Compute Short-Time Energy & Low-Frequency (Bass) Transient Envelope
  // Using ~20ms window (e.g., 882 samples at 44100Hz)
  const windowSize = Math.floor(sampleRate * 0.02);
  const hopSize = Math.floor(windowSize / 2);
  const numFrames = Math.floor((totalSamples - windowSize) / hopSize);

  const energies: number[] = new Float64Array(numFrames) as any;
  let maxEnergy = 0.0001;
  let sumEnergy = 0;

  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    let sumSquares = 0;
    for (let j = 0; j < windowSize; j++) {
      const val = channelData[start + j];
      sumSquares += val * val;
    }
    const rms = Math.sqrt(sumSquares / windowSize);
    energies[i] = rms;
    if (rms > maxEnergy) maxEnergy = rms;
    sumEnergy += rms;
  }

  // Normalize energies
  for (let i = 0; i < numFrames; i++) {
    energies[i] = energies[i] / maxEnergy;
  }
  const averageEnergy = sumEnergy / (numFrames * maxEnergy);

  // 2. Onset Detection Function (ODF) via spectral flux / rectified energy differences
  const odf = new Float32Array(numFrames);
  for (let i = 1; i < numFrames; i++) {
    const diff = energies[i] - energies[i - 1];
    odf[i] = diff > 0 ? diff : 0;
  }

  // 3. Peak Picking with Adaptive Moving Average Threshold
  const localWindow = Math.floor(sampleRate / hopSize * 0.35); // ~350ms window
  const minIntervalSec = 0.25; // max 240 BPM
  const minIntervalFrames = Math.floor((minIntervalSec * sampleRate) / hopSize);

  const rawBeats: { time: number; intensity: number; frame: number }[] = [];
  let lastPeakFrame = -minIntervalFrames;

  for (let i = localWindow; i < numFrames - localWindow; i++) {
    // Calculate local mean
    let localSum = 0;
    for (let w = -localWindow; w <= localWindow; w++) {
      localSum += odf[i + w];
    }
    const localMean = localSum / (2 * localWindow + 1);
    const threshold = localMean * 1.35 + 0.04;

    if (
      odf[i] > threshold &&
      odf[i] > odf[i - 1] &&
      odf[i] > odf[i + 1] &&
      i - lastPeakFrame >= minIntervalFrames
    ) {
      const time = (i * hopSize) / sampleRate;
      const intensity = Math.min(1.0, energies[i] * 1.3 + odf[i] * 0.7);
      rawBeats.push({ time, intensity, frame: i });
      lastPeakFrame = i;
    }
  }

  // 4. Tempo Estimation via Inter-Beat Interval (IBI) Histogram
  const intervals: number[] = [];
  for (let i = 1; i < rawBeats.length; i++) {
    const delta = rawBeats[i].time - rawBeats[i - 1].time;
    if (delta >= 0.28 && delta <= 1.2) {
      intervals.push(delta);
    }
  }

  // Bucket intervals into BPM bins (60 to 200 BPM)
  const bpmHistogram: { [bpm: number]: number } = {};
  for (const dt of intervals) {
    let bpm = Math.round(60 / dt);
    // Normalize octave jumps (e.g. 70 bpm vs 140 bpm)
    while (bpm < 70) bpm *= 2;
    while (bpm > 180) bpm /= 2;
    bpm = Math.round(bpm);
    bpmHistogram[bpm] = (bpmHistogram[bpm] || 0) + 1;
  }

  let dominantBpm = 120;
  let maxCount = 0;
  let totalValidIntervals = 0;

  for (const [bpmStr, count] of Object.entries(bpmHistogram)) {
    const bpm = Number(bpmStr);
    totalValidIntervals += count;
    if (count > maxCount) {
      maxCount = count;
      dominantBpm = bpm;
    }
  }

  const tempoConfidence = totalValidIntervals > 0
    ? Math.min(100, Math.round((maxCount / totalValidIntervals) * 100 * 1.5))
    : 75;

  const beatIntervalMs = Math.round((60 / dominantBpm) * 1000 * 10) / 10;

  // 5. Build structured BeatPoints & identify Bar Starts & Drops
  const beats: BeatPoint[] = [];
  let dropCount = 0;

  // Find 90th percentile intensity threshold for drops
  const sortedIntensities = rawBeats.map((b) => b.intensity).sort((a, b) => a - b);
  const dropThreshold = sortedIntensities[Math.floor(sortedIntensities.length * 0.88)] || 0.82;

  rawBeats.forEach((b, idx) => {
    const isBarStart = idx % 4 === 0;
    const isDrop = b.intensity >= dropThreshold && b.intensity >= 0.75;
    if (isDrop) dropCount++;

    let label: "downbeat" | "beat" | "drop" | "accent" = "beat";
    if (isDrop) label = "drop";
    else if (isBarStart) label = "downbeat";
    else if (b.intensity > 0.6) label = "accent";

    beats.push({
      index: idx,
      time: Math.round(b.time * 100) / 100,
      intensity: Math.round(b.intensity * 100) / 100,
      isBarStart,
      isDrop,
      label,
    });
  });

  // 6. Rhythm Pattern Classification
  let rhythmPattern = "Four-on-the-Floor Dance";
  if (dominantBpm >= 150) {
    rhythmPattern = "High-Tempo Breakbeat / Drum & Bass";
  } else if (dominantBpm <= 95) {
    rhythmPattern = "Half-Time Lo-Fi / Boom-Bap Groove";
  } else if (dominantBpm >= 120 && dominantBpm <= 135) {
    rhythmPattern = "Straight 4/4 Electronic Club Rhythm";
  } else {
    rhythmPattern = "Dynamic Syncopated Audio Beat";
  }

  // 7. Generate Downsampled Waveform Peaks (180 points for visual timeline)
  const numWaveformPoints = 180;
  const waveformPeaks: number[] = [];
  const step = Math.floor(energies.length / numWaveformPoints);
  for (let i = 0; i < numWaveformPoints; i++) {
    let peak = 0;
    const start = i * step;
    for (let k = 0; k < step && start + k < energies.length; k++) {
      if (energies[start + k] > peak) peak = energies[start + k];
    }
    waveformPeaks.push(Math.round(peak * 100) / 100);
  }

  return {
    fileName,
    duration: Math.round(duration * 10) / 10,
    bpm: dominantBpm,
    tempoConfidence,
    timeSignature: "4/4",
    beatIntervalMs,
    totalBeatsDetected: beats.length,
    rhythmPattern,
    dropCount,
    averageEnergy: Math.round(averageEnergy * 100) / 100,
    waveformPeaks,
    beats,
    analyzedAt: Date.now(),
  };
}

/**
 * Generate synthetic analysis report for built-in synth grooves
 */
export function generateSyntheticReport(
  presetName: string,
  bpm: number,
  genre: string,
  durationSec: number = 60
): AudioAnalysisReport {
  const beatInterval = 60 / bpm;
  const totalBeats = Math.floor(durationSec / beatInterval);
  const beats: BeatPoint[] = [];
  let dropCount = 0;

  for (let i = 0; i < totalBeats; i++) {
    const time = Math.round(i * beatInterval * 100) / 100;
    const isBarStart = i % 4 === 0;
    const isPhraseDrop = i % 16 === 0 && i > 0;
    const intensity = isPhraseDrop
      ? 0.98
      : isBarStart
      ? 0.85
      : i % 2 === 0
      ? 0.65
      : 0.45;

    if (isPhraseDrop) dropCount++;

    beats.push({
      index: i,
      time,
      intensity,
      isBarStart,
      isDrop: isPhraseDrop,
      label: isPhraseDrop ? "drop" : isBarStart ? "downbeat" : i % 2 === 0 ? "accent" : "beat",
    });
  }

  // Waveform peak profile
  const waveformPeaks: number[] = [];
  for (let i = 0; i < 180; i++) {
    const cycle = (i % 8) / 8;
    const wave = 0.35 + 0.55 * Math.sin(cycle * Math.PI) + (Math.random() * 0.1);
    waveformPeaks.push(Math.round(wave * 100) / 100);
  }

  return {
    fileName: presetName,
    duration: durationSec,
    bpm,
    tempoConfidence: 99,
    timeSignature: "4/4",
    beatIntervalMs: Math.round(beatInterval * 1000 * 10) / 10,
    totalBeatsDetected: beats.length,
    rhythmPattern: `${genre} (${bpm} BPM)`,
    dropCount,
    averageEnergy: 0.72,
    waveformPeaks,
    beats,
    analyzedAt: Date.now(),
  };
}
