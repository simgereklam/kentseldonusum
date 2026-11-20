"""YAKUT e-İmar tarayıcı keşif servisi (kimlik doğrulamasız, salt-okunur).
Kurulum: pip install -r requirements.txt && playwright install chromium
Başlatma: uvicorn server:app --host 127.0.0.1 --port 8000
Bu servis e-Devlet kimlik doğrulamasını otomatikleştirmez ve imar verisi uydurmaz.
"""
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from playwright.async_api import async_playwright

app = FastAPI(title="YAKUT e-İmar keşif API")
ALLOWED = {"bagcilar": "https://www.turkiye.gov.tr/bagcilar-belediyesi-imar-durum-sorgulama"}
class Parcel(BaseModel):
    district: str = "bagcilar"
    ada: int = Field(ge=1, le=999999999)
    parsel: int = Field(ge=1, le=999999999)

@app.get("/health")
async def health():
    return {"status": "ok", "mode": "discovery_only"}

@app.post("/inspect")
async def inspect(parcel: Parcel):
    if parcel.district not in ALLOWED:
        raise HTTPException(400, "Bu ilçe henüz desteklenmiyor")
    url = ALLOWED[parcel.district]
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True, args=["--no-sandbox"])
            try:
                page = await browser.new_page()
                response = await page.goto(url, wait_until="domcontentloaded", timeout=20000)
                title = await page.title()
                current_url = page.url
                # e-Devlet sayfası için otomatik giriş veya kişisel veri okuma yok.
                return {"source":url,"opened_url":current_url,"http_status":response.status if response else None,
                        "page_title":title,"ada":parcel.ada,"parsel":parcel.parsel,
                        "parcel_data_verified":False,
                        "message":"Kaynak sayfa açılışı denetlendi. Parsel imar bilgileri otomatik doğrulanmadı."}
            finally:
                await browser.close()
    except Exception as exc:
        raise HTTPException(502, "Resmî sayfa tarayıcıyla açılamadı") from exc
