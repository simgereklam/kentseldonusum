"""Kumtas imar API: production-facing wrapper around unchanged working automation."""
import asyncio
import logging
import os
import socket
import ssl
import time
import uuid
from collections import defaultdict, deque

from fastapi import HTTPException, Request
from fastapi.exception_handlers import http_exception_handler
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from playwright.async_api import Error as PlaywrightError, async_playwright
from app_sadece_tkgm_duzeltildi import SHOT_DIR, app, tr_normalize

MUNICIPAL_URLS = {
    "kadıköy": "https://webgis.kadikoy.bel.tr/imardurumu/",
    "bağcılar": "https://bbgis.bagcilar.bel.tr/imardurumu/",
    "fatih": "https://kentrehberi.fatih.bel.tr/webgis/",
}

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
logger = logging.getLogger("uvicorn.error")


@app.exception_handler(StarletteHTTPException)
async def log_automation_failure(request: Request, exc: StarletteHTTPException):
    if request.url.path == "/sorgula" and exc.status_code >= 500:
        logger.error("İmar sorgusu başarısız (%s): %.1500s", exc.status_code, exc.detail)
    return await http_exception_handler(request, exc)

@app.get("/health")
async def health():
    return {"ok": True, "service": "imar", "supported": ["kadikoy", "bagcilar", "fatih", "tkgm"]}


def bagcilar_baglanti_kontrolu():
    host = "bbgis.bagcilar.bel.tr"
    stage = "DNS"
    try:
        addresses = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
        logger.info("Bağcılar bağlantı kontrolü: DNS başarılı, %s adres", len(addresses))
        stage = "TCP"
        with socket.create_connection((host, 443), timeout=4) as conn:
            stage = "TLS"
            with ssl.create_default_context().wrap_socket(conn, server_hostname=host) as tls:
                logger.info("Bağcılar bağlantı kontrolü: TCP ve TLS başarılı (%s)", tls.version())
    except OSError as exc:
        logger.warning("Bağcılar bağlantı kontrolü: %s | %s", stage, exc)


async def sorgula_bagcilar(body):
    ada, parsel = str(body["ada"]), str(body["parsel"])
    mahalle = tr_normalize(str(body.get("mahalle") or ""))
    rapor_basligi = "KADASTRO PARSEL KONUM BİLGİSİ"
    kayit_id = uuid.uuid4().hex[:8]

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        phase = "sayfa oluşturma"
        try:
            page = await browser.new_page(viewport={"width": 1440, "height": 960}, locale="tr-TR")
            page.set_default_timeout(12000)
            phase = "belediye adresine bağlantı"
            response = await page.goto(MUNICIPAL_URLS["bağcılar"], wait_until="commit", timeout=40000)
            if response is None or not response.ok:
                upstream_status = response.status if response is not None else "yanıt yok"
                logger.error("Bağcılar e-İmar belediye adresi HTTP: %s", upstream_status)
                return JSONResponse({"detail": "Bağcılar Belediyesi e-İmar ekranı açılmadı."}, status_code=502)
            phase = "Ada/Parsel formu"
            await page.get_by_role("tab", name="Ada/Parsel", exact=True).click(timeout=40000)
            await page.locator("#txtAda").fill(ada)
            await page.locator("#txtParsel").fill(parsel)
            await page.locator("#btnAdaParselSearch").click()

            phase = "parsel sonuç listesi"
            await page.locator("[role=status]").wait_for(state="visible")
            rows = page.locator(".result-item")
            if not await rows.count():
                return JSONResponse({"detail": "Bağcılar e-İmar bu ada ve parsel için sonuç döndürmedi."}, status_code=404)
            matches = []
            for row in await rows.all():
                lines = (await row.inner_text()).splitlines()
                if lines and lines[0].strip() == f"{ada}/{parsel}" and (
                    not mahalle or any(tr_normalize(line) == mahalle for line in lines[1:])
                ):
                    matches.append(row)
            if len(matches) != 1:
                return JSONResponse({"detail": "Bağcılar e-İmar sonucunda mahalle ve parsel eşleşmesi tekil değil. Mahalle adını kontrol edin."}, status_code=422)

            phase = "seçilen parselin imar raporu"
            await matches[0].click()
            await page.get_by_role("button", name="İmar Durumu", exact=True).click()
            await page.wait_for_url("**/imardurumu/imar.aspx?**", wait_until="domcontentloaded")
            heading = page.get_by_text(rapor_basligi, exact=True)
            await heading.wait_for(state="visible")
            phase = "rapor görselleri"
            sohbet_kapat = page.get_by_role("button", name="×", exact=True).first
            if await sohbet_kapat.is_visible():
                await sohbet_kapat.click(timeout=3500)
                await sohbet_kapat.wait_for(state="hidden", timeout=3500)
            first, second = f"{kayit_id}_1.png", f"{kayit_id}_2.png"
            await page.screenshot(path=str(SHOT_DIR / first))
            await heading.evaluate("(el) => el.scrollIntoView({block: 'start'})")
            await page.screenshot(path=str(SHOT_DIR / second))
            return JSONResponse({
                "id": kayit_id,
                "url": page.url,
                "ekran_goruntusu_url": f"/shots/{first}",
                "ekran_goruntusu_parca_1": f"/shots/{first}",
                "ekran_goruntusu_parca_2": f"/shots/{second}",
                "yorum": f"Bağcılar / {body.get('mahalle') or ''} — {ada} ada {parsel} parsel. Belediye imar raporu açıldı.",
            })
        except PlaywrightError as exc:
            logger.error("Bağcılar e-İmar aşaması: %s | %s: %.1000s", phase, type(exc).__name__, str(exc))
            if phase == "belediye adresine bağlantı":
                try:
                    await asyncio.wait_for(asyncio.to_thread(bagcilar_baglanti_kontrolu), timeout=9)
                except TimeoutError:
                    logger.warning("Bağcılar bağlantı kontrolü 9 saniyede tamamlanmadı")
            return JSONResponse({"detail": f"Bağcılar e-İmar işlemi şu aşamada durdu: {phase}."}, status_code=502)
        finally:
            await browser.close()


async def sorgula_fatih(body):
    ada, parsel = str(body["ada"]), str(body["parsel"])
    kayit_id = uuid.uuid4().hex[:8]
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        try:
            page = await browser.new_page(viewport={"width": 1440, "height": 960}, locale="tr-TR")
            page.set_default_timeout(15000)
            response = await page.goto(MUNICIPAL_URLS["fatih"], wait_until="commit", timeout=35000)
            if response is None or not response.ok:
                logger.error("Fatih Kent Rehberi HTTP: %s", response.status if response else "yanıt yok")
                return JSONResponse({"detail": "Fatih Kent Rehberi açılmadı."}, status_code=502)
            await page.locator("#liImar").click(timeout=25000)
            await page.get_by_role("tab", name="Parsel Sorgu").click()
            await page.locator("#txtAda").fill(ada)
            await page.locator("#txtParsel").fill(parsel)
            secim = page.locator('svg path[fill="rgb(60, 110, 234)"][stroke="rgb(181, 18, 24)"]')
            await secim.wait_for(state="hidden")
            await page.get_by_text("Bul", exact=True).click()
            await secim.wait_for(state="visible")
            await page.wait_for_function("""() => [...document.images].some(img =>
                img.src.includes('/ImarPlaniV1/MapServer/tile/') &&
                img.complete && img.naturalWidth > 0 && img.getBoundingClientRect().width > 0
            )""")
            dosya = f"{kayit_id}_1.png"
            await page.screenshot(path=str(SHOT_DIR / dosya))
            return JSONResponse({
                "id": kayit_id,
                "url": page.url,
                "ekran_goruntusu_url": f"/shots/{dosya}",
                "ekran_goruntusu_parca_1": f"/shots/{dosya}",
                "yorum": f"Fatih {ada} ada {parsel} parseli Kent Rehberi imar planında işaretlendi.",
            })
        finally:
            await browser.close()


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
    if source not in ("belediye", "tkgm"):
        return JSONResponse(status_code=400, content={"detail": "Bilinmeyen sorgu kaynağı"})
    if source == "belediye" and district not in MUNICIPAL_URLS:
        return JSONResponse(status_code=422, content={"detail": "Otomatik e-İmar şu anda Kadıköy, Bağcılar ve Fatih için hazır"})
    if not all(str(body.get(k,"")).isdigit() and len(str(body[k])) <= 10 for k in ("ada", "parsel")):
        return JSONResponse(status_code=422, content={"detail": "Ada ve parsel numaraları geçersiz"})
    # Crucial: forbid arbitrary URL navigation (SSRF via Playwright).
    body["url"] = MUNICIPAL_URLS.get(district) if source == "belediye" else None
    request._body = __import__("json").dumps(body,ensure_ascii=False).encode("utf-8")
    bucket.append(now)
    async with _gate:
        if source == "belediye" and district == "fatih":
            try:
                return await sorgula_fatih(body)
            except PlaywrightError as exc:
                logger.error("Fatih Kent Rehberi sorgusu başarısız: %.1200s", str(exc))
                return JSONResponse({"detail": "Fatih imar planında parsel görüntüsü alınamadı."}, status_code=502)
        if source == "belediye" and district == "bağcılar":
            try:
                return await sorgula_bagcilar(body)
            except PlaywrightError as exc:
                logger.error("Bağcılar e-İmar otomasyonu başarısız: %.1500s", str(exc))
                return JSONResponse({"detail": "Bağcılar e-İmar raporu açılırken tarayıcı hatası oluştu."}, status_code=502)
        return await call_next(request)
