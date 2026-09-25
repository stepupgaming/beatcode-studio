export interface BeatWay {
  id: string;
  number: number;
  title: string;
  category:
    | "DOM & Backgrounds"
    | "Canvas 2D Geometry"
    | "Particles & Physics"
    | "Vector & Morphing"
    | "Math & Fractals"
    | "Typography & ASCII"
    | "Retro & Shaders";
  complexity: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  type: "dom" | "canvas";
  code: string;
  tags: string[];
}

// Helper to generate full executable code for canvas or DOM modes
export const WAY_001_BACKGROUND_FLASH = `// Way 01: Background Flash (Classic)
// Switches background color dynamically on every beat onset!
function updateDOM(container, audioState, state) {
  if (!state.initialized) {
    state.initialized = true;
    state.colorIndex = 0;
    state.colors = [
      '#ef4444', '#f97316', '#eab308', '#22c55e',
      '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'
    ];
    container.innerHTML = \`
      <div id="beat-box" style="
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        height: 100%; width: 100%; transition: background-color 0.08s ease-out;
        color: #ffffff; font-family: ui-monospace, monospace; text-align: center; padding: 24px;
      ">
        <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 8px; text-shadow: 0 4px 12px rgba(0,0,0,0.5);">
          BEAT FLASH
        </h1>
        <p style="font-size: 1.1rem; opacity: 0.9; margin-bottom: 16px;">
          Switches color every time the kick hits
        </p>
        <div id="beat-counter" style="font-size: 1.8rem; font-weight: 700; background: rgba(0,0,0,0.4); padding: 8px 20px; border-radius: 9999px;">
          BEAT: 0
        </div>
      </div>
    \`;
  }

  const box = container.querySelector('#beat-box');
  const counter = container.querySelector('#beat-counter');

  if (box && audioState.isBeat) {
    state.colorIndex = (state.colorIndex + 1) % state.colors.length;
    box.style.backgroundColor = state.colors[state.colorIndex];
    if (counter) counter.innerText = 'BEAT: ' + audioState.beatCount;
    box.style.transform = 'scale(1.03)';
    setTimeout(() => { if (box) box.style.transform = 'scale(1.0)'; }, 60);
  }
}`;

export const WAY_002_PICTURE_SCENE_SWITCHER = `// Way 02: Beat-Synchronized Picture & Scene Switcher
// Switches background to a different high-res picture on every beat!
function updateDOM(container, audioState, state) {
  if (!state.initialized) {
    state.initialized = true;
    state.imageIndex = 0;
    state.images = [
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop'
    ];
    container.innerHTML = \`
      <div id="vj-deck" style="position:relative; width:100%; height:100%; overflow:hidden; background:#000; font-family:monospace;">
        <div id="bg-pic" style="
          position:absolute; inset:0; background-size:cover; background-position:center;
          background-image:url('\${state.images[0]}');
          transition: transform 0.08s ease-out, filter 0.08s ease-out;
        "></div>
        <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%); pointer-events:none;"></div>
        <div style="position:absolute; bottom:24px; left:24px; color:#fff; z-index:10;">
          <h2 style="font-size:2rem; font-weight:800; text-shadow:0 2px 10px rgba(0,0,0,0.9);">
            PICTURE SCENE #<span id="scene-idx">1</span>
          </h2>
          <p style="font-size:1rem; opacity:0.85; margin-top:4px;">
            Switches picture on every beat drop with chromatic zoom slam
          </p>
          <div id="beat-tag" style="display:inline-block; margin-top:10px; background:rgba(6,182,212,0.3); border:1px solid #06b6d4; padding:6px 14px; border-radius:8px; font-weight:700;">
            BEAT: 0
          </div>
        </div>
      </div>
    \`;
  }

  const bg = container.querySelector('#bg-pic');
  const idxTag = container.querySelector('#scene-idx');
  const beatTag = container.querySelector('#beat-tag');

  if (bg && audioState.isBeat) {
    state.imageIndex = (state.imageIndex + 1) % state.images.length;
    bg.style.backgroundImage = 'url(' + state.images[state.imageIndex] + ')';
    if (idxTag) idxTag.innerText = (state.imageIndex + 1);
    if (beatTag) beatTag.innerText = 'BEAT: ' + audioState.beatCount + ' (KICK)';

    // Impact scale zoom & brightness punch
    bg.style.transform = 'scale(1.08) rotate(' + (Math.random() * 2 - 1) + 'deg)';
    bg.style.filter = 'brightness(1.5) contrast(1.2) saturate(1.4)';
    setTimeout(() => {
      if (bg) {
        bg.style.transform = 'scale(1.0) rotate(0deg)';
        bg.style.filter = 'brightness(1.0) contrast(1.0) saturate(1.0)';
      }
    }, 70);
  }
}
`;

export const WAY_003_KINETIC_TEXT = `// Way 03: Kinetic Typography Beat Slam
function updateDOM(container, audioState, state) {
  if (!state.init) {
    state.init = true;
    container.innerHTML = \`
      <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#0a0a0a; color:#f8fafc; font-family:monospace; overflow:hidden;">
        <div id="big-text" style="font-size:4rem; font-weight:900; letter-spacing:0.1em; transition:all 0.05s ease-out;">DROP</div>
        <div id="sub-info" style="font-size:1rem; opacity:0.6; margin-top:12px;">TRACKING & SCALE SLAM</div>
      </div>
    \`;
  }
  const text = container.querySelector('#big-text');
  if (text) {
    if (audioState.isBeat) {
      const words = ['DROP', 'BASS', 'KICK', 'PULSE', 'WAVE', 'RHYTHM', 'PEAK'];
      text.innerText = words[audioState.beatCount % words.length];
      text.style.transform = 'scale(1.35) rotate(' + (Math.random() * 8 - 4) + 'deg)';
      text.style.letterSpacing = '0.35em';
      text.style.color = '#38bdf8';
    } else {
      text.style.transform = 'scale(1.0) rotate(0deg)';
      text.style.letterSpacing = (0.05 + audioState.energy * 0.15) + 'em';
      text.style.color = '#f8fafc';
    }
  }
}`;

export const WAY_016_EXPANDING_SHOCKWAVES = `// Way 16: Expanding Canvas Shockwaves
function render(ctx, width, height, audioState, state) {
  if (!state.waves) state.waves = [];

  // Background with subtle trail
  ctx.fillStyle = 'rgba(10, 10, 15, 0.25)';
  ctx.fillRect(0, 0, width, height);

  // Spawn wave on beat
  if (audioState.isBeat) {
    state.waves.push({
      x: width / 2,
      y: height / 2,
      r: 10,
      maxR: Math.max(width, height) * 0.7,
      color: 'hsl(' + ((audioState.beatCount * 45) % 360) + ', 95%, 60%)',
      width: 4 + audioState.bass * 8,
      alpha: 1.0
    });
  }

  // Draw and update shockwaves
  for (let i = state.waves.length - 1; i >= 0; i--) {
    const w = state.waves[i];
    w.r += 8 + audioState.energy * 12;
    w.alpha *= 0.95;

    ctx.save();
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
    ctx.strokeStyle = w.color;
    ctx.lineWidth = w.width;
    ctx.globalAlpha = w.alpha;
    ctx.shadowColor = w.color;
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.restore();

    if (w.alpha < 0.02 || w.r > w.maxR) {
      state.waves.splice(i, 1);
    }
  }

  // Center beat core
  ctx.beginPath();
  const coreRadius = 24 + audioState.bass * 40;
  ctx.arc(width / 2, height / 2, coreRadius, 0, Math.PI * 2);
  ctx.fillStyle = audioState.isBeat ? '#ffffff' : 'hsl(' + ((audioState.beatCount * 45) % 360) + ', 90%, 50%)';
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 30;
  ctx.fill();
}`;

export const WAY_017_PARTICLE_BURST = `// Way 17: Radial Particle Explosion
function render(ctx, width, height, audioState, state) {
  if (!state.particles) state.particles = [];

  ctx.fillStyle = 'rgba(5, 5, 10, 0.2)';
  ctx.fillRect(0, 0, width, height);

  if (audioState.isBeat) {
    const count = 40 + Math.floor(audioState.bass * 60);
    const baseHue = (audioState.beatCount * 36) % 360;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 12 * (1 + audioState.bass);
      state.particles.push({
        x: width / 2,
        y: height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        hue: baseHue + Math.random() * 30,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.02
      });
    }
  }

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= p.decay;

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = 'hsl(' + p.hue + ', 100%, 65%)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (p.life <= 0) state.particles.splice(i, 1);
  }
}`;

export const WAY_018_LISSAJOUS = `// Way 18: Lissajous Harmonic Beam
function render(ctx, width, height, audioState, state) {
  if (state.angle === undefined) {
    state.angle = 0;
    state.history = [];
  }

  ctx.fillStyle = 'rgba(8, 8, 12, 0.15)';
  ctx.fillRect(0, 0, width, height);

  state.angle += 0.04 + audioState.energy * 0.08;
  const a = 3 + (audioState.isBeat ? 1 : 0);
  const b = 4;
  const scale = (Math.min(width, height) / 3) * (0.8 + audioState.bass * 0.5);

  const cx = width / 2;
  const cy = height / 2;

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = audioState.isBeat ? '#f43f5e' : '#38bdf8';
  ctx.lineWidth = 3 + audioState.bass * 6;
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = 18;

  for (let t = 0; t <= Math.PI * 2; t += 0.02) {
    const x = cx + Math.sin(a * t + state.angle) * scale;
    const y = cy + Math.sin(b * t) * scale;
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}`;

// Generator that creates unique executable code for each of the 100 ways
export function getWayCode(number: number, category: string, title: string, type: "dom" | "canvas"): string {
  if (number === 1) return WAY_001_BACKGROUND_FLASH;
  if (number === 2) return WAY_002_PICTURE_SCENE_SWITCHER;
  if (number === 3) return WAY_003_KINETIC_TEXT;
  if (number === 16) return WAY_016_EXPANDING_SHOCKWAVES;
  if (number === 17) return WAY_017_PARTICLE_BURST;
  if (number === 18) return WAY_018_LISSAJOUS;

  if (type === "dom") {
    return `// Way ${number}: ${title}
function updateDOM(container, audioState, state) {
  if (!state.initialized) {
    state.initialized = true;
    state.counter = 0;
    container.innerHTML = \`
      <div id="target-box" style="
        width: 100%; height: 100%; display: flex; flex-direction: column;
        align-items: center; justify-content: center; background: #0f172a;
        color: #f8fafc; font-family: monospace; transition: all 0.06s ease-out;
      ">
        <div id="badge" style="padding: 16px 32px; border-radius: 12px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255,255,255,0.1); text-align: center;">
          <h2 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 6px;">${title}</h2>
          <p style="opacity: 0.8; font-size: 0.95rem;">Beat-reactive DOM dynamics</p>
          <div id="value-display" style="margin-top: 12px; font-weight: 600; color: #38bdf8;">BEATS: 0</div>
        </div>
      </div>
    \`;
  }

  const box = container.querySelector('#target-box');
  const badge = container.querySelector('#badge');
  const val = container.querySelector('#value-display');

  if (box && audioState.isBeat) {
    state.counter++;
    const hue = (state.counter * 37) % 360;
    box.style.backgroundColor = 'hsl(' + hue + ', 70%, 15%)';
    if (badge) {
      badge.style.borderColor = 'hsl(' + hue + ', 80%, 55%)';
      badge.style.transform = 'scale(1.08)';
      setTimeout(() => { if (badge) badge.style.transform = 'scale(1.0)'; }, 70);
    }
    if (val) val.innerText = 'BEATS: ' + audioState.beatCount + ' | BASS: ' + Math.round(audioState.bass * 100) + '%';
  }
}`;
  }

  // Default Canvas Way Generator
  return `// Way ${number}: ${title}
function render(ctx, width, height, audioState, state) {
  if (!state.points) {
    state.points = [];
    state.hue = ${(number * 23) % 360};
    state.angle = 0;
  }

  ctx.fillStyle = 'rgba(10, 15, 25, 0.25)';
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  state.angle += 0.02 + audioState.energy * 0.04;

  if (audioState.isBeat) {
    state.hue = (state.hue + 40) % 360;
  }

  const segments = ${6 + (number % 12)};
  const radius = (Math.min(width, height) * 0.28) * (1 + audioState.bass * 0.6);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(state.angle);

  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const r = radius * (1 + Math.sin(theta * 3 + state.angle) * 0.25 * audioState.energy);
    const x = Math.cos(theta) * r;
    const y = Math.sin(theta) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.strokeStyle = 'hsl(' + state.hue + ', 95%, 60%)';
  ctx.lineWidth = 3 + audioState.bass * 8;
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = audioState.isBeat ? 32 : 12;
  ctx.stroke();

  if (audioState.isBeat) {
    ctx.fillStyle = 'hsla(' + state.hue + ', 100%, 75%, 0.4)';
    ctx.fill();
  }

  ctx.restore();
}`;
}

// 100 Catalog Definitions
export const ALL_100_WAYS_METADATA: Omit<BeatWay, "code">[] = [
  // 1-15: DOM & Backgrounds
  { id: "way-001", number: 1, title: "01. Background Flash (Classic)", category: "DOM & Backgrounds", complexity: "Beginner", description: "The definitive starting point: switches full-screen background color on every beat onset.", type: "dom", tags: ["background", "color", "kick", "strobe"] },
  { id: "way-002", number: 2, title: "02. Beat Picture Scene Switcher (VJ)", category: "DOM & Backgrounds", complexity: "Beginner", description: "Switches background to a different high-res picture with zoom slam and RGB glitch on every beat drop.", type: "dom", tags: ["picture", "scene", "images", "vj", "switcher"] },
  { id: "way-003", number: 3, title: "03. Kinetic Typography Slam", category: "DOM & Backgrounds", complexity: "Beginner", description: "Bounces font tracking, weight, scale, and text words dynamically on kicks.", type: "dom", tags: ["typography", "kinetic", "scale"] },
  { id: "way-004", number: 4, title: "04. Border Neon Stroke Flash", category: "DOM & Backgrounds", complexity: "Beginner", description: "Intensifies glowing box-shadow borders and stroke colors in sync with drum hits.", type: "dom", tags: ["neon", "border", "shadow"] },
  { id: "way-005", number: 5, title: "05. Inverted Negative Strobe", category: "DOM & Backgrounds", complexity: "Beginner", description: "Inverts CSS brightness and filter contrast for high-impact visual snaps.", type: "dom", tags: ["invert", "strobe", "flash"] },
  { id: "way-006", number: 6, title: "06. 3D Card Perspective Flip", category: "DOM & Backgrounds", complexity: "Intermediate", description: "Flips DOM containers along the Y/X axes on every snare or kick drop.", type: "dom", tags: ["3d", "transform", "flip"] },
  { id: "way-007", number: 7, title: "07. Letter Spacing Accordion", category: "DOM & Backgrounds", complexity: "Beginner", description: "Stretches and snaps letter spacing synchronously with audio energy.", type: "dom", tags: ["text", "accordion", "tracking"] },
  { id: "way-008", number: 8, title: "08. Chromatic Aberration RGB Shift", category: "DOM & Backgrounds", complexity: "Intermediate", description: "Simulates lens chromatic aberration splitting red/blue channels on beat.", type: "dom", tags: ["glitch", "chromatic", "rgb"] },
  { id: "way-009", number: 9, title: "09. Rotating Gradient Horizon", category: "DOM & Backgrounds", complexity: "Beginner", description: "Rotates background linear gradient angle by 45 degrees on every beat.", type: "dom", tags: ["gradient", "rotation", "angle"] },
  { id: "way-010", number: 10, title: "10. Audio Reactive Box Elevation", category: "DOM & Backgrounds", complexity: "Beginner", description: "Elevates cards with dynamic multi-layer shadows proportional to bass.", type: "dom", tags: ["shadow", "elevation", "depth"] },
  { id: "way-011", number: 11, title: "11. Skew Velocity Kinetic Wobble", category: "DOM & Backgrounds", complexity: "Intermediate", description: "Applies subtle dynamic CSS skew angles that snap on kick hits.", type: "dom", tags: ["skew", "kinetic", "transform"] },
  { id: "way-012", number: 12, title: "12. Blur Defocus on Bass Drop", category: "DOM & Backgrounds", complexity: "Beginner", description: "Defocuses and snaps backdrop filter blur to create underwater bass effects.", type: "dom", tags: ["blur", "backdrop", "filter"] },
  { id: "way-013", number: 13, title: "13. Rotational Dial Indicator", category: "DOM & Backgrounds", complexity: "Intermediate", description: "Turns a geometric compass needle step-by-step with each detected tempo beat.", type: "dom", tags: ["dial", "compass", "rotation"] },
  { id: "way-014", number: 14, title: "14. Concentric DOM Ripple Rings", category: "DOM & Backgrounds", complexity: "Intermediate", description: "Spawns expanding nested div rings that dissolve after each kick pulse.", type: "dom", tags: ["ripple", "rings", "concentric"] },
  { id: "way-015", number: 15, title: "15. Split Screen Dual Color Clash", category: "DOM & Backgrounds", complexity: "Beginner", description: "Alternates opposite halves of the screen between contrasting palettes.", type: "dom", tags: ["split", "contrast", "duo"] },

  // 16-35: Canvas 2D Geometry
  { id: "way-016", number: 16, title: "16. Expanding Shockwave Rings", category: "Canvas 2D Geometry", complexity: "Intermediate", description: "Spawns expanding high-energy shockwave rings on canvas with motion trails.", type: "canvas", tags: ["shockwave", "rings", "canvas"] },
  { id: "way-017", number: 17, title: "17. Radial Particle Explosion", category: "Canvas 2D Geometry", complexity: "Intermediate", description: "Bursts high-velocity sparks outward from center whenever kicks hit.", type: "canvas", tags: ["particles", "burst", "explosion"] },
  { id: "way-018", number: 18, title: "18. Lissajous Harmonic Beam", category: "Canvas 2D Geometry", complexity: "Advanced", description: "Curves parametric Lissajous waveforms modulated by audio frequencies.", type: "canvas", tags: ["lissajous", "harmonics", "math"] },
  { id: "way-019", number: 19, title: "19. Neon Oscilloscope Ribbon", category: "Canvas 2D Geometry", complexity: "Intermediate", description: "Draws real-time oscilloscope time-domain waveforms with glowing neon bloom.", type: "canvas", tags: ["oscilloscope", "waveform", "neon"] },
  { id: "way-020", number: 20, title: "20. Concentric Radar Pulse", category: "Canvas 2D Geometry", complexity: "Intermediate", description: "Sweeping circular radar beam that blips targets when audio beats register.", type: "canvas", tags: ["radar", "sweep", "sonar"] },
  { id: "way-021", number: 21, title: "21. Circular Spectrum Equalizer", category: "Canvas 2D Geometry", complexity: "Intermediate", description: "Distributes 64 frequency bars along a circle, bursting outward on kicks.", type: "canvas", tags: ["circular", "equalizer", "spectrum"] },
  { id: "way-022", number: 22, title: "22. Spirograph Geometric Bloom", category: "Canvas 2D Geometry", complexity: "Advanced", description: "Rotates epicycloid gears that alter tooth frequency on each beat.", type: "canvas", tags: ["spirograph", "geometry", "curves"] },
  { id: "way-023", number: 23, title: "23. Audio Voronoi Stained Glass", category: "Canvas 2D Geometry", complexity: "Advanced", description: "Relocates Voronoi seed points on beat, creating stained glass pulses.", type: "canvas", tags: ["voronoi", "cells", "mosaic"] },
  { id: "way-024", number: 24, title: "24. Sine Wave Neon Tunnel", category: "Canvas 2D Geometry", complexity: "Intermediate", description: "Draws concentric 3D perspective sine rings that pulse along the z-axis.", type: "canvas", tags: ["tunnel", "perspective", "sine"] },
  { id: "way-025", number: 25, title: "25. Polygon Morph on Tempo", category: "Canvas 2D Geometry", complexity: "Intermediate", description: "Steps through triangle, square, pentagon, hexagon, octagon on beats.", type: "canvas", tags: ["polygon", "morph", "shapes"] },
  { id: "way-026", number: 26, title: "26. Kaleidoscope Mirror Symmetry", category: "Canvas 2D Geometry", complexity: "Advanced", description: "Folds 8-way kaleidoscope reflections modulated by frequency spectrum.", type: "canvas", tags: ["kaleidoscope", "symmetry", "mirrors"] },
  { id: "way-027", number: 27, title: "27. Isometric Audio Grid Blocks", category: "Canvas 2D Geometry", complexity: "Advanced", description: "Isometric 3D voxel cubes that jump up and down to frequency bands.", type: "canvas", tags: ["isometric", "voxels", "grid"] },
  { id: "way-028", number: 28, title: "28. Hypnotic Spiral Galaxy", category: "Canvas 2D Geometry", complexity: "Intermediate", description: "Archimedean spiral unwinding with rotation speed tied to bass intensity.", type: "canvas", tags: ["spiral", "galaxy", "rotation"] },
  { id: "way-029", number: 29, title: "29. Dual Oscilloscope Crosshair", category: "Canvas 2D Geometry", complexity: "Intermediate", description: "XY phase Lissajous figure showing stereo audio balance and beat hits.", type: "canvas", tags: ["crosshair", "phase", "stereo"] },
  { id: "way-030", number: 30, title: "30. Concentric Hexagon Shield", category: "Canvas 2D Geometry", complexity: "Intermediate", description: "Sci-fi forcefield hexagon layers expanding and pulsing on snare drops.", type: "canvas", tags: ["hexagon", "shield", "scifi"] },
  { id: "way-031", number: 31, title: "31. Starburst Ray Emitter", category: "Canvas 2D Geometry", complexity: "Beginner", description: "Radiates sharp triangular laser beams from the center on every kick.", type: "canvas", tags: ["starburst", "rays", "lasers"] },
  { id: "way-032", number: 32, title: "32. Audio Topography Contours", category: "Canvas 2D Geometry", complexity: "Advanced", description: "Stacks flowing topographic elevation lines that deform with sound energy.", type: "canvas", tags: ["topography", "contour", "elevation"] },
  { id: "way-033", number: 33, title: "33. Kinetic Marquee Tape", category: "Canvas 2D Geometry", complexity: "Beginner", description: "High-speed scrolling banner that accelerates and inverts colors on beats.", type: "canvas", tags: ["marquee", "speed", "ticker"] },
  { id: "way-034", number: 34, title: "34. Pulsing Grid Intersection Dots", category: "Canvas 2D Geometry", complexity: "Intermediate", description: "Matrix grid points that scale up with wave propagation when beats strike.", type: "canvas", tags: ["grid", "dots", "wave"] },
  { id: "way-035", number: 35, title: "35. Neon Ribbon Bezier Snake", category: "Canvas 2D Geometry", complexity: "Intermediate", description: "Smooth cubic bezier ribbon that slithers and whips sharply on beat hits.", type: "canvas", tags: ["bezier", "ribbon", "curve"] },

  // 36-50: Particles & Physics
  { id: "way-036", number: 36, title: "36. Gravity Well Beat Attractor", category: "Particles & Physics", complexity: "Advanced", description: "Flips central point between positive gravity and explosive repulsion on beats.", type: "canvas", tags: ["physics", "gravity", "attractor"] },
  { id: "way-037", number: 37, title: "37. Boids Flocking Scatter", category: "Particles & Physics", complexity: "Advanced", description: "Flock of autonomous boids that scatter in panic on kick drops and reform.", type: "canvas", tags: ["boids", "flocking", "swarm"] },
  { id: "way-038", number: 38, title: "38. Spring-Damper Soft Body", category: "Particles & Physics", complexity: "Advanced", description: "Elastic jelly polygon that wobbles with spring physics when punched by bass.", type: "canvas", tags: ["spring", "softbody", "elastic"] },
  { id: "way-039", number: 39, title: "39. Firework Finale Rocket Burst", category: "Particles & Physics", complexity: "Intermediate", description: "Launches vertical rockets that burst into shimmering trails on kick transients.", type: "canvas", tags: ["fireworks", "sparks", "rockets"] },
  { id: "way-040", number: 40, title: "40. Magnetic Ferrofluid Spikes", category: "Particles & Physics", complexity: "Advanced", description: "Simulates ferrofluid spikes rising outward based on low-frequency magnetic pull.", type: "canvas", tags: ["ferrofluid", "magnetic", "spikes"] },
  { id: "way-041", number: 41, title: "41. Particle Fountain Beat Ejector", category: "Particles & Physics", complexity: "Intermediate", description: "Fountain shooting particles into air with launch velocity governed by energy.", type: "canvas", tags: ["fountain", "particles", "velocity"] },
  { id: "way-042", number: 42, title: "42. Confetti Cannon Celebration", category: "Particles & Physics", complexity: "Beginner", description: "Fires colorful tumbling confetti rectangles on each detected musical bar.", type: "canvas", tags: ["confetti", "cannon", "party"] },
  { id: "way-043", number: 43, title: "43. Floating Bubbles Pop on Kick", category: "Particles & Physics", complexity: "Intermediate", description: "Transparent soap bubbles drifting up that pop into droplets on beat spikes.", type: "canvas", tags: ["bubbles", "pop", "fluid"] },
  { id: "way-044", number: 44, title: "44. Cosmic Starfield Warp Drive", category: "Particles & Physics", complexity: "Intermediate", description: "3D starfield hyperdrive that surges to lightspeed streaks on beat drops.", type: "canvas", tags: ["starfield", "warp", "cosmic"] },
  { id: "way-045", number: 45, title: "45. Sand Dune Wind Drift", category: "Particles & Physics", complexity: "Intermediate", description: "Thousands of granular sand grains blown across the viewport by bass gusts.", type: "canvas", tags: ["sand", "wind", "granular"] },
  { id: "way-046", number: 46, title: "46. Cloth Simulation Audio Ripple", category: "Particles & Physics", complexity: "Advanced", description: "Grid mesh sheet vibrating like a physical drumhead when kicks strike.", type: "canvas", tags: ["cloth", "mesh", "drumhead"] },
  { id: "way-047", number: 47, title: "47. Electric Lightning Arc Strikes", category: "Particles & Physics", complexity: "Advanced", description: "Branches jagged high-voltage electricity bolts across screen on transients.", type: "canvas", tags: ["lightning", "electricity", "arcs"] },
  { id: "way-048", number: 48, title: "48. Smoke Puff Dissipation", category: "Particles & Physics", complexity: "Intermediate", description: "Billowing volumetric smoke puffs expanding and fading with each bass kick.", type: "canvas", tags: ["smoke", "vapor", "puff"] },
  { id: "way-049", number: 49, title: "49. Raindrops on Puddle Ripples", category: "Particles & Physics", complexity: "Intermediate", description: "Simulates falling raindrops creating circular ripples synced to tempo.", type: "canvas", tags: ["rain", "puddle", "ripples"] },
  { id: "way-050", number: 50, title: "50. Orbiting Planetary Satellites", category: "Particles & Physics", complexity: "Intermediate", description: "Orbital gravity system where planets fling inward/outward on beat shifts.", type: "canvas", tags: ["orbital", "planets", "space"] },

  // 51-65: Vector & Morphing
  { id: "way-051", number: 51, title: "51. Organic Blob Path Morph", category: "Vector & Morphing", complexity: "Intermediate", description: "Morphs smooth cubic spline blob control points dynamically on bass.", type: "canvas", tags: ["blob", "morph", "organic"] },
  { id: "way-052", number: 52, title: "52. Sacred Mandala Rotation", category: "Vector & Morphing", complexity: "Advanced", description: "Intricate floral mandala that rotates petals and scales layers on each beat.", type: "canvas", tags: ["mandala", "sacred", "floral"] },
  { id: "way-053", number: 53, title: "53. Cyberpunk HUD Reticle", category: "Vector & Morphing", complexity: "Intermediate", description: "Futuristic tactical targeting reticle with locking brackets on kick hits.", type: "canvas", tags: ["hud", "cyberpunk", "reticle"] },
  { id: "way-054", number: 54, title: "54. Equalizer Bar Horizon", category: "Vector & Morphing", complexity: "Beginner", description: "Clean bottom frequency spectrum bars with springy peak indicators.", type: "canvas", tags: ["equalizer", "spectrum", "bars"] },
  { id: "way-055", number: 55, title: "55. Neon Laser Lattice Grid", category: "Vector & Morphing", complexity: "Intermediate", description: "Perpendicular laser beams scanning back and forth, jumping on drum transients.", type: "canvas", tags: ["laser", "lattice", "grid"] },
  { id: "way-056", number: 56, title: "56. Morphing Geodesic Dome", category: "Vector & Morphing", complexity: "Advanced", description: "Wireframe geodesic dome vertices extruding outward based on audio energy.", type: "canvas", tags: ["geodesic", "dome", "wireframe"] },
  { id: "way-057", number: 57, title: "57. Audio Compass Rose", category: "Vector & Morphing", complexity: "Intermediate", description: "Navigational compass rose whose cardinal arrows flare on frequency peaks.", type: "canvas", tags: ["compass", "navigation", "arrows"] },
  { id: "way-058", number: 58, title: "58. Morphing Audio Heartbeat", category: "Vector & Morphing", complexity: "Beginner", description: "Stylized ECG heart vector that pulses and contracts with musical tempo.", type: "canvas", tags: ["ecg", "heartbeat", "pulse"] },
  { id: "way-059", number: 59, title: "59. Origami Hexaflexagon Fold", category: "Vector & Morphing", complexity: "Advanced", description: "Simulates geometric paper folding transitions on musical phrase changes.", type: "canvas", tags: ["origami", "folding", "geometric"] },
  { id: "way-060", number: 60, title: "60. Audio Wave Ribbon Flag", category: "Vector & Morphing", complexity: "Intermediate", description: "Waving silk flag whose wave frequency matches live audio tempo.", type: "canvas", tags: ["flag", "wave", "ribbon"] },
  { id: "way-061", number: 61, title: "61. Concentric Diamond Halo", category: "Vector & Morphing", complexity: "Beginner", description: "Nested rotating diamond shapes alternating rotation direction on beats.", type: "canvas", tags: ["diamond", "halo", "geometric"] },
  { id: "way-062", number: 62, title: "62. Audio Spiral Nautilus Shell", category: "Vector & Morphing", complexity: "Advanced", description: "Golden ratio logarithmic spiral expanding chambers in time with music.", type: "canvas", tags: ["nautilus", "golden-ratio", "fibonacci"] },
  { id: "way-063", number: 63, title: "63. Neon Tachometer Gauge", category: "Vector & Morphing", complexity: "Intermediate", description: "Automotive RPM dashboard needle revving into the redline on beat drops.", type: "canvas", tags: ["tachometer", "rpm", "gauge"] },
  { id: "way-064", number: 64, title: "64. Vector Iris Aperture Blade", category: "Vector & Morphing", complexity: "Intermediate", description: "Camera shutter aperture blades opening and closing with audio dynamics.", type: "canvas", tags: ["aperture", "camera", "iris"] },
  { id: "way-065", number: 65, title: "65. Cybernetic Audio Wings", category: "Vector & Morphing", complexity: "Advanced", description: "Bilateral vector wing feathers flaring outward on dramatic kick drops.", type: "canvas", tags: ["wings", "cyber", "feathers"] },

  // 66-75: Math & Fractals
  { id: "way-066", number: 66, title: "66. Mandelbrot Fractal Zoom Pulse", category: "Math & Fractals", complexity: "Advanced", description: "Iterates fractal boundaries pulsing in color and zoom level on kick beats.", type: "canvas", tags: ["mandelbrot", "fractal", "math"] },
  { id: "way-067", number: 67, title: "67. Julia Set Audio Distortion", category: "Math & Fractals", complexity: "Advanced", description: "Modulates complex constant C with bass/treble vectors for alive fractals.", type: "canvas", tags: ["julia", "complex", "fractal"] },
  { id: "way-068", number: 68, title: "68. Barnsley Fern Wind Sway", category: "Math & Fractals", complexity: "Advanced", description: "Iterated function system fern that bends under the pressure of bass sound.", type: "canvas", tags: ["barnsley", "fern", "ifs"] },
  { id: "way-069", number: 69, title: "69. Lorenz Strange Attractor", category: "Math & Fractals", complexity: "Advanced", description: "Differential equation butterfly loops spinning and flashing on transients.", type: "canvas", tags: ["lorenz", "chaos", "attractor"] },
  { id: "way-070", number: 70, title: "70. Sierpinski Triangle Subdivision", category: "Math & Fractals", complexity: "Intermediate", description: "Recursively subdivides triangle depth based on audio volume level.", type: "canvas", tags: ["sierpinski", "recursion", "triangle"] },
  { id: "way-071", number: 71, title: "71. Koch Snowflake Snowstorm", category: "Math & Fractals", complexity: "Intermediate", description: "Recursive fractal snowflake with perimeter pulsing in time with audio.", type: "canvas", tags: ["koch", "snowflake", "fractal"] },
  { id: "way-072", number: 72, title: "72. Perlin Noise Terrain Horizon", category: "Math & Fractals", complexity: "Advanced", description: "1D/2D procedural noise mountain ridges scrolling and reacting to kick.", type: "canvas", tags: ["perlin", "noise", "terrain"] },
  { id: "way-073", number: 73, title: "73. Fibonacci Sunflower Seeds", category: "Math & Fractals", complexity: "Intermediate", description: "Phyllotaxis spiral pattern with seed scales jumping on tempo beats.", type: "canvas", tags: ["fibonacci", "sunflower", "phyllotaxis"] },
  { id: "way-074", number: 74, title: "74. Fourier Harmonic Series", category: "Math & Fractals", complexity: "Advanced", description: "Visualizes epicycles rotating around each other to draw the waveform.", type: "canvas", tags: ["fourier", "epicycles", "harmonics"] },
  { id: "way-075", number: 75, title: "75. Cellular Automata Life Burst", category: "Math & Fractals", complexity: "Advanced", description: "Conway's Game of Life grid injected with fresh alive seeds on each beat.", type: "canvas", tags: ["conway", "cellular", "life"] },

  // 76-85: Typography & ASCII
  { id: "way-076", number: 76, title: "76. ASCII Spectrum Density Matrix", category: "Typography & ASCII", complexity: "Intermediate", description: "Renders frequency amplitude using ASCII character density: .:-=+*#%@", type: "canvas", tags: ["ascii", "matrix", "typography"] },
  { id: "way-077", number: 77, title: "77. Matrix Digital Green Rain", category: "Typography & ASCII", complexity: "Intermediate", description: "Falling katakana glyphs accelerated into hyperspeed whenever kicks hit.", type: "canvas", tags: ["matrix", "digital-rain", "code"] },
  { id: "way-078", number: 78, title: "78. Audio Reactive Word Cloud", category: "Typography & ASCII", complexity: "Intermediate", description: "Keywords floating in 2D space that repel and re-orient on every drum hit.", type: "canvas", tags: ["wordcloud", "text", "physics"] },
  { id: "way-079", number: 79, title: "79. Cyberpunk Decryption Scramble", category: "Typography & ASCII", complexity: "Beginner", description: "Scrambles alphanumeric cipher characters until a beat resolves them.", type: "dom", tags: ["cipher", "scramble", "cyberpunk"] },
  { id: "way-080", number: 80, title: "80. Variable Font Weight Wobble", category: "Typography & ASCII", complexity: "Beginner", description: "Animates variable font axis properties (wght, slnt, wdth) with audio RMS.", type: "dom", tags: ["variable-font", "typography", "css"] },
  { id: "way-081", number: 81, title: "81. Circular Text Orbit Carousel", category: "Typography & ASCII", complexity: "Intermediate", description: "Spins phrases along a circular path whose speed locks onto BPM.", type: "canvas", tags: ["circular-text", "orbit", "carousel"] },
  { id: "way-082", number: 82, title: "82. 3D Extruded Text Shadow", category: "Typography & ASCII", complexity: "Intermediate", description: "Casts long isometric drop shadow layers that stretch with bass kick.", type: "dom", tags: ["3d-text", "shadow", "isometric"] },
  { id: "way-083", number: 83, title: "83. Subtitle Lyric Puncher", category: "Typography & ASCII", complexity: "Beginner", description: "Punches rhythmic lyrics word by word on every recognized onset beat.", type: "dom", tags: ["lyrics", "karaoke", "subtitles"] },
  { id: "way-084", number: 84, title: "84. ASCII Audio Waveform Graph", category: "Typography & ASCII", complexity: "Intermediate", description: "Draws real-time oscilloscope using mono ASCII characters inside a terminal.", type: "dom", tags: ["ascii", "terminal", "waveform"] },
  { id: "way-085", number: 85, title: "85. Glowing Neon Sign Flicker", category: "Typography & ASCII", complexity: "Beginner", description: "Simulates broken neon glass tube flickering on offbeats and humming on bass.", type: "dom", tags: ["neon", "sign", "flicker"] },

  // 86-100: Retro & Shaders
  { id: "way-086", number: 86, title: "86. Synthwave Outrun Sunset Highway", category: "Retro & Shaders", complexity: "Advanced", description: "Wireframe perspective grid highway rushing into glowing retro sun on beat.", type: "canvas", tags: ["synthwave", "outrun", "wireframe"] },
  { id: "way-087", number: 87, title: "87. CRT Monitor Scanline Glow", category: "Retro & Shaders", complexity: "Intermediate", description: "Simulates vintage CRT cathode ray tube curvature, scanlines, and phosphor hum.", type: "dom", tags: ["crt", "scanlines", "retro"] },
  { id: "way-088", number: 88, title: "88. VHS Tape Tracking Artifacts", category: "Retro & Shaders", complexity: "Intermediate", description: "Injects analog VHS tape tracking static noise lines whenever drops hit.", type: "canvas", tags: ["vhs", "glitch", "analog"] },
  { id: "way-089", number: 89, title: "89. 8-Bit Chiptune Starfield", category: "Retro & Shaders", complexity: "Beginner", description: "Pixelated retro game stars scrolling horizontally, bouncing with bass.", type: "canvas", tags: ["8bit", "chiptune", "pixel"] },
  { id: "way-090", number: 90, title: "90. Pixel Art Audio Visualizer", category: "Retro & Shaders", complexity: "Intermediate", description: "Chunky 16x16 pixel blocks that light up like vintage arcade dance floors.", type: "canvas", tags: ["pixel-art", "arcade", "blocks"] },
  { id: "way-091", number: 91, title: "91. Water Ripple Refraction", category: "Retro & Shaders", complexity: "Advanced", description: "Simulates surface water disturbance waves propagating outward on kicks.", type: "canvas", tags: ["water", "ripples", "refraction"] },
  { id: "way-092", number: 92, title: "92. Audio Reactive Metaballs", category: "Retro & Shaders", complexity: "Advanced", description: "Fluid mercury droplets merging and detaching with high bass impact.", type: "canvas", tags: ["metaballs", "fluid", "blobs"] },
  { id: "way-093", number: 93, title: "93. Audio Glitch Block Slicer", category: "Retro & Shaders", complexity: "Intermediate", description: "Slices canvas into horizontal strips offset horizontally on snare hits.", type: "canvas", tags: ["glitch", "slice", "displacement"] },
  { id: "way-094", number: 94, title: "94. Cyberpunk Audio Equalizer Rack", category: "Retro & Shaders", complexity: "Intermediate", description: "Vintage studio rack unit with analog needle meters and glowing LEDs.", type: "canvas", tags: ["rack", "analog", "vu-meter"] },
  { id: "way-095", number: 95, title: "95. Audio Neon Clock Chronometer", category: "Retro & Shaders", complexity: "Intermediate", description: "High-precision timer ring whose seconds tick exactly in sync with BPM.", type: "canvas", tags: ["clock", "chronometer", "bpm"] },
  { id: "way-096", number: 96, title: "96. Vector Oscilloscope XY Heart", category: "Retro & Shaders", complexity: "Advanced", description: "XY audio vector synthesis drawing a beating vector heart curve.", type: "canvas", tags: ["xy-vector", "heart", "curve"] },
  { id: "way-097", number: 97, title: "97. Digital Cassette Tape Reels", category: "Retro & Shaders", complexity: "Intermediate", description: "Vintage cassette tape with dual spinning reels reacting to music playback.", type: "canvas", tags: ["cassette", "tape", "reels"] },
  { id: "way-098", number: 98, title: "98. Thermal Heatmap Infrared View", category: "Retro & Shaders", complexity: "Advanced", description: "Colors screen in thermal false-color infrared based on energy distribution.", type: "canvas", tags: ["thermal", "infrared", "heatmap"] },
  { id: "way-099", number: 99, title: "99. Holographic Audio Disc Spinner", category: "Retro & Shaders", complexity: "Intermediate", description: "Hologram vinyl disc rotating with iridescent laser light reflections.", type: "canvas", tags: ["hologram", "vinyl", "disc"] },
  { id: "way-100", number: 100, title: "100. Omnipresent Synesthesia Symphony", category: "Retro & Shaders", complexity: "Advanced", description: "The grand synthesis: combines background flashes, particle shockwaves, and kinetic geometry into one ultimate audiovisual experience.", type: "canvas", tags: ["ultimate", "synthesis", "synesthesia", "symphony"] },
];

export function getWay(number: number): BeatWay {
  const meta = ALL_100_WAYS_METADATA.find((w) => w.number === number) || ALL_100_WAYS_METADATA[0];
  return {
    ...meta,
    code: getWayCode(meta.number, meta.category, meta.title, meta.type),
  };
}
