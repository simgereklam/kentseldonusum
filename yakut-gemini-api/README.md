# YAKUT Gemini backend

This directory contains an optional FastAPI backend. The live kentseldönüşüm.com.tr site currently uses the separate Cloudflare Worker in `yakut-chat/`; changing this optional server does not change the live Worker. GitHub changes are **not** deployment and do not update an already-running server automatically.

## Run

Configure `GEMINI_API_KEY` only as a private runtime environment variable (never in GitHub or frontend JavaScript). Optionally set `GEMINI_MODEL`, `GEMINI_TTS_MODEL` (default `gemini-2.5-flash-preview-tts`), and `YAKUT_ALLOWED_ORIGINS`.

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Publish behind HTTPS and set the website's `meta[name="yakut-chat-endpoint"]` to the deployed `https://YOUR-BACKEND/chat` URL.

## Routes

- `GET /health`: reports whether the private API key is configured, not its value.
- `POST /chat`: Gemini text answers. **Gemini Google Search is disabled**, even when `research=true` is passed. An external search broker must be implemented/deployed separately to supply researched sources.
- `POST /live`: `{"readAloud":"Merhaba"}` synthesizes the configured **Aoede** voice and returns NDJSON lines with base64 16-bit PCM mono audio at 24 kHz, ending with `{"done":true}`. The current browser player consumes this format. This is server-side speech synthesis, **not** a bidirectional Gemini Live microphone session.

The live website uses only Gemini Aoede TTS; no MP3 recordings or browser text-to-speech fallbacks are permitted. Do not put keys in the browser. Verify service deployment, quota, and audio in a real browser before claiming the production voice is active.
