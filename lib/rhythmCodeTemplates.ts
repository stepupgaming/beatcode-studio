import { AudioAnalysisReport } from "./audioAnalyzer";

/**
 * 1. Generate code that repeats a function call at the tempo of the music.
 * Features high-precision Web Audio clock scheduling to prevent JS setInterval drift.
 */
export function generateTempoDispatcherCode(report: AudioAnalysisReport): string {
  const bpm = report.bpm;
  const intervalMs = report.beatIntervalMs;
  const intervalSec = (60 / bpm).toFixed(5);

  return `// ============================================================
// TEMPO DISPATCHER: Repeats function calls at music tempo (${bpm} BPM)
// Average Beat Interval: ${intervalMs} ms (${intervalSec} s)
// Time Signature: ${report.timeSignature} | Pattern: ${report.rhythmPattern}
// ============================================================

class HighPrecisionTempoDispatcher {
  constructor(bpm = ${bpm}) {
    this.bpm = bpm;
    this.beatInterval = 60 / bpm; // ${intervalSec} seconds
    this.beatIndex = 0;
    this.isRunning = false;
    this.audioContext = null;
    this.nextBeatTime = 0;
    this.timerId = null;
    this.listeners = [];
  }

  // Register callbacks to execute on each tempo tick
  onBeat(callback) {
    this.listeners.push(callback);
    return this;
  }

  start() {
    if (this.isRunning) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!this.audioContext) this.audioContext = new AudioCtx();
    if (this.audioContext.state === 'suspended') this.audioContext.resume();

    this.isRunning = true;
    this.nextBeatTime = this.audioContext.currentTime + 0.05;
    this.scheduleLoop();
    console.log(\`[TempoDispatcher] Started at \${this.bpm} BPM (\${(this.beatInterval * 1000).toFixed(1)}ms interval)\`);
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) clearTimeout(this.timerId);
    console.log('[TempoDispatcher] Stopped');
  }

  scheduleLoop() {
    if (!this.isRunning) return;
    const currentTime = this.audioContext.currentTime;

    // Look-ahead scheduler window (0.1s)
    while (this.nextBeatTime < currentTime + 0.1) {
      this.dispatchBeat(this.beatIndex, this.nextBeatTime);
      this.nextBeatTime += this.beatInterval;
      this.beatIndex++;
    }

    this.timerId = setTimeout(() => this.scheduleLoop(), 25);
  }

  dispatchBeat(index, scheduledTime) {
    const isBarStart = index % 4 === 0;
    const barNumber = Math.floor(index / 4) + 1;
    const beatInBar = (index % 4) + 1;

    // Invoke user callbacks
    for (const callback of this.listeners) {
      callback({
        beatIndex: index,
        barNumber,
        beatInBar,
        isBarStart,
        bpm: this.bpm,
        time: scheduledTime,
      });
    }
  }
}

// ------------------------------------------------------------
// USAGE EXAMPLE:
// ------------------------------------------------------------
const dispatcher = new HighPrecisionTempoDispatcher(${bpm});

// 1. Core function called on every single beat (${intervalMs}ms)
dispatcher.onBeat((event) => {
  console.log(\`Beat #\${event.beatIndex} (Bar \${event.barNumber} : Beat \${event.beatInBar})\`);

  // Example visual reaction:
  const el = document.getElementById('target-element');
  if (el) {
    el.style.transform = 'scale(1.15)';
    setTimeout(() => { el.style.transform = 'scale(1.0)'; }, 60);
  }

  // Example downbeat scene switch (every 4 beats / bar 1):
  if (event.isBarStart) {
    console.log('>>> [BAR DOWNBEAT] Triggering Scene Transition!');
  }
});

// To start synchronizing:
// dispatcher.start();
`;
}

/**
 * 2. Generate code that creates sequences of actions based on beat intensity.
 */
export function generateIntensitySequencerCode(report: AudioAnalysisReport): string {
  const bpm = report.bpm;

  return `// ============================================================
// BEAT INTENSITY ACTION CHOREOGRAPHER
// Categorizes audio transients by intensity to drive staged actions:
// - Heavy Drops (Intensity >= 0.82): Screen shake, camera cuts, shockwaves
// - Accents & Snares (Intensity 0.55 - 0.81): Color shifts, particle bursts
// - Ghost Notes & Grooves (Intensity < 0.55): Subtle breathing, glowing
// ============================================================

class BeatIntensityChoreographer {
  constructor() {
    this.actionTable = {
      onDrop: [],       // Intensity >= 0.82
      onAccent: [],     // Intensity 0.55 - 0.81
      onGroove: [],     // Intensity < 0.55
      onBarStart: [],   // Beat index % 4 === 0
    };
  }

  // Register staged action handlers
  onDrop(fn) { this.actionTable.onDrop.push(fn); return this; }
  onAccent(fn) { this.actionTable.onAccent.push(fn); return this; }
  onGroove(fn) { this.actionTable.onGroove.push(fn); return this; }
  onBarStart(fn) { this.actionTable.onBarStart.push(fn); return this; }

  // Called each frame / beat event with detected intensity (0.0 to 1.0)
  processBeat(beatIndex, intensity, audioState) {
    const isBarStart = beatIndex % 4 === 0;

    // 1. Bar Start / Downbeat Rule
    if (isBarStart) {
      this.actionTable.onBarStart.forEach(fn => fn(beatIndex, intensity, audioState));
    }

    // 2. Multi-Tier Intensity Sequence Dispatch
    if (intensity >= 0.82) {
      // Tier 1: Heavy Drop / Major Bass Transient
      this.actionTable.onDrop.forEach(fn => fn(beatIndex, intensity, audioState));
    } else if (intensity >= 0.55) {
      // Tier 2: Mid-level Snare / Kick Accent
      this.actionTable.onAccent.forEach(fn => fn(beatIndex, intensity, audioState));
    } else {
      // Tier 3: Low-velocity Groove / Hi-hat Ghost note
      this.actionTable.onGroove.forEach(fn => fn(beatIndex, intensity, audioState));
    }
  }
}

// ------------------------------------------------------------
// ACTION SEQUENCE SETUP:
// ------------------------------------------------------------
const choreographer = new BeatIntensityChoreographer();

// Action 1: Heavy Drop Action (Intensity >= 0.82)
choreographer.onDrop((beat, intensity) => {
  console.log(\`💥 [HEAVY DROP] Intensity: \${intensity} - Triggering Explosion!\`);
  // Actions: Screen shake, invert contrast, spawn 80 particles, switch scene image
  document.body.classList.add('shake-and-invert');
  setTimeout(() => document.body.classList.remove('shake-and-invert'), 100);
});

// Action 2: Mid Accent Action (Intensity 0.55 - 0.81)
choreographer.onAccent((beat, intensity) => {
  console.log(\`✨ [ACCENT] Intensity: \${intensity} - Snare pop & color cycle\`);
  // Actions: Rotate 3D shape by 45 deg, pulse border neon
});

// Action 3: Subtle Groove Action (Intensity < 0.55)
choreographer.onGroove((beat, intensity) => {
  // Actions: Modulate breathing scale and soft particle drift
});

// Action 4: Every 4 Beats Bar Action
choreographer.onBarStart((beat) => {
  console.log(\`🎬 [BAR \${beat / 4 + 1}] Switching background picture scene!\`);
});
`;
}

/**
 * 3. Generate Timeline Cue Track code containing the analyzed beat timestamps.
 */
export function generateTimelineCueCode(report: AudioAnalysisReport): string {
  const cues = report.beats.slice(0, 32).map((b) => ({
    time: b.time,
    intensity: b.intensity,
    type: b.label,
  }));

  return `// ============================================================
// TIMELINE CUE DISPATCHER (${report.fileName})
// Synchronized to ${report.bpm} BPM across ${report.duration}s
// Total Cues: ${report.totalBeatsDetected} | Drops: ${report.dropCount}
// ============================================================

// Sample of extracted beat cues (Time in seconds, Intensity 0-1)
const BEAT_TIMELINE_CUES = ${JSON.stringify(cues, null, 2)};

class TimelineCueRunner {
  constructor(cues = BEAT_TIMELINE_CUES) {
    this.cues = cues;
    this.currentIndex = 0;
  }

  // Call this inside your requestAnimationFrame / audio tick loop
  update(currentAudioTime) {
    while (
      this.currentIndex < this.cues.length &&
      this.cues[this.currentIndex].time <= currentAudioTime
    ) {
      const cue = this.cues[this.currentIndex];
      this.triggerCue(cue);
      this.currentIndex++;
    }
  }

  triggerCue(cue) {
    console.log(\`[CUE @ \${cue.time}s] Type: \${cue.type.toUpperCase()} | Intensity: \${cue.intensity}\`);
    if (cue.type === 'drop') {
      // Execute drop choreo
    } else if (cue.type === 'downbeat') {
      // Execute camera switch
    }
  }

  reset() {
    this.currentIndex = 0;
  }
}
`;
}

/**
 * 4. Generate Beat-Synchronized Picture Deck Switcher Code
 */
export function generatePictureSwitcherCode(report: AudioAnalysisReport): string {
  const bpm = report.bpm;

  return `// ============================================================
// BEAT-SYNCHRONIZED PICTURE / SCENE SWITCHER
// Switches background pictures in lockstep with the musical beat (${bpm} BPM)
// ============================================================

function updateDOM(container, audioState, state) {
  if (!state.initialized) {
    state.initialized = true;
    state.imageIndex = 0;
    state.switchRule = 'every-beat'; // 'every-beat' | 'every-2-beats' | 'every-4-beats' | 'drop-only'

    // Curated high-resolution picture deck
    state.images = [
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    ];

    container.innerHTML = \`
      <div id="vj-deck" style="position:relative; width:100%; height:100%; overflow:hidden; background:#000;">
        <div id="bg-img" style="
          position:absolute; inset:0; background-size:cover; background-position:center;
          background-image:url('\${state.images[0]}');
          transition: transform 0.08s ease-out, filter 0.08s ease-out;
        "></div>
        <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%); pointer-events:none;"></div>

        <!-- HUD Overlay -->
        <div style="position:absolute; bottom:24px; left:24px; color:#fff; font-family:monospace; z-index:10;">
          <div style="font-size:1.8rem; font-weight:800; text-shadow:0 2px 10px rgba(0,0,0,0.8);">
            SCENE #<span id="scene-num">1</span>
          </div>
          <div style="font-size:0.9rem; opacity:0.8; margin-top:4px;">
            SWITCH: EVERY BEAT · ${bpm} BPM
          </div>
        </div>
      </div>
    \`;
  }

  const bg = container.querySelector('#bg-img');
  const sceneNum = container.querySelector('#scene-num');

  // Trigger picture switch on beat!
  if (bg && audioState.isBeat) {
    state.imageIndex = (state.imageIndex + 1) % state.images.length;
    bg.style.backgroundImage = 'url(' + state.images[state.imageIndex] + ')';
    if (sceneNum) sceneNum.innerText = (state.imageIndex + 1);

    // Punch zoom & chromatic glitch on switch
    bg.style.transform = 'scale(1.06) rotate(' + (Math.random() * 2 - 1) + 'deg)';
    bg.style.filter = 'brightness(1.4) contrast(1.2)';
    setTimeout(() => {
      if (bg) {
        bg.style.transform = 'scale(1.0) rotate(0deg)';
        bg.style.filter = 'brightness(1.0) contrast(1.0)';
      }
    }, 60);
  }
}
`;
}
