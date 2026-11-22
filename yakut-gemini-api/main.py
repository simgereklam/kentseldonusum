"""YAKUT Gemini chat API. Deploy behind HTTPS; keep GEMINI_API_KEY server-side."""
import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
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
