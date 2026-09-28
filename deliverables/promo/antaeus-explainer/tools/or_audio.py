"""or_audio.py: small OpenRouter helpers for the explainer's audio work.

    listen(model, prompt, *audio_paths)  -> text reply from a model that can hear (audio sent as base64)
    speak(model, text, voice, out_path, fmt="mp3", speed=None, provider=None) -> writes the audio file
    music(prompt, out_path, pro=True, seed=None) -> writes the generated track (Lyria), returns the raw reply
    credits() -> (total, used)

The key is read from OPENROUTER_API_KEY or from the env file named by ENV_FILE. It is never printed.
Every call appends one line to ~/.or_audio_spend.jsonl with the model and the cost OpenRouter reported."""
import base64, json, os, pathlib, re, sys, time, urllib.request

API = "https://openrouter.ai/api/v1"
LOG = pathlib.Path(os.environ.get("OR_SPEND_LOG", str(pathlib.Path.home() / ".or_audio_spend.jsonl")))


def _key():
    k = os.environ.get("OPENROUTER_API_KEY")
    if not k and os.environ.get("ENV_FILE"):
        m = re.search(r"OPENROUTER_API_KEY=(\S+)", pathlib.Path(os.environ["ENV_FILE"]).read_text())
        k = m and m.group(1)
    if not k:
        sys.exit("no OPENROUTER_API_KEY (set it or ENV_FILE)")
    return k


def _post(path, body, raw=False, timeout=600):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode(), method="POST",
                                 headers={"Authorization": f"Bearer {_key()}", "Content-Type": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                data = r.read()
                return data if raw else json.loads(data)
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")[:800]
            if e.code in (429, 500, 502, 503) and attempt < 3:
                time.sleep(2 ** (attempt + 1)); continue
            raise RuntimeError(f"HTTP {e.code} on {path}: {msg}")
        except urllib.error.URLError:
            if attempt < 3:
                time.sleep(2 ** (attempt + 1)); continue
            raise


def _log(kind, model, cost, extra=None):
    with LOG.open("a") as f:
        f.write(json.dumps({"t": time.time(), "kind": kind, "model": model, "cost": cost, **(extra or {})}) + "\n")


def credits():
    req = urllib.request.Request(API + "/credits", headers={"Authorization": f"Bearer {_key()}"})
    d = json.loads(urllib.request.urlopen(req, timeout=60).read())["data"]
    return d["total_credits"], d["total_usage"]


def listen(model, prompt, *audio_paths, max_tokens=3000, temperature=0.2, schema=None):
    parts = [{"type": "text", "text": prompt}]
    for p in audio_paths:
        p = pathlib.Path(p); fmt = p.suffix.lstrip(".").lower()
        parts.append({"type": "text", "text": f"[audio file: {p.name}]"})
        parts.append({"type": "input_audio", "input_audio": {"data": base64.b64encode(p.read_bytes()).decode(), "format": fmt}})
    body = {"model": model, "messages": [{"role": "user", "content": parts}], "max_tokens": max_tokens,
            "temperature": temperature, "usage": {"include": True}}
    if schema:
        body["response_format"] = {"type": "json_schema", "json_schema": {"name": "review", "strict": True, "schema": schema}}
    r = _post("/chat/completions", body)
    cost = (r.get("usage") or {}).get("cost")
    _log("listen", model, cost, {"files": [pathlib.Path(p).name for p in audio_paths]})
    text = r["choices"][0]["message"].get("content") or ""
    return json.loads(text) if schema else text


def speak(model, text, voice, out_path, fmt="mp3", speed=None, provider=None):
    body = {"model": model, "input": text, "voice": voice, "response_format": fmt}
    if speed is not None:
        body["speed"] = speed
    if provider:
        body["provider"] = provider
    data = _post("/audio/speech", body, raw=True)
    pathlib.Path(out_path).write_bytes(data)
    _log("speak", model, None, {"voice": voice, "chars": len(text)})
    return out_path


def music(prompt, out_path, pro=True, seed=None, fmt="wav"):
    """Lyria returns its audio only on a streamed reply with modalities text+audio; chunks arrive as delta.audio.data."""
    model = "google/lyria-3-pro-preview" if pro else "google/lyria-3-clip-preview"
    body = {"model": model, "messages": [{"role": "user", "content": prompt}], "modalities": ["text", "audio"],
            "audio": {"format": fmt}, "stream": True, "usage": {"include": True}}
    if seed is not None:
        body["seed"] = seed
    req = urllib.request.Request(API + "/chat/completions", data=json.dumps(body).encode(), method="POST",
                                 headers={"Authorization": f"Bearer {_key()}", "Content-Type": "application/json"})
    chunks, text, cost, fmt_seen = [], [], None, None
    with urllib.request.urlopen(req, timeout=900) as r:
        for raw in r:
            line = raw.decode("utf-8", errors="replace").strip()
            if not line.startswith("data: "):
                continue
            data = line[6:]
            if data == "[DONE]":
                break
            ev = json.loads(data)
            if ev.get("usage"):
                cost = ev["usage"].get("cost", cost)
            for ch in ev.get("choices") or []:
                d = ch.get("delta") or {}
                a = d.get("audio") or {}
                if a.get("data"):
                    chunks.append(a["data"])
                if a.get("format"):
                    fmt_seen = a["format"]
                if a.get("transcript"):
                    text.append(a["transcript"])
                if isinstance(d.get("content"), str):
                    text.append(d["content"])
    _log("music", model, cost, {"prompt": prompt[:120]})
    if chunks:
        pathlib.Path(out_path).write_bytes(base64.b64decode("".join(chunks)))
    return {"bytes": sum(len(c) for c in chunks) * 3 // 4, "text": "".join(text), "cost": cost, "format": fmt_seen}


if __name__ == "__main__":
    t, u = credits(); print(f"credits {t} used {u:.4f} left {t - u:.4f}")
