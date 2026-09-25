export interface AudioBeatState {
  isBeat: boolean;
  beatCount: number;
  beatConfidence: number;
  energy: number; // 0.0 - 1.0
  bass: number; // 0.0 - 1.0
  mid: number; // 0.0 - 1.0
  treble: number; // 0.0 - 1.0
  bpm: number;
  time: number;
  duration: number;
  isPlaying: boolean;
  isSuspended: boolean;
  frequencies: Uint8Array;
  waveform: Uint8Array;
}

export type AudioSourceType = "track" | "synth" | "file" | "mic";

export interface BeatEvent {
  beatCount: number;
  isDownbeat: boolean; // Beat 0 of 4 (start of bar)
  isHalfBar: boolean;  // Beat 0 or 2 of 4
  bpm: number;
  time: number;
  bass: number;
  energy: number;
  confidence: number;
}

export interface BeatTrack {
  id: string;
  name: string;
  bpm: number;
  genre: string;
  src: string;
  description: string;
}

export const BEAT_TRACKS: BeatTrack[] = [
  {
    id: "cyberpulse",
    name: "Cyber Pulse Synthwave",
    bpm: 124,
    genre: "Synthwave / Cyberpunk",
    src: "/tracks/cyber-pulse.wav",
    description: "Punchy 4-on-the-floor analog kick, driving rolling bassline, and crisp hats.",
  },
  {
    id: "clubdrop",
    name: "808 Club Bass & Drop",
    bpm: 128,
    genre: "Electro / Trap",
    src: "/tracks/club-drop.wav",
    description: "Heavy sub-bass 808 kick, sharp clap, and sub wobble for dramatic visual switching.",
  },
  {
    id: "techhouse",
    name: "Latin Tech House Groove",
    bpm: 126,
    genre: "Tech House",
    src: "/tracks/tech-house.wav",
    description: "Driving kick, open hi-hat on the offbeat, and syncopated bouncy bass groove.",
  },
  {
    id: "breakbeat",
    name: "High-Octane Drum & Bass",
    bpm: 165,
    genre: "Drum & Bass / Jungle",
    src: "/tracks/dnb-rush.wav",
    description: "Rapid synced breakbeat transients, rolling snares, and heavy reese sub.",
  },
  {
    id: "lofi",
    name: "Midnight Boom-Bap Lo-Fi",
    bpm: 88,
    genre: "Lo-Fi Hip Hop",
    src: "/tracks/lofi-chill.wav",
    description: "Warm boom-bap vintage kick, vinyl snap snare, and mellow groove.",
  },
];

// Alias for backwards compatibility with existing UI references
export const SYNTH_PRESETS = BEAT_TRACKS;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private masterGain: GainNode | null = null;
  private recordingDestination: MediaStreamAudioDestinationNode | null = null;

  // Primary HTMLAudioElement for 100% reliable hardware speaker playback
  private audioElement: HTMLAudioElement | null = null;
  private uploadedAudioBlobUrl: string | null = null;

  // Microphone stream source
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  // Beat tracking state
  private activeTrackId: string = "cyberpulse";
  private currentBpm: number = 124;
  private currentFileName: string = "Cyber Pulse Synthwave (124 BPM)";
  private sourceType: AudioSourceType = "track";
  private isPlayingState: boolean = false;
  private volume: number = 0.9;
  private isMuted: boolean = false;
  private lastDispatchedBeat: number = -1;
  private beatCount: number = 0;
  private sensitivity: number = 1.15;

  // Frequency buffers for visualizer
  private frequencyData: Uint8Array = new Uint8Array(256);
  private timeDomainData: Uint8Array = new Uint8Array(256);

  // Onset detection for uploaded files & mic
  private bassHistory: number[] = [];
  private lastFileBeatTime: number = 0;

  // Event Listeners
  private stateListeners: Set<() => void> = new Set();
  private beatListeners: Set<(event: BeatEvent) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.initAudioElement();

      // Global unlocker: starts or unblocks audio upon ANY user interaction
      const unlockAudio = () => {
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }
      };

      window.addEventListener("pointerdown", unlockAudio, { passive: true });
      window.addEventListener("keydown", unlockAudio, { passive: true });
      window.addEventListener("click", unlockAudio, { passive: true });
      window.addEventListener("touchstart", unlockAudio, { passive: true });
    }
  }

  private initAudioElement() {
    if (this.audioElement || typeof window === "undefined") return;

    const audio = new Audio();
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = this.volume;
    audio.crossOrigin = "anonymous";
    audio.src = BEAT_TRACKS[0].src;

    audio.onplay = () => {
      this.isPlayingState = true;
      this.notifyState();
    };

    audio.onpause = () => {
      this.isPlayingState = false;
      this.notifyState();
    };

    audio.onended = () => {
      this.isPlayingState = false;
      this.notifyState();
    };

    this.audioElement = audio;
  }

  private initWebAudioContext() {
    if (this.ctx || typeof window === "undefined") return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.7;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.recordingDestination = this.ctx.createMediaStreamDestination();

      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);

      if (this.audioElement && !this.mediaSource) {
        try {
          this.mediaSource = this.ctx.createMediaElementSource(this.audioElement);
          this.mediaSource.connect(this.analyser);
        } catch (e) {
          console.warn("Web Audio media element route note:", e);
        }
      }

      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      if (this.recordingDestination) {
        this.masterGain.connect(this.recordingDestination);
      }
    } catch (e) {
      console.warn("Could not init Web Audio Context:", e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public addBeatListener(listener: (event: BeatEvent) => void): () => void {
    this.beatListeners.add(listener);
    return () => {
      this.beatListeners.delete(listener);
    };
  }

  private notifyState() {
    this.stateListeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error("State listener error:", e);
      }
    });
  }

  private dispatchBeat(event: BeatEvent) {
    this.beatCount = event.beatCount;
    this.beatListeners.forEach((l) => {
      try {
        l(event);
      } catch (e) {
        console.error("Beat listener error:", e);
      }
    });
  }

  private resetBeatTracking() {
    this.lastDispatchedBeat = -1;
    this.beatCount = 0;
    this.bassHistory = [];
    this.lastFileBeatTime = 0;
  }

  public async resumeAudioContext(): Promise<void> {
    this.initAudioElement();
    this.initWebAudioContext();

    if (this.ctx && this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn("AudioContext resume note:", e);
      }
    }
  }

  public isAudioSuspended(): boolean {
    return this.ctx?.state === "suspended" || this.ctx?.state === "closed";
  }

  // Play an immediate test sound chime to verify speakers
  public async playTestTone(): Promise<void> {
    this.initWebAudioContext();
    if (this.ctx) {
      try {
        await this.ctx.resume();
        const t = this.ctx.currentTime + 0.01;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, t); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.5, t + 0.18); // C6

        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.32);
      } catch (e) {
        console.warn("Oscillator test tone fallback:", e);
      }
    }

    // Also trigger audio element play for 1 second if paused
    if (this.audioElement && this.audioElement.paused) {
      try {
        await this.audioElement.play();
        this.isPlayingState = true;
        this.notifyState();
      } catch (e) {
        console.warn("Audio play test note:", e);
      }
    }

    this.dispatchBeat({
      beatCount: this.beatCount + 1,
      isDownbeat: true,
      isHalfBar: true,
      bpm: this.currentBpm,
      time: performance.now() / 1000,
      bass: 0.9,
      energy: 0.95,
      confidence: 1.0,
    });
  }

  // Play one of the built-in studio tracks
  public async startSynthPreset(trackId: string = "cyberpulse"): Promise<void> {
    this.initAudioElement();
    this.initWebAudioContext();
    await this.resumeAudioContext();
    this.stopMic();

    const track = BEAT_TRACKS.find((t) => t.id === trackId) || BEAT_TRACKS[0];
    this.activeTrackId = track.id;
    this.currentBpm = track.bpm;
    this.currentFileName = `${track.name} (${track.bpm} BPM)`;
    this.sourceType = "track";
    this.resetBeatTracking();

    if (this.audioElement) {
      this.audioElement.src = track.src;
      this.audioElement.currentTime = 0;
      this.audioElement.volume = this.isMuted ? 0 : this.volume;

      try {
        await this.audioElement.play();
        this.isPlayingState = true;
      } catch (e) {
        console.warn("Play error waiting for gesture:", e);
        this.isPlayingState = false;
      }
    }

    this.notifyState();
  }

  // Load custom audio file (MP3, WAV, etc.)
  public async loadAudioFile(file: File): Promise<void> {
    this.initAudioElement();
    this.initWebAudioContext();
    await this.resumeAudioContext();
    this.stopMic();

    if (this.uploadedAudioBlobUrl) {
      URL.revokeObjectURL(this.uploadedAudioBlobUrl);
      this.uploadedAudioBlobUrl = null;
    }

    const objectUrl = URL.createObjectURL(file);
    this.uploadedAudioBlobUrl = objectUrl;

    if (this.audioElement) {
      this.audioElement.src = objectUrl;
      this.audioElement.currentTime = 0;
      this.audioElement.volume = this.isMuted ? 0 : this.volume;

      this.currentFileName = file.name;
      this.sourceType = "file";
      this.resetBeatTracking();

      try {
        await this.audioElement.play();
        this.isPlayingState = true;
      } catch (e) {
        console.warn("File playback waiting for gesture:", e);
        this.isPlayingState = false;
      }
    }

    this.notifyState();
  }

  public async startMic(): Promise<void> {
    this.initWebAudioContext();
    await this.resumeAudioContext();
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.stopMic();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;
      if (this.ctx && this.analyser) {
        this.micSource = this.ctx.createMediaStreamSource(stream);
        this.micSource.connect(this.analyser);
      }
      this.sourceType = "mic";
      this.currentFileName = "Live Microphone Input";
      this.resetBeatTracking();
      this.isPlayingState = true;
      this.notifyState();
    } catch (err) {
      console.error("Microphone access failed", err);
      throw err;
    }
  }

  public async togglePlayPause(): Promise<void> {
    this.initAudioElement();
    await this.resumeAudioContext();

    if (this.sourceType === "mic") {
      this.stopMic();
      this.sourceType = "track";
      this.currentFileName = `${BEAT_TRACKS.find((track) => track.id === this.activeTrackId)?.name || BEAT_TRACKS[0].name} (${this.currentBpm} BPM)`;
      this.isPlayingState = false;
      this.notifyState();
      return;
    }

    if (this.audioElement) {
      if (this.audioElement.paused) {
        try {
          if (!this.audioElement.src) {
            const track = BEAT_TRACKS.find((t) => t.id === this.activeTrackId) || BEAT_TRACKS[0];
            this.audioElement.src = track.src;
          }
          await this.audioElement.play();
          this.isPlayingState = true;
        } catch (e) {
          console.warn("AudioElement play waiting for interaction:", e);
        }
      } else {
        this.audioElement.pause();
        this.isPlayingState = false;
      }
    }

    this.notifyState();
  }

  public seek(progressRatio: number): void {
    if (this.audioElement && this.audioElement.duration) {
      this.audioElement.currentTime = progressRatio * this.audioElement.duration;
    }
  }

  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    this.isMuted = this.volume === 0;

    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notifyState();
  }

  public setSensitivity(multiplier: number): void {
    this.sensitivity = Math.max(0.8, Math.min(2.5, multiplier));
  }

  private stopMic() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch (e) {}
      this.micSource = null;
    }
  }

  // Update beat frame and synchronize beats to audio
  public updateBeatFrame(): AudioBeatState {
    const now = performance.now() / 1000;
    let isBeat = false;
    let bass = 0;
    let energy = 0;
    let mid = 0;
    let treble = 0;

    // Get Web Audio frequency data if available
    if (this.analyser && this.isPlayingState) {
      try {
        this.analyser.getByteFrequencyData(this.frequencyData as any);
        this.analyser.getByteTimeDomainData(this.timeDomainData as any);

        let bassSum = 0;
        for (let i = 0; i <= 6; i++) bassSum += this.frequencyData[i];
        bass = bassSum / (7 * 255);

        let midSum = 0;
        for (let i = 7; i <= 40; i++) midSum += this.frequencyData[i];
        mid = midSum / (34 * 255);

        let trebleSum = 0;
        for (let i = 41; i <= 160; i++) trebleSum += this.frequencyData[i];
        treble = trebleSum / (120 * 255);

        let totalSum = 0;
        for (let i = 0; i < this.frequencyData.length; i++) totalSum += this.frequencyData[i];
        energy = totalSum / (this.frequencyData.length * 255);
      } catch (e) {}
    }

    // 1. If playing built-in track: Synchronize beats directly to audio timeline
    if (this.isPlayingState && this.audioElement && this.sourceType === "track") {
      const curTime = this.audioElement.currentTime;
      const secondsPerBeat = 60.0 / this.currentBpm;
      const calculatedBeat = Math.floor(curTime / secondsPerBeat);

      if (calculatedBeat !== this.lastDispatchedBeat) {
        this.lastDispatchedBeat = calculatedBeat;
        isBeat = true;
        this.beatCount++;

        const isDownbeat = this.beatCount % 4 === 0;
        const isHalfBar = this.beatCount % 2 === 0;

        this.dispatchBeat({
          beatCount: this.beatCount,
          isDownbeat,
          isHalfBar,
          bpm: this.currentBpm,
          time: curTime,
          bass: isDownbeat ? 0.95 : 0.75,
          energy: 0.85,
          confidence: 1.0,
        });
      }
    } else if (
      this.isPlayingState &&
      (this.sourceType === "file" || this.sourceType === "mic")
    ) {
      // Adaptive onset detection for uploaded music files and live input
      const instantBass = bass * 0.75 + energy * 0.25;
      this.bassHistory.push(instantBass);
      if (this.bassHistory.length > 25) this.bassHistory.shift();

      const avgBass =
        this.bassHistory.reduce((a, b) => a + b, 0) / Math.max(1, this.bassHistory.length);
      const threshold = avgBass * this.sensitivity;

      if (
        instantBass > threshold &&
        instantBass > 0.10 &&
        now - this.lastFileBeatTime > 0.22
      ) {
        this.lastFileBeatTime = now;
        isBeat = true;
        this.beatCount++;
        this.dispatchBeat({
          beatCount: this.beatCount,
          isDownbeat: this.beatCount % 4 === 0,
          isHalfBar: this.beatCount % 2 === 0,
          bpm: this.currentBpm,
          time: now,
          bass: instantBass,
          energy,
          confidence: 0.9,
        });
      }
    }

    return {
      isBeat,
      beatCount: this.beatCount,
      beatConfidence: isBeat ? 1.0 : 0,
      energy,
      bass,
      mid,
      treble,
      bpm: this.currentBpm,
      time: this.getCurrentTime(),
      duration: this.getDuration(),
      isPlaying: this.isPlayingState,
      isSuspended: this.isAudioSuspended(),
      frequencies: this.frequencyData,
      waveform: this.timeDomainData,
    };
  }

  public getCurrentTime(): number {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  public getDuration(): number {
    return this.audioElement && this.audioElement.duration ? this.audioElement.duration : 0;
  }

  public getSourceType(): AudioSourceType {
    return this.sourceType;
  }

  public getFileName(): string {
    return this.currentFileName;
  }

  public getIsPlaying(): boolean {
    return this.isPlayingState;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getActiveSynthPreset(): string {
    return this.activeTrackId;
  }

  public getBpm(): number {
    return this.currentBpm;
  }

  public getRecordingStream(): MediaStream {
    this.initAudioElement();
    this.initWebAudioContext();

    if (this.recordingDestination) {
      const stream = this.recordingDestination.stream;
      return typeof stream.clone === "function"
        ? stream.clone()
        : new MediaStream(stream.getAudioTracks());
    }

    const audioWithCapture = this.audioElement as (HTMLAudioElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    }) | null;
    const capture = audioWithCapture?.captureStream || audioWithCapture?.mozCaptureStream;

    return capture ? capture.call(audioWithCapture) : new MediaStream();
  }
}

let instance: AudioEngine | null = null;
export function getAudioEngine(): AudioEngine {
  if (!instance) {
    instance = new AudioEngine();
  }
  return instance;
}
