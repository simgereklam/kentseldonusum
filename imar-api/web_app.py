"""Kumtas imar API: production-facing wrapper around unchanged working automation."""
import asyncio
import os
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from app_sadece_tkgm_duzeltildi import app

ORIGINS = {
    "https://xn--kentseldnm-lcb7ea99k.com.tr",
    "https://www.xn--kentseldnm-lcb7ea99k.com.tr",
    "https://kentseldönüşüm.com.tr",
    "https://www.kentseldönüşüm.com.tr",
}
# Optional override: comma-separated browser origins, without trailing slash.
ORIGINS.update(x.strip().rstrip("/") for x in os.getenv("IMAR_ALLOWED_ORIGINS", "").split(",") if x.strip())
_buckets = defaultdict(deque)
_gate = asyncio.Semaphore(1)

@app.get("/health")
async def health():
    return {"ok": True, "service": "imar", "supported": ["kadikoy"]}

@app.middleware("http")
async def protection(request: Request, call_next):
    if request.method == "OPTIONS" or (request.method == "GET" and request.url.path == "/health"):
        return await call_next(request)
    # Gateway requests use a server-side shared secret; never expose it in browser JS.
    secret = os.getenv("IMAR_GATEWAY_SECRET", "")
    if not secret:
        return JSONResponse(status_code=503, content={"detail": "Backend gateway secret is not configured"})
    import hmac
    if not hmac.compare_digest(request.headers.get("x-imar-gateway-key", ""), secret):
        return JSONResponse(status_code=403, content={"detail": "Gateway authentication required"})
    if request.url.path != "/sorgula" or request.method != "POST":
        return await call_next(request)
    origin = request.headers.get("origin")
    if origin and origin.rstrip("/") not in ORIGINS:
        return JSONResponse(status_code=403, content={"detail": "Bu web sitesi için izin yok"})
    # Limiting by IP is a coarse abuse guard, not user authentication.
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "unknown")
    now = time.monotonic()
    bucket = _buckets[ip]
    while bucket and now - bucket[0] > 60:
        bucket.popleft()
    if len(bucket) >= 3:
        return JSONResponse(status_code=429, content={"detail": "Bir dakika içinde en fazla 3 sorgu yapılabilir"})
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"detail": "Geçersiz sorgu"})
    if not isinstance(body, dict):
        return JSONResponse(status_code=400, content={"detail": "Geçersiz sorgu"})
    source = str(body.get("kaynak", "belediye")).lower()
    district = str(body.get("ilce", "")).strip().casefold()
    if source != "belediye":
        return JSONResponse(status_code=400, content={"detail": "Bilinmeyen sorgu kaynağı"})
    if source == "belediye" and district != "kadıköy":
        return JSONResponse(status_code=422, content={"detail": "Otomatik e-İmar şu anda yalnızca Kadıköy için hazır"})
    if not all(str(body.get(k,"")).isdigit() and len(str(body[k])) <= 10 for k in ("ada", "parsel")):
        return JSONResponse(status_code=422, content={"detail": "Ada ve parsel numaraları geçersiz"})
    # Crucial: forbid arbitrary URL navigation (SSRF via Playwright).
    body["url"] = None
    request._body = __import__("json").dumps(body,ensure_ascii=False).encode("utf-8")
    bucket.append(now)
    async with _gate:
        return await call_next(request)
