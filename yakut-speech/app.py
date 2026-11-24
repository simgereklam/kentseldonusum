"""Yakut's self-hosted Turkish speech service."""
import audioop
import base64
import hmac
import json
import os
from threading import BoundedSemaphore

from flask import Flask, Response, request
from piper import PiperVoice

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16_384
token = os.environ["YAKUT_SPEECH_TOKEN"]
if len(token) < 32:
    raise RuntimeError("YAKUT_SPEECH_TOKEN must have at least 32 characters")
expected_auth = ("Bearer " + token).encode()
voice = PiperVoice.load(os.environ.get("YAKUT_MODEL", "model/ilkiz.onnx"))
capacity = BoundedSemaphore(1)


@app.get("/health")
def health():
    return {"ok": True, "voice": "ilkiz", "sample_rate": 24000}


@app.post("/live")
def speech():
    if not hmac.compare_digest(request.headers.get("Authorization", "").encode(), expected_auth):
        return {"error": "UNAUTHORIZED"}, 401
    payload = request.get_json(silent=True)
    text = payload.get("readAloud") if isinstance(payload, dict) else None
    if not isinstance(text, str) or not text.strip() or len(text) > 2000:
        return {"error": "INVALID_TEXT"}, 400
    if not capacity.acquire(blocking=False):
        return {"error": "VOICE_BUSY"}, 503, {"Retry-After": "1"}

    def generate():
        state = None
        has_audio = False
        try:
            for chunk in voice.synthesize(text.strip()):
                pcm, state = audioop.ratecv(
                    chunk.audio_int16_bytes, 2, 1, chunk.sample_rate, 24000, state
                )
                for offset in range(0, len(pcm), 12000):
                    has_audio = True
                    audio = base64.b64encode(pcm[offset:offset + 12000]).decode("ascii")
                    yield json.dumps({"audio": audio}) + "\n"
            yield '{"done":true}\n' if has_audio else '{"error":"EMPTY_VOICE"}\n'
        except Exception:
            app.logger.exception("Voice synthesis failed")
            yield '{"error":"VOICE_SYNTHESIS_FAILED"}\n'

    response = Response(generate(), content_type="application/x-ndjson; charset=utf-8")
    response.headers["Cache-Control"] = "no-store"
    response.call_on_close(capacity.release)
    return response
