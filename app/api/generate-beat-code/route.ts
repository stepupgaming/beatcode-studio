import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI generation is not configured on this deployment." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const currentCode = typeof body.currentCode === "string" ? body.currentCode : "";
    const type = body.type === "dom" ? "dom" : "canvas";

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 2000 || currentCode.length > 50000) {
      return NextResponse.json(
        { error: "Prompt or current code is too large" },
        { status: 413 }
      );
    }

    const systemInstruction = `You are an expert creative technologist and generative audio-visual programmer.
Your task is to write clean, high-performance, beat-reactive JavaScript code for an interactive creative coding sandbox.

The sandbox provides an environment with:
- Target runtime: Either "canvas" (HTML5 Canvas 2D) or "dom" (HTML/CSS DOM manipulation).
- For "canvas", the code MUST export/define a single JavaScript function:
\`\`\`javascript
// params:
// ctx: CanvasRenderingContext2D
// width: number (canvas width in pixels)
// height: number (canvas height in pixels)
// audioState: {
//    isBeat: boolean (true on the frame a beat/kick hits)
//    beatCount: number (incrementing integer on each beat)
//    energy: number (0.0 to 1.0 overall volume)
//    bass: number (0.0 to 1.0 low-end kick energy)
//    mid: number (0.0 to 1.0 mid-range energy)
//    treble: number (0.0 to 1.0 high-frequency energy)
//    bpm: number (estimated tempo)
//    time: number (audio playback time in seconds)
//    frequencies: Uint8Array (256 raw frequency spectrum bins)
// }
// state: object preserved across animation frames for storing persistent particles, angles, history, etc.
function render(ctx, width, height, audioState, state) {
  // your beat-reactive drawing code here
}
\`\`\`

- For "dom", the code MUST define a function:
\`\`\`javascript
// params:
// container: HTMLElement (the preview container element)
// audioState: same as above
// state: persistent state object across frames
function updateDOM(container, audioState, state) {
  // your beat-reactive DOM/CSS code here
}
\`\`\`

Return a JSON response with:
1. "title": Short descriptive title (e.g., "Neon Glitch Horizon")
2. "type": "canvas" or "dom"
3. "description": 1-2 sentence explanation of the visual mechanic and how beats drive it
4. "code": The clean executable JavaScript code function (either \`function render(ctx, width, height, audioState, state) { ... }\` or \`function updateDOM(container, audioState, state) { ... }\`)
5. "explanation": 2-3 bullet points detailing:
   - What happens on the beat hit (\`audioState.isBeat\`)
   - How frequencies/bass modulate movement
   - Visual aesthetics`;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "beatcode-studio",
        },
      },
    });

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: `User idea: "${prompt}"
Requested format: ${type}
${currentCode ? `Base code to iterate on:\n${currentCode}` : ""}

Generate a stunning, responsive, 60fps audio-reactive code snippet. Ensure code runs safely without external dependencies. Return strictly valid JSON conforming to the schema.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed: unknown = JSON.parse(text);

    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json(
        { error: "The AI response was not a valid object." },
        { status: 502 }
      );
    }

    const result = parsed as Record<string, unknown>;
    if (typeof result.code !== "string" || result.code.length > 100000) {
      return NextResponse.json(
        { error: "The AI response did not include valid beat code." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      title: typeof result.title === "string" ? result.title.slice(0, 120) : "AI Beat Synthesis",
      type: result.type === "dom" ? "dom" : type,
      description:
        typeof result.description === "string"
          ? result.description.slice(0, 1000)
          : "Generated beat-reactive visual.",
      code: result.code,
      explanation: typeof result.explanation === "string" ? result.explanation.slice(0, 2000) : "",
    });
  } catch (error: unknown) {
    console.error("Beat code generation error:", error);
    return NextResponse.json(
      { error: "Unable to generate beat code right now." },
      { status: 500 }
    );
  }
}
