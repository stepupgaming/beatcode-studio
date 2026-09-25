# BeatCode Studio

BeatCode Studio is a browser-based audio-reactive visual instrument. Load a track, choose a visual system, and perform the beat as a live scene switcher, canvas sketch, or editable code experiment.

## What is included

- **Picture Deck** — curated visual packs, custom image uploads, beat-triggered cuts, glitch, zoom slam, crossfade, CRT, spectrum, shockwaves, and strobe controls.
- **100 Beat Ways** — searchable DOM and Canvas techniques with live editing, reset-to-pristine behavior, keyboard navigation, random mode, and adjustable auto-switch timing.
- **Audio cockpit** — bundled WAV grooves, local audio uploads, browser microphone input, adaptive onset detection, sensitivity controls, volume, and live frequency analysis.
- **AI Beat Code** — optional Gemini-powered generation and iteration of new `render` or `updateDOM` sketches.
- **Video export** — record the Picture Deck or Canvas ways locally as WebM/MP4 with the active audio track. DOM techniques use browser screen capture when a clean canvas is not available.

Video recording happens in the browser with `MediaRecorder`; the app does not upload recordings or user audio.

## Requirements

- Node.js 20 or newer
- A modern Chromium, Firefox, or Safari browser with Web Audio enabled
- A Gemini API key only if you want the AI generator

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app works without an API key; the AI button reports a configuration message when Gemini is not configured.

## Verify a production build

```bash
npm run check
npm start
```

## Export a video

1. Start or upload an audio track.
2. Open **Picture Deck** or a Canvas way.
3. Select the aspect ratio and optional **Export video** control.
4. Choose 720p/1080p and 30/60 fps.
5. Press **Start recording**, perform the visual, then press **Stop & download**.

Chrome and Edge generally provide the best canvas recording support. Firefox and Safari may expose different `MediaRecorder` codecs; the recorder automatically selects the best available MIME type. A clean canvas export captures the generated visual and audio, while a screen-capture fallback is provided for DOM-based techniques and full-stage overlays.

## Project structure

```text
app/                 Next.js app shell and AI route
components/          Audio, visual, editor, and export UI
lib/audioEngine.ts   Web Audio playback, analysis, and recording stream
lib/videoExport.ts   MIME, dimensions, bitrate, and download helpers
lib/beatCodeRegistry.ts  The 100 visual technique catalog
public/tracks/       Bundled royalty-free generated WAV grooves
scripts/             Local track-generation utility
```

## Deployment

The app is configured for Next.js standalone output. Deploy it to any Node-compatible host, or run the production build locally with `npm run build && npm start`. Set `GEMINI_API_KEY` in the host’s secret manager for AI generation; never commit `.env.local`.

## Notes for contributors

- Keep beat-reactive code limited to the documented `render(ctx, width, height, audioState, state)` and `updateDOM(container, audioState, state)` contracts.
- Use `npm run lint` and `npm run typecheck` before opening a change.
- Avoid adding network calls or telemetry without an explicit product decision.
