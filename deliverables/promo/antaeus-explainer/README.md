# Antaeus — the explainer (paper-collage, pure JavaScript)

A 50-ish second animated explainer for antaeus.app in a hand-drawn paper-collage style. Everything
on screen is drawn procedurally on a `<canvas>` at 1920×1080 — no video editor, no animation library,
no image assets. The music bed and the paper sound effects are synthesized in JavaScript too. The
voiceover is generated with a text-to-speech model through OpenRouter and verified with a local
speech-to-text pass.

## Watch it

- `antaeus-explainer.mp4` — the rendered film (1080p30, H.264 + AAC).
- `index.html` — the same film played live in a browser, driven by the mixed audio track
  (`audio/mix.mp3`). Serve the folder over HTTP (for example `python3 -m http.server 8000`
  from this directory) and open `http://localhost:8000/`, then click **Play with sound**.
  Space pauses, R restarts.

## How it is built

```
script.json            the script: beats, voice lines, roles, holds
src/paper.js           paper-collage drawing primitives (rough cuts, tape, ink, figures, the Grounded A…)
src/engine.js          easing + timeline helpers (every frame is a pure function of time)
src/scenes.js          the film: six pages, one plan() that derives every event time from the cue sheet
src/film.js            player + render hooks (fonts, audio sync, keyboard)
audio/synth.mjs        offline software synthesizer (plucked strings, bells, bass, percussion, reverb)
audio/compose.mjs      the music bed, composed in code and re-timed to the film's sections
audio/sfx.mjs          paper slides, tape rips, marker scribbles, thunks, page flips, dings
audio/vo.mjs           voiceover generation (OpenRouter speech endpoint) + Whisper verification
audio/mix.mjs          final mix: voice at cue times, music ducked under the voice, effects
tools/build.mjs        script + VO manifest → cues.json → music → mix.wav → mix.mp3/ogg
tools/render.mjs       frames via headless Chromium → ffmpeg → MP4
tools/stills.mjs       render individual frames for review
```

### The voice

`audio/vo/primary/` is MiniMax Speech 2.8 HD, voice `English_Trustworth_Man`, at speed 0.9 (the calmer read the
brief asks for). Every line was transcribed back with Whisper (`manifest.json` carries the heard text and word
timestamps; the film's on-screen text is cued from those timestamps). `audio/vo/trustworth-speed100/` is the same
voice at normal speed, kept for comparison. To try another voice, run `audio/vo.mjs` with a different model/voice
into a new folder and point `tools/build.mjs` at it; the cue sheet, music sections and mix re-time themselves.

OpenRouter note: paid speech calls need purchased credits on the account. The account used here had none and
OpenRouter stopped serving speech after about twenty cents of usage, so only the primary take (plus the speed-1.0
comparison) exists. With credits, `google/lyria-3-clip-preview` can also replace the synthesized music bed (a
prompt for it is in `audio/compose.mjs`'s header comment); the mixer treats any 48 kHz stereo WAV as the bed.

### Regenerate everything

```bash
# 1. voice (needs OPENROUTER_API_KEY in an env file; costs a few cents per pass)
ENV_FILE=/path/to/.env node audio/vo.mjs script.json audio/vo/primary minimax/speech-2.8-hd English_Trustworth_Man
# 2. cue sheet + music + mix
node tools/build.mjs audio/vo/primary
# 3. the film
node tools/render.mjs index.html antaeus-explainer.mp4 30 "" audio/mix.wav
```

Run the node commands from the repository root (Playwright resolves from the root `node_modules`).
`CHROME_PATH` overrides the Chromium binary used for rendering.

## Brand rules the film obeys

- Bright field, navy ink, graph-paper undertexture. The Grounded A stays navy — it never takes orange.
- One orange on screen at a time, and only for the one thing to do first.
- Blue is what the system found or says; forest green is what lasts (the handoff book, "back on the ground").
- Red appears once, when a deal is really slipping.
- Copy follows the plain-language rules (no "proof", "earned", "verdict", "motion", "pipeline"…).
