/* build.mjs — the pipeline: script.json + VO manifest → cues.json → music (re-timed) → mix.wav → mix.mp3/ogg.
   usage: node tools/build.mjs [voiceDir=audio/vo/primary]                                                      */
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const voiceDir = path.resolve(ROOT, process.argv[2] || 'audio/vo/primary');
const script = JSON.parse(fs.readFileSync(path.join(ROOT, 'script.json'), 'utf8'));
const man = JSON.parse(fs.readFileSync(path.join(voiceDir, 'manifest.json'), 'utf8'));
const { sfxFor, musicSectionsFor } = await import(path.join(ROOT, 'src/scenes.js'));

// ── timing: beats start when the previous beat's visuals AND voice are done ──
const LEAD = 0.45, TAIL = 0.5;
let t = 0; const beats = []; const vo = [];
for (const b of script.beats) {
  const line = man.lines.find(l => l.id === b.id);
  const planned = Math.max(0, (b.end - b.start));
  const minVisual = b.hold ?? planned;
  const voStart = t + (b.lead ?? LEAD);
  const voDur = line ? line.duration : 0;
  const end = Math.max(t + minVisual, line ? voStart + voDur + (b.tail ?? TAIL) : t + minVisual);
  beats.push({ id: b.id, role: b.role, start: +t.toFixed(3), end: +end.toFixed(3), voStart: line ? +voStart.toFixed(3) : null, voEnd: line ? +(voStart + voDur).toFixed(3) : null, on_screen: b.on_screen || '', words: line ? line.words : [] });
  if (line) vo.push({ file: line.file, at: +voStart.toFixed(3), duration: voDur, text: line.text });
  t = end;
}
const duration = +(t + (script.outro ?? 1.2)).toFixed(3);
const cues = { duration, beats, vo, audio: 'audio/mix.mp3', tagline: script.tagline };
cues.sfx = sfxFor(cues);
cues.music = { gain: script.musicGain ?? 0.5, duck: script.musicDuck ?? 0.4, fadeOut: duration - 2.2, fadeLen: 2.2 };
cues.sections = musicSectionsFor(cues);
fs.writeFileSync(path.join(ROOT, 'cues.json'), JSON.stringify(cues, null, 1));
console.log('cues.json →', beats.map(b => `${b.role || b.id}@${b.start}`).join('  '), '| duration', duration);
// ── music re-timed to the cue sheet ──
const sectionsFile = path.join(ROOT, 'audio', 'music-sections.json');
fs.writeFileSync(sectionsFile, JSON.stringify({ sections: cues.sections, seed: script.musicSeed ?? 7 }));
execFileSync('node', [path.join(ROOT, 'audio/compose.mjs'), sectionsFile, path.join(ROOT, 'audio/music.wav')], { stdio: 'inherit' });
// ── mix ──
execFileSync('node', [path.join(ROOT, 'audio/mix.mjs'), path.join(ROOT, 'cues.json'), voiceDir, path.join(ROOT, 'audio/music.wav'), path.join(ROOT, 'audio/mix.wav')], { stdio: 'inherit' });
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(ROOT, 'audio/mix.wav'), '-c:a', 'libmp3lame', '-b:a', '192k', path.join(ROOT, 'audio/mix.mp3')]);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(ROOT, 'audio/mix.wav'), '-c:a', 'libopus', '-b:a', '128k', path.join(ROOT, 'audio/mix.ogg')]);
console.log('audio built: audio/mix.wav, mix.mp3, mix.ogg');
