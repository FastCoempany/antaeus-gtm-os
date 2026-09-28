# Antaeus — the explainer (paper-collage, pure JavaScript)

A 57-second animated explainer for antaeus.app in a hand-drawn paper-collage style. Everything
on screen is drawn procedurally on a `<canvas>` at 1920×1080 — no video editor, no animation library,
no image assets. The paper sound effects are synthesized in JavaScript. The voiceover (Fish Audio) and
the music bed (Google Lyria) are generated through OpenRouter. Both were chosen by two listening models
from different companies in blind comparisons, and every voice line is checked with a local speech-to-text pass.

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
audio/music-lyria.flac the music bed: a Google Lyria track fitted to the film (recipe in music-lyria.json)
audio/compose.mjs      the fallback music bed, composed in code and re-timed to the film's sections
audio/sfx.mjs          paper slides, tape rips, marker scribbles, thunks, page flips, dings
audio/vo.mjs           voiceover generation (OpenRouter speech endpoint) + Whisper verification
audio/mix.mjs          final mix: voice at cue times, music ducked under the voice, effects
tools/build.mjs        script + VO manifest → cues.json → music → mix.wav → mix.mp3/ogg
tools/render.mjs       frames via headless Chromium → ffmpeg → MP4
tools/stills.mjs       render individual frames for review
tools/or_audio.py      OpenRouter helpers: listen (audio review by a listening model), speak, music (Lyria)
```

### The voice

`audio/vo/fish-adrian/` is the narrator: Fish Audio S2.1 Pro (`fish-audio/s2.1-pro`), library voice "Adrian"
(`bf322df2096a46f18c579d0baa36f41d`), a calm, dry male read. The brand is said **an-TEE-us** (/ænˈtiː.əs/), the
dictionary pronunciation of the Greek giant. Engines only say it that way with a respelling, so `audio/vo.mjs` takes
a per-engine spelling (`Antee-us` for this voice; the on-screen text still says Antaeus). Lines 3 and 9 are the one
draw out of six that passed every controlled check: both listening models heard an-TEE-us, one word, stress on the
second syllable, alone and in context, in calls that included a known an-TAY-us clip as a control. Any regenerated
line 3 or 9 must be re-checked the same way.

How it was chosen: seven engines were tried on the name first (MiniMax, Microsoft MAI-Voice-2, Fish Audio, Deepgram
Aura-2, xAI Grok voice, Google Gemini TTS, Mistral Voxtral). Gemini TTS and Voxtral could not say it; the others
could with a respelling. Full takes were judged blind by `google/gemini-3.1-pro-preview` and `openai/gpt-audio`.
The previous narrator (`audio/vo/primary/`, MiniMax `English_Trustworth_Man`) says an-TAY-us and was ranked last by
both judges. The close runner-up was Microsoft MAI-Voice-2 "Harper" with the soft voice style: a female voice whose
pronunciation was the most consistent. If you say the brand an-TAY-us, the old take in `audio/vo/primary/` already
says it that way: set `voiceDir` in `script.json` back to it and rebuild.

### The music

`audio/music-lyria.flac` is a Google Lyria 3 Pro track (seed 44, prompt in `audio/music-lyria.json`), fitted to the
film with two whole-bar cuts at spectrally matched points and a 1.15% uniform tempo stretch, so its quiet passage
sits under the slipping deal and its final chord lands just after the last word. In blind three-way and
position-swapped comparisons, both listening models preferred it to the synthesized bed. Remove `musicBed` from
`script.json` to go back to the composed bed in `audio/compose.mjs`.

### Regenerate everything

```bash
# 1. voice (needs OPENROUTER_API_KEY in an env file). Existing vo-XX.mp3 files are reused; FORCE=1 regenerates
#    them (about a cent), after which lines 3 and 9 must be re-checked for the pronunciation.
ENV_FILE=/path/to/.env node audio/vo.mjs script.json audio/vo/fish-adrian fish-audio/s2.1-pro bf322df2096a46f18c579d0baa36f41d 1.0 Antee-us
# 2. cue sheet + music + mix (voice folder, music bed and levels come from script.json)
node tools/build.mjs
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
