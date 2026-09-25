/* vo.mjs — generate the voiceover lines through OpenRouter's speech endpoint, convert to 48k WAV,
   verify each line with local Whisper (words + timestamps), and write a manifest the timeline consumes.
   usage: ENV_FILE=... node vo.mjs <script.json> <outdir> [model] [voice] [speed]                            */
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const [scriptPath, outdir, model = 'minimax/speech-2.8-hd', voice = 'English_Trustworth_Man', speed = '1.0'] = process.argv.slice(2);
const key = (fs.readFileSync(process.env.ENV_FILE, 'utf8').match(/OPENROUTER_API_KEY=(\S+)/) || [])[1];
const script = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
fs.mkdirSync(outdir, { recursive: true });
const manifest = { model, voice, speed: +speed, lines: [] };
let totalChars = 0;
for (const b of script.beats) {
  if (!b.vo || !b.vo.trim()) continue;
  const id = String(b.id).padStart(2, '0'); const mp3 = path.join(outdir, `vo-${id}.mp3`), wav = path.join(outdir, `vo-${id}.wav`);
  const spoken = (b.vo_spoken || b.vo).trim(); totalChars += spoken.length;
  if (!fs.existsSync(mp3) || process.env.FORCE) {
    const body = { model, input: spoken, voice, response_format: 'mp3', speed: +speed };
    const res = await fetch('https://openrouter.ai/api/v1/audio/speech', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { console.error('TTS failed', id, res.status, await res.text()); process.exit(1); }
    fs.writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
  }
  // to 48k stereo wav, trim leading/trailing silence lightly, leave natural room
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', mp3, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse,loudnorm=I=-16:TP=-1.5:LRA=9', '-ar', '48000', '-ac', '2', wav]);
  const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).toString().trim();
  manifest.lines.push({ id: b.id, text: b.vo, spoken, file: path.basename(wav), duration: dur });
  console.log(`vo-${id}: ${dur.toFixed(2)}s  "${b.vo.slice(0, 60)}"`);
}
manifest.totalChars = totalChars;
fs.writeFileSync(path.join(outdir, 'manifest.json'), JSON.stringify(manifest, null, 1));
// verify with whisper: transcript + word timestamps per line
const py = `
import json,sys
from faster_whisper import WhisperModel
m = WhisperModel('small', device='cpu', compute_type='int8')
man = json.load(open(sys.argv[1]))
for ln in man['lines']:
    segs, info = m.transcribe(sys.argv[2] + '/' + ln['file'], word_timestamps=True, beam_size=5)
    words = []
    for s in segs:
        for w in s.words: words.append({'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)})
    ln['heard'] = ' '.join(x['w'] for x in words); ln['words'] = words
json.dump(man, open(sys.argv[1], 'w'), indent=1)
for ln in man['lines']: print(str(ln['id']).rjust(2), '|', ln['heard'])
`;
execFileSync('python3', ['-c', py, path.join(outdir, 'manifest.json'), outdir], { stdio: 'inherit' });
console.log('chars', totalChars, 'est. cost $', (totalChars * (model.includes('hd') ? 0.0001 : 0.00006)).toFixed(3));
