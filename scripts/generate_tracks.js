// Node.js script to generate crystal-clear, loud, punchy 16-bit 44.1kHz stereo WAV audio tracks
const fs = require('fs');
const path = require('path');

const sampleRate = 44100;

function createWavBuffer(leftChannel, rightChannel) {
  const numSamples = leftChannel.length;
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const totalSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(totalSize, 4);
  buffer.write('WAVE', 8);

  // fmt Subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data Subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Clamp to -1.0 to 1.0 with soft limiter
    let l = Math.tanh(leftChannel[i]);
    let r = Math.tanh(rightChannel[i]);

    let intL = Math.max(-32768, Math.min(32767, Math.floor(l * 32767)));
    let intR = Math.max(-32768, Math.min(32767, Math.floor(r * 32767)));

    buffer.writeInt16LE(intL, offset);
    buffer.writeInt16LE(intR, offset + 2);
    offset += 4;
  }

  return buffer;
}

function synthesizeTrack(bpm, numBars, style) {
  const beatsPerBar = 4;
  const totalBeats = numBars * beatsPerBar;
  const durationSeconds = (totalBeats * 60) / bpm;
  const totalSamples = Math.floor(durationSeconds * sampleRate);

  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const secondsPerBeat = 60 / bpm;
  const secondsPer16th = secondsPerBeat / 4;
  const total16ths = totalBeats * 4;

  for (let step = 0; step < total16ths; step++) {
    const stepTime = step * secondsPer16th;
    const startSample = Math.floor(stepTime * sampleRate);

    let isKick = false;
    let isSnare = false;
    let isClosedHat = step % 2 === 0;
    let isOpenHat = step % 4 === 2;
    let bassFreq = 0;
    let chordNotes = [];

    if (style === 'synthwave') {
      // 4-on-the-floor
      isKick = step % 4 === 0;
      isSnare = step % 8 === 4;
      const notes = [55, 55, 65.4, 55, 58.27, 55, 61.74, 55]; // A1, C2, Bb1, B1
      bassFreq = notes[Math.floor(step / 2) % notes.length];
      if (step % 4 === 0) chordNotes = [220, 261.6, 329.6]; // Am
      if (step % 8 === 4) chordNotes = [261.6, 329.6, 392.0]; // C
    } else if (style === 'clubdrop') {
      isKick = step % 8 === 0 || step % 8 === 6;
      isSnare = step % 8 === 4;
      isOpenHat = step % 4 === 2;
      const notes = [43.65, 43.65, 49.0, 51.9, 41.2, 43.65, 58.27, 55.0];
      bassFreq = notes[Math.floor(step / 2) % notes.length];
      if (step % 4 === 0) chordNotes = [174.6, 220, 261.6];
    } else if (style === 'techhouse') {
      isKick = step % 4 === 0;
      isSnare = step % 8 === 4;
      isOpenHat = step % 4 === 2; // Open hat on every offbeat
      const notes = [48.99, 48.99, 55.0, 48.99, 58.27, 55.0, 48.99, 61.74];
      bassFreq = notes[Math.floor(step / 2) % notes.length];
      if (step % 4 === 2) chordNotes = [329.6, 392.0, 493.88];
    } else if (style === 'breakbeat') {
      isKick = step % 16 === 0 || step % 16 === 6 || step % 16 === 10 || step % 16 === 13;
      isSnare = step % 16 === 4 || step % 16 === 12;
      isClosedHat = step % 2 === 0;
      bassFreq = step % 4 === 0 ? 55.0 : 65.4;
      if (step % 8 === 0) chordNotes = [220, 277.18, 329.6];
    } else if (style === 'lofi') {
      isKick = step % 16 === 0 || step % 16 === 7 || step % 16 === 10;
      isSnare = step % 16 === 4 || step % 16 === 12;
      isOpenHat = step % 8 === 6;
      const notes = [58.27, 58.27, 65.4, 61.74];
      bassFreq = notes[Math.floor(step / 4) % notes.length];
      if (step % 8 === 0) chordNotes = [233.08, 277.18, 349.23];
    }

    // 1. Kick Drum (Punchy sub-bass drop)
    if (isKick) {
      const kickDur = 0.28;
      const kickSamples = Math.min(totalSamples - startSample, Math.floor(kickDur * sampleRate));
      for (let i = 0; i < kickSamples; i++) {
        const t = i / sampleRate;
        const progress = t / kickDur;
        // Frequency drop from 160Hz to 40Hz
        const f = 40 + (160 - 40) * Math.exp(-progress * 14);
        const env = Math.exp(-progress * 6.5);
        const sample = Math.sin(2 * Math.PI * f * t) * env * 0.85;
        const idx = startSample + i;
        if (idx < totalSamples) {
          left[idx] += sample;
          right[idx] += sample;
        }
      }
    }

    // 2. Snare / Clap (White noise + body)
    if (isSnare) {
      const snareDur = 0.18;
      const snareSamples = Math.min(totalSamples - startSample, Math.floor(snareDur * sampleRate));
      for (let i = 0; i < snareSamples; i++) {
        const t = i / sampleRate;
        const progress = t / snareDur;
        const noise = (Math.random() * 2 - 1) * Math.exp(-progress * 9);
        const body = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-progress * 14) * 0.4;
        const sample = (noise * 0.65 + body) * 0.7;
        const idx = startSample + i;
        if (idx < totalSamples) {
          left[idx] += sample * 0.95;
          right[idx] += sample * 0.95;
        }
      }
    }

    // 3. Hi-Hats (Crisp metallic shimmers)
    if (isOpenHat || isClosedHat) {
      const hatDur = isOpenHat ? 0.16 : 0.05;
      const hatSamples = Math.min(totalSamples - startSample, Math.floor(hatDur * sampleRate));
      const vol = isOpenHat ? 0.35 : 0.2;
      for (let i = 0; i < hatSamples; i++) {
        const progress = i / (hatDur * sampleRate);
        const noise = Math.random() * 2 - 1;
        // highpass shimmer
        const sample = noise * Math.exp(-progress * (isOpenHat ? 7 : 18)) * vol;
        const idx = startSample + i;
        if (idx < totalSamples) {
          left[idx] += sample * 0.85;
          right[idx] += sample * 1.0; // slight stereo spread
        }
      }
    }

    // 4. Bassline (Deep analog punch)
    if (bassFreq > 0) {
      const bassDur = secondsPer16th * 1.8;
      const bassSamples = Math.min(totalSamples - startSample, Math.floor(bassDur * sampleRate));
      for (let i = 0; i < bassSamples; i++) {
        const t = i / sampleRate;
        const progress = t / bassDur;
        const env = Math.exp(-progress * 3.5);
        // Sawtooth wave approximation with 4 harmonics
        let wave = 0;
        for (let h = 1; h <= 4; h++) {
          wave += (Math.sin(2 * Math.PI * bassFreq * h * t) / h) * (1 / h);
        }
        const sample = wave * env * 0.55;
        const idx = startSample + i;
        if (idx < totalSamples) {
          left[idx] += sample;
          right[idx] += sample;
        }
      }
    }

    // 5. Synth Chords / Arp (Catchy melodic hook)
    if (chordNotes.length > 0) {
      const chordDur = secondsPerBeat * 0.9;
      const chordSamples = Math.min(totalSamples - startSample, Math.floor(chordDur * sampleRate));
      for (let i = 0; i < chordSamples; i++) {
        const t = i / sampleRate;
        const progress = t / chordDur;
        const env = Math.exp(-progress * 4.0);
        let chordSample = 0;
        chordNotes.forEach((freq, nIdx) => {
          chordSample += Math.sin(2 * Math.PI * freq * t) * (0.2 / chordNotes.length);
        });
        const sample = chordSample * env;
        const idx = startSample + i;
        if (idx < totalSamples) {
          left[idx] += sample * 0.9;
          right[idx] += sample * 0.9;
        }
      }
    }
  }

  return createWavBuffer(left, right);
}

const tracks = [
  { file: 'cyber-pulse.wav', bpm: 124, bars: 2, style: 'synthwave' },
  { file: 'club-drop.wav', bpm: 128, bars: 2, style: 'clubdrop' },
  { file: 'tech-house.wav', bpm: 126, bars: 2, style: 'techhouse' },
  { file: 'dnb-rush.wav', bpm: 165, bars: 4, style: 'breakbeat' },
  { file: 'lofi-chill.wav', bpm: 88, bars: 2, style: 'lofi' },
];

const outDir = path.join(__dirname, '..', 'public', 'tracks');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

tracks.forEach((t) => {
  const buf = synthesizeTrack(t.bpm, t.bars, t.style);
  const target = path.join(outDir, t.file);
  fs.writeFileSync(target, buf);
  console.log(`Generated: ${t.file} (${(buf.length / 1024).toFixed(1)} KB, ${t.bpm} BPM)`);
});
console.log('All audio tracks generated successfully!');
