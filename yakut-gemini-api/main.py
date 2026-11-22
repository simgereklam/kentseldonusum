"""YAKUT Gemini chat API. Deploy behind HTTPS; keep GEMINI_API_KEY server-side."""
import os
import base64
import io
import json
import wave
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import httpx

app = FastAPI(title="YAKUT Gemini API")
origins = [s.strip() for s in os.getenv("YAKUT_ALLOWED_ORIGINS", "https://xn--kentseldnm-lcb7ea99k.com.tr,https://www.xn--kentseldnm-lcb7ea99k.com.tr").split(",") if s.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["POST","GET"], allow_headers=["Content-Type"])
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

class Turn(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    history: list[Turn] = Field(default_factory=list)
    research: bool = False
    reference: str = ""

@app.get("/health")
def health():
    return {"ok": True, "gemini_configured": bool(os.getenv("GEMINI_API_KEY"))}

@app.post("/chat")
async def chat(req: ChatRequest):
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY sunucuda yapılandırılmadı")
    contents = []
    for item in req.history[-12:]:
        if item.role in ("user", "assistant") and item.text.strip():
            contents.append({"role": "model" if item.role == "assistant" else "user", "parts": [{"text": item.text[:1500]}]})
    contents.append({"role": "user", "parts": [{"text": req.question}]})
    payload = {
        "systemInstruction": {"parts": [{"text": "Sen Kumtaş İnşaat sitesinin YAKUT isimli Türkçe sesli asistanısın. Doğal ve kısa konuş. Google Search veya başka bir Gemini arama aracı kullanma. Güncel bilgileri harici kaynaktan doğrulanmadıkça kesinmiş gibi söyleme. İmar verisini resmî kaynaktan doğrulamadıysan tahmin olarak belirt. Kullanıcı istediğinde sayfa gezinmesini web arayüzü yapar; sen asistan olarak bilgi ver."}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.5, "maxOutputTokens": 1200},
    }
    # Gemini Google Search is intentionally disabled. External research must use
    # a separately configured search service; never enable Gemini tools here.
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    try:
        async with httpx.AsyncClient(timeout=35) as client:
            response = await client.post(url, headers={"x-goog-api-key": key}, json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Gemini API yanıtı: HTTP {response.status_code}")
        data = response.json()
        candidate = (data.get("candidates") or [{}])[0]
        answer = "".join(part.get("text", "") for part in candidate.get("content", {}).get("parts", []))
        if not answer.strip():
            raise HTTPException(status_code=502, detail="Gemini boş yanıt döndürdü")
        sources = []
        for chunk in candidate.get("groundingMetadata", {}).get("groundingChunks", []):
            web = chunk.get("web", {})
            if web.get("uri"):
                sources.append({"title": web.get("title", ""), "url": web["uri"]})
        return {"answer": answer.strip(), "sources": sources}
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Gemini bağlantısı kurulamadı")


# Gemini speech is deliberately separate from Gemini chat and Google Search.
# Aoede is the single voice for synthesized answers. Never expose API keys.
TTS_MODEL = os.getenv("GEMINI_TTS_MODEL", "gemini-2.5-flash-preview-tts")
TTS_VOICE = "Aoede"

class LiveRequest(BaseModel):
    readAloud: str = Field(min_length=1, max_length=2000)

def _pcm24k(data: bytes, mime: str) -> bytes:
    """Normalize a Gemini WAV result to the 24 kHz mono signed 16-bit PCM
    format already consumed by yakut-v9.js; older TTS models return raw PCM."""
    if data.startswith(b"RIFF") and data[8:12] == b"WAVE":
        try:
            with wave.open(io.BytesIO(data), "rb") as wav:
                if wav.getnchannels() != 1 or wav.getframerate() != 24000 or wav.getsampwidth() != 2:
                    raise ValueError("Unsupported WAV parameters")
                return wav.readframes(wav.getnframes())
        except (wave.Error, EOFError, ValueError) as exc:
            raise HTTPException(status_code=502, detail="Gemini ses biçimi desteklenmiyor") from exc
    if not mime.startswith(("audio/l16", "audio/pcm")):
        raise HTTPException(status_code=502, detail="Gemini beklenmeyen ses biçimi döndürdü")
    if len(data) % 2:
        raise HTTPException(status_code=502, detail="Gemini eksik PCM verisi döndürdü")
    return data

@app.post("/live")
async def live(req: LiveRequest):
    """NDJSON base64 PCM frames expected by the existing Yakut web player."""
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY sunucuda yapılandırılmadı")
    payload = {
        "contents": [{"role": "user", "parts": [{"text": "Aşağıdaki Türkçe metni aynen, sıcak ve doğal bir kadın sesiyle seslendir. Yalnızca metni oku: " + req.readAloud}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": TTS_VOICE}}},
        },
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{TTS_MODEL}:generateContent"
    try:
        async with httpx.AsyncClient(timeout=55) as client:
            response = await client.post(url, headers={"x-goog-api-key": key}, json=payload)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail="Gemini ses sunucusuna bağlanılamadı") from exc
    if response.status_code != 200:
        # Do not leak upstream response bodies or credentials to browsers.
        raise HTTPException(status_code=502, detail=f"Gemini ses servisi HTTP {response.status_code} yanıtı verdi")
    try:
        body = response.json()
        parts = (body.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
        audio_parts = [p["inlineData"] for p in parts if p.get("inlineData", {}).get("data")]
        if not audio_parts:
            raise ValueError("No audio")
        data = b"".join(_pcm24k(base64.b64decode(p["data"], validate=True), p.get("mimeType", "")) for p in audio_parts)
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        raise HTTPException(status_code=502, detail="Gemini geçerli ses verisi döndürmedi") from exc
    if not data:
        raise HTTPException(status_code=502, detail="Gemini boş ses döndürdü")

    async def frames():
        # Each frame starts on a 16-bit sample boundary.
        # Browsers can stop playback immediately using AbortController.
        for offset in range(0, len(data), 48000):
            chunk = data[offset:offset + 48000]
            yield json.dumps({"audio": base64.b64encode(chunk).decode("ascii")}) + "\n"
        yield '{"done":true}\n'

    return StreamingResponse(frames(), media_type="application/x-ndjson",
                             headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})
