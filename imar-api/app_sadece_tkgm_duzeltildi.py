import asyncio
import re
import sys
import uuid
from pathlib import Path
from typing import Optional

if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from playwright.async_api import async_playwright
from pydantic import BaseModel

app = FastAPI(title="YAKUT İmar & Parsel Otomasyonu")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

SHOT_DIR = Path("screenshots")
SHOT_DIR.mkdir(exist_ok=True)
app.mount("/shots", StaticFiles(directory=str(SHOT_DIR)), name="shots")


class SorguIstegi(BaseModel):
    kaynak: str = "belediye"
    url: Optional[str] = None
    il: Optional[str] = None
    ilce: Optional[str] = None
    mahalle: Optional[str] = None
    ada: str
    parsel: str


def tr_normalize(metin: str) -> str:
    if not metin:
        return ""
    metin = metin.lower().replace("i̇", "i")
    donusum = str.maketrans("çğıöşü", "cgiosu")
    return re.sub(r"\s+", " ", metin.translate(donusum)).strip()


def temiz_deger(val: str) -> str:
    val = re.sub(r"\s+", " ", val or "").strip(" .;|:-")
    val = re.sub(r"\s*\(.*?\)", "", val).strip()
    return val


async def sayfa_sabitlenmesini_bekle(page, bekleme_ms: int = 1500):
    await page.wait_for_timeout(bekleme_ms)
    onceki_url = ""
    for _ in range(10):
        try:
            suanki_url = page.url or ""
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
            await page.wait_for_timeout(400)
            if suanki_url == onceki_url:
                return
            onceki_url = suanki_url
        except Exception:
            await page.wait_for_timeout(500)


async def guvenli_body_metni_al(page) -> str:
    await sayfa_sabitlenmesini_bekle(page, 800)
    for _ in range(10):
        try:
            txt = await page.evaluate(
                """() => {
                    if (!document || !document.body) return '';
                    return document.body.innerText || document.body.textContent || '';
                }"""
            )
            if txt and txt.strip():
                return txt
        except Exception:
            pass
        await page.wait_for_timeout(500)
    return ""


def imar_yorumu_uret(metin: str, req: SorguIstegi) -> str:
    mahalle_str = (req.mahalle or "").strip()
    ilce_str = (req.ilce or "").strip()
    baslik_konum = " ".join([p for p in [ilce_str, mahalle_str] if p]).strip()
    ada_parsel_str = f"{req.ada} ada {req.parsel} parsel"

    if not metin or len(metin.strip()) < 20:
        return f"{baslik_konum} {ada_parsel_str} için imar verisi okunamadı."

    fonksiyon = ""
    m_fonk = re.search(
        r"Plan Fonksiyon\s*\n+\s*([^\n]+)", metin, flags=re.IGNORECASE
    )
    if m_fonk:
        aday_fonk = temiz_deger(m_fonk.group(1))
        if aday_fonk and "yapılaşma koşulları" not in tr_normalize(aday_fonk):
            fonksiyon = aday_fonk

    durum_notu = ""
    if "boş arsa" in tr_normalize(metin):
        durum_notu = "kayıtlarda boş arsa olarak görünüyor"

    alan = ""
    m_alan = re.search(
        r"Parsel Alanı(?:\s*\(\d+\))?\s*\n+\s*([0-9.,]+\s*m²)",
        metin,
        flags=re.IGNORECASE,
    )
    if m_alan:
        alan = temiz_deger(m_alan.group(1))

    nizam = ""
    m_nizam = re.search(
        r"İnşaat Nizamı\s*\n+\s*([^\n]+)", metin, flags=re.IGNORECASE
    )
    if m_nizam:
        nizam = temiz_deger(m_nizam.group(1))

    taks = ""
    m_taks = re.search(
        r"T\.?A\.?K\.?S\.?\s*\n+\s*(?:max\s*)?TAKS\s*[:\-]?\s*([0-9.,]+)",
        metin,
        flags=re.IGNORECASE,
    )
    if m_taks:
        taks = temiz_deger(m_taks.group(1))

    kaks = ""
    m_kaks = re.search(
        r"K\.?A\.?K\.?S\.?\s*\n+\s*(?:max\s*)?(?:KAKS|Emsal)\s*[:\-]?\s*([0-9.,]+)",
        metin,
        flags=re.IGNORECASE,
    )
    if m_kaks:
        kaks = temiz_deger(m_kaks.group(1))

    yencok = ""
    m_yuk = re.search(
        r"Bina Yüksekliği\s*\n+\s*([^\n]+)", metin, flags=re.IGNORECASE
    )
    if m_yuk:
        yencok = temiz_deger(m_yuk.group(1))

    parcalar = []
    if alan:
        parcalar.append(f"parsel alanı {alan}")
    if fonksiyon:
        parcalar.append(f"plan fonksiyonu {fonksiyon}")
    if durum_notu:
        parcalar.append(durum_notu)
    if nizam:
        parcalar.append(f"nizam {nizam}")
    if taks:
        parcalar.append(f"TAKS {taks}")
    if kaks:
        parcalar.append(f"KAKS {kaks}")
    if yencok:
        parcalar.append(f"yükseklik {yencok}")

    giris = f"{baslik_konum} " if baslik_konum else ""
    if not parcalar:
        return f"{giris}{ada_parsel_str} için imar sayfası açıldı; detayları ekrandan inceleyebilirsiniz."

    return (
        f"{giris}{ada_parsel_str} imar özeti: "
        + ", ".join(parcalar)
        + ". Parsel ve harita görünümü ekrana aktarıldı."
    )


async def captcha_kontrol(page) -> bool:
    await sayfa_sabitlenmesini_bekle(page, 1500)
    belirtiler = [
        "captcha",
        "recaptcha",
        "hcaptcha",
        "turnstile",
        "guvenlik kodu",
        "dogrulama",
    ]
    for _ in range(8):
        try:
            metin = await page.evaluate(
                """() => {
                    if (!document || !document.body) return '';
                    return document.body.innerText || '';
                }"""
            )
            if metin:
                norm = tr_normalize(metin)
                return any(b in norm for b in belirtiler)
        except Exception:
            pass
        await page.wait_for_timeout(500)
    return False


async def adres_eslesen_sonucu_sec(page, req: SorguIstegi):
    if not req.mahalle and not req.ilce:
        return

    hedef_mahalle = tr_normalize(req.mahalle or "")
    hedef_ilce = tr_normalize(req.ilce or "")
    hedef_ada_parsel = tr_normalize(f"{req.ada}/{req.parsel}")

    adaylar = page.locator("div, li, tr, button, a, span")
    toplam = await adaylar.count()

    en_iyi_skor = 0
    en_iyi_loc = None

    for i in range(min(toplam, 250)):
        loc = adaylar.nth(i)
        try:
            if not await loc.is_visible():
                continue
            metin = tr_normalize(await loc.inner_text())
            if not metin or len(metin) > 80:
                continue

            skor = 0
            if hedef_ada_parsel and hedef_ada_parsel in metin:
                skor += 10
            if hedef_mahalle and hedef_mahalle in metin:
                skor += 12
            if hedef_ilce and hedef_ilce in metin:
                skor += 5

            if skor >= 20 and skor >= en_iyi_skor:
                en_iyi_skor = skor
                en_iyi_loc = loc
        except Exception:
            continue

    if en_iyi_loc is not None:
        try:
            await en_iyi_loc.scroll_into_view_if_needed()
            await page.wait_for_timeout(300)
            await en_iyi_loc.click()
            await sayfa_sabitlenmesini_bekle(page, 2200)
        except Exception:
            pass


async def imar_durumu_butonuna_tikla(context, page):
    buton_kalibi = re.compile(
        r"\b(imar\s*durumu|imar\s*plan[iı]|plan\s*detay|imar\s*durumu\s*plan[iı]|plan[iı]\s*goster)\b",
        re.I,
    )

    adaylar = page.locator(
        "button, a, input[type='button'], input[type='submit'], div[role='button']"
    )
    toplam = await adaylar.count()

    for i in range(toplam):
        loc = adaylar.nth(i)
        try:
            if not await loc.is_visible():
                continue
            etiket = (await loc.inner_text()) or (await loc.get_attribute("value")) or ""
            if buton_kalibi.search(tr_normalize(etiket)):
                await loc.scroll_into_view_if_needed()
                await page.wait_for_timeout(400)
                try:
                    async with context.expect_page(timeout=4500) as yeni_sayfa_bilgi:
                        await loc.click()
                    yeni_sayfa = await yeni_sayfa_bilgi.value
                    await sayfa_sabitlenmesini_bekle(yeni_sayfa, 1800)
                    return yeni_sayfa
                except Exception:
                    await sayfa_sabitlenmesini_bekle(page, 1800)
                    return page
        except Exception:
            continue

    return page


async def iki_parca_ekran_goruntusu_al(page, kayit_id: str):
    """Mevcut çalışan sorguya dokunmadan harita ve kadastro bölümünü ayrı kaydeder."""
    from io import BytesIO
    from PIL import Image

    await sayfa_sabitlenmesini_bekle(page, 2000)
    parca1_adi = f"{kayit_id}_1.png"
    parca2_adi = f"{kayit_id}_2.png"
    parca1_yolu = SHOT_DIR / parca1_adi
    parca2_yolu = SHOT_DIR / parca2_adi

    # İlk görüntünün davranışı orijinal dosyadakiyle aynı kalır.
    await page.mouse.move(10, 10)
    await page.evaluate("window.scrollTo(0, 140)")
    await page.wait_for_timeout(600)
    await page.screenshot(path=str(parca1_yolu), full_page=False)

    # Raporun tüm sayfasını al. Sadece pencereyi görüntülemek iki kez
    # üst kısmın çıkmasına neden oluyordu. Tam sayfa görüntüsünden kesiyoruz.
    await page.evaluate("window.scrollTo(0, 0)")
    await page.wait_for_timeout(650)
    konum = await page.evaluate(r"""() => {
      const norm = s => (s || '').replace(/\s+/g,' ').trim().toLocaleUpperCase('tr-TR');
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!norm(node.nodeValue).includes('KADASTRO PARSELİ')) continue;
        const el = node.parentElement;
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) continue;
        let scroller = el.parentElement;
        while (scroller && scroller !== document.body) {
          const css = getComputedStyle(scroller);
          if (/(auto|scroll)/.test(css.overflowY) && scroller.scrollHeight > scroller.clientHeight+20) break;
          scroller = scroller.parentElement;
        }
        const innerScroll = scroller && scroller !== document.body;
        return {
          y: Math.max(0, rect.top + window.scrollY),
          x: Math.max(0, rect.left + window.scrollX),
          innerScroll
        };
      }
      return null;
    }""")
    if not konum:
        raise RuntimeError("KADASTRO PARSELİ başlığı bulunamadı; ikinci görüntü yerine yanlış harita kaydedilmedi.")

    full_bytes = await page.screenshot(full_page=True)
    with Image.open(BytesIO(full_bytes)) as all_image:
        full = all_image.convert("RGB")
        upper = max(0, int(konum['y']) - 30)
        if not konum['innerScroll'] and upper < full.height - 100:
            # Başlıktan sonraki tüm kadastro ve yapılaşma satırlarını kapsa.
            bottom = min(full.height, upper + 2400)
            crop = full.crop((0, upper, full.width, bottom))
            crop.save(parca2_yolu)
        else:
            # Site içte kaydırılabilen bir rapor kullanıyorsa iç paneli
            # başlığa kadar kaydırarak görünür pencereyi yakala.
            await page.evaluate(r"""() => {
              const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
              let node;
              while((node=walker.nextNode())) {
                if(!((node.nodeValue||'').toLocaleUpperCase('tr-TR').includes('KADASTRO PARSELİ'))) continue;
                const el=node.parentElement;
                let a=el;
                while(a && a!==document.body) {
                  const css=getComputedStyle(a);
                  if (/(auto|scroll)/.test(css.overflowY) && a.scrollHeight>a.clientHeight+20) {
                    const target=el.getBoundingClientRect();
                    const box=a.getBoundingClientRect();
                    a.scrollTop+=target.top-box.top-25;
                    return;
                  }
                  a=a.parentElement;
                }
                el.scrollIntoView({block:'start'});
                return;
              }
            }""")
            await page.wait_for_timeout(800)
            await page.screenshot(path=str(parca2_yolu), full_page=False)

    # İki görüntünün birebir aynı olmasına izin verme.
    with Image.open(parca1_yolu) as im1, Image.open(parca2_yolu) as im2:
        if im1.size == im2.size and im1.tobytes() == im2.tobytes():
            parca2_yolu.unlink(missing_ok=True)
            raise RuntimeError("Kadastro için ayrı bölüm yakalanamadı; ilk görüntü tekrarlanmadı.")

    ana_yolu = SHOT_DIR / f"{kayit_id}.png"
    ana_yolu.write_bytes(parca1_yolu.read_bytes())
    return f"/shots/{parca1_adi}", f"/shots/{parca2_adi}"


async def genel_form_doldur(context, page, req: SorguIstegi):
    sekme_adaylari = [
        page.get_by_text("Ada/Parsel", exact=False),
        page.locator("button, a, div, li, span").filter(
            has_text=re.compile(r"Ada\s*/\s*Parsel", re.I)
        ),
    ]
    for loc in sekme_adaylari:
        if await loc.count() > 0:
            try:
                await loc.first.click()
                await page.wait_for_timeout(1000)
                break
            except Exception:
                pass

    if req.mahalle:
        select_sayisi = await page.locator("select").count()
        for i in range(select_sayisi):
            sel = page.locator("select").nth(i)
            if await sel.is_visible():
                try:
                    await sel.select_option(label=str(req.mahalle))
                    await page.wait_for_timeout(1000)
                    break
                except Exception:
                    try:
                        opsiyonlar = await sel.locator("option").all_inner_texts()
                        for opt in opsiyonlar:
                            if tr_normalize(req.mahalle) in tr_normalize(opt):
                                await sel.select_option(label=opt.strip())
                                await page.wait_for_timeout(1000)
                                break
                    except Exception:
                        pass

    birlesik_deger = f"{req.ada}/{req.parsel}".strip("/")
    birlesik_seciciler = [
        "input[placeholder*='Ada/Parsel' i]",
        "input[placeholder*='111/4' i]",
        "input[name*='adaparsel' i]",
        "input[name*='ada_parsel' i]",
        "input[id*='adaparsel' i]",
        "input[id*='ada_parsel' i]",
    ]
    birlesik_dolduruldu = False
    for sel in birlesik_seciciler:
        loc = page.locator(sel).first
        if await loc.count() > 0 and await loc.is_visible():
            await loc.fill(birlesik_deger)
            birlesik_dolduruldu = True
            break

    if not birlesik_dolduruldu:
        aday_alanlar = [
            (["ada", "parcel_ada", "adaNo", "ada_no"], req.ada),
            (["parsel", "parcel_no", "parselNo", "parsel_no"], req.parsel),
        ]
        for anahtarlar, deger in aday_alanlar:
            if not deger:
                continue
            for anahtar in anahtarlar:
                seciciler = [
                    f"input[name*='{anahtar}' i]",
                    f"input[id*='{anahtar}' i]",
                    f"input[placeholder*='{anahtar}' i]",
                ]
                dolduruldu = False
                for sel in seciciler:
                    loc = page.locator(sel).first
                    if await loc.count() > 0 and await loc.is_visible():
                        await loc.fill(str(deger))
                        dolduruldu = True
                        break
                if dolduruldu:
                    break

    tamam_btn = page.locator("button:has-text('Tamam'), input[type='button'][value='Tamam']").first
    if await tamam_btn.count() > 0 and await tamam_btn.is_visible():
        try:
            await tamam_btn.click()
            await page.wait_for_timeout(500)
        except Exception:
            pass

    buton_seciciler = [
        "button:has-text('Ara')",
        "button:has-text('Sorgula')",
        "button:has-text('Göster')",
        "input[type='submit'][value*='Ara' i]",
        "input[type='submit'][value*='Sorgula' i]",
    ]
    for bsel in buton_seciciler:
        bloc = page.locator(bsel).first
        if await bloc.count() > 0 and await bloc.is_visible():
            await bloc.click()
            await sayfa_sabitlenmesini_bekle(page, 2500)
            break

    await adres_eslesen_sonucu_sec(page, req)
    aktif_sayfa = await imar_durumu_butonuna_tikla(context, page)
    return aktif_sayfa


@app.post("/sorgula")
async def parsel_sorgula(req: SorguIstegi):
    hedef_url = req.url or (
        "https://parselsorgu.tkgm.gov.tr/"
        if req.kaynak.lower() == "tkgm"
        else "https://webgis.kadikoy.bel.tr/imardurumu/"
    )

    kayit_id = str(uuid.uuid4())[:8]

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 960},
            locale="tr-TR",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
        )
        page = await context.new_page()

        try:
            await page.goto(hedef_url, wait_until="domcontentloaded", timeout=25000)
            await page.wait_for_timeout(2000)

            aktif_sayfa = await genel_form_doldur(context, page, req)
            captcha_var = await captcha_kontrol(aktif_sayfa)

            parca1_url, parca2_url = await iki_parca_ekran_goruntusu_al(aktif_sayfa, kayit_id)
            ham_metin = await guvenli_body_metni_al(aktif_sayfa)
            temiz_metin = re.sub(r"\n{3,}", "\n\n", ham_metin).strip()
            yorum = imar_yorumu_uret(temiz_metin, req)

            return {
                "id": kayit_id,
                "url": aktif_sayfa.url,
                "captcha_tespit_edildi": captcha_var,
                "goruntu_sayfasi": f"/goruntu/{kayit_id}",
                "ekran_goruntusu_url": parca1_url,
                "ekran_goruntusu_parca_1": parca1_url,
                "ekran_goruntusu_parca_2": parca2_url,
                "yorum": yorum,
                "metin_ozeti": yorum,
            }
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Otomasyon hatası: {exc}")
        finally:
            await browser.close()


@app.get("/goruntu/{kayit_id}", response_class=HTMLResponse)
async def goruntu_sayfasi(kayit_id: str):
    if not re.fullmatch(r"[a-zA-Z0-9_-]+", kayit_id):
        raise HTTPException(status_code=400, detail="Geçersiz ID")

    p1 = SHOT_DIR / f"{kayit_id}_1.png"
    p2 = SHOT_DIR / f"{kayit_id}_2.png"
    ana = SHOT_DIR / f"{kayit_id}.png"

    if not p1.exists() and not ana.exists():
        raise HTTPException(status_code=404, detail="Ekran görüntüsü bulunamadı")

    img1_src = f"/shots/{kayit_id}_1.png" if p1.exists() else f"/shots/{kayit_id}.png"
    img2_html = (
        f"""
        <div class="card">
          <div class="card-title">2. Parça — Kadastro Parseli ve Yapılaşma Bilgileri</div>
          <div class="viewer">
            <img class="zoom-img" src="/shots/{kayit_id}_2.png" alt="Kadastro Parseli ve Bilgiler" onclick="toggleZoom(this)" />
          </div>
          <div class="links"><a href="/shots/{kayit_id}_2.png" target="_blank">Tam Boyut 2. Görseli Aç</a></div>
        </div>
        """
        if p2.exists()
        else ""
    )

    return f"""
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>YAKUT - İmar & Kadastro Görüntüleri ({kayit_id})</title>
      <style>
        body {{ font-family: Arial, sans-serif; background: #0f1117; color: #f5f5f5; margin: 0; padding: 20px; }}
        .box {{ max-width: 1440px; margin: 0 auto; }}
        .toolbar {{
          position: sticky; top: 10px; z-index: 50;
          background: rgba(24, 28, 38, 0.96); border: 1px solid #2e3548;
          padding: 12px 16px; border-radius: 10px; margin-bottom: 18px;
          display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;
        }}
        .btn-group {{ display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }}
        button {{
          background: #1f2636; color: #ffd166; border: 1px solid #c59b27;
          padding: 7px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;
        }}
        button:hover {{ background: #2c354b; }}
        .zoom-label {{ font-weight: bold; color: #e2e8f0; min-width: 54px; text-align: center; }}
        .card {{
          background: #161a24; border: 1px solid #262d3d; border-radius: 10px;
          padding: 14px; margin-bottom: 22px;
        }}
        .card-title {{ font-weight: bold; color: #ffd166; margin-bottom: 10px; text-align: left; }}
        .viewer {{
          overflow: auto; width: 100%; background: #0b0d12; border-radius: 8px; padding: 12px;
          box-sizing: border-box;
        }}
        img.zoom-img {{
          width: var(--zoom, 100%); height: auto; display: block; margin: 0 auto;
          border: 2px solid #c59b27; border-radius: 6px; cursor: zoom-in;
        }}
        .links {{ margin-top: 8px; text-align: right; }}
        a {{ color: #93c5fd; text-decoration: none; font-size: 13px; }}
      </style>
    </head>
    <body>
      <div class="box">
        <div class="toolbar">
          <div><strong>YAKUT İmar & Kadastro Ekranı</strong> — Kayıt: <code>{kayit_id}</code></div>
          <div class="btn-group">
            <button onclick="changeZoom(-15)">Küçült (-)</button>
            <span class="zoom-label" id="zoomPct">100%</span>
            <button onclick="changeZoom(15)">Büyüt (+)</button>
            <button onclick="setZoom(100)">Sıfırla (100%)</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">1. Parça — İmar Planı ve Parsel Haritası</div>
          <div class="viewer">
            <img class="zoom-img" src="{img1_src}" alt="İmar Planı ve Harita" onclick="toggleZoom(this)" />
          </div>
          <div class="links"><a href="{img1_src}" target="_blank">Tam Boyut 1. Görseli Aç</a></div>
        </div>

        {img2_html}
      </div>

      <script>
        let currentZoom = 100;
        function setZoom(val) {{
          currentZoom = Math.max(50, Math.min(220, val));
          document.documentElement.style.setProperty('--zoom', currentZoom + '%');
          document.getElementById('zoomPct').textContent = currentZoom + '%';
        }}
        function changeZoom(delta) {{
          setZoom(currentZoom + delta);
        }}
        function toggleZoom(img) {{
          setZoom(currentZoom >= 145 ? 100 : currentZoom + 30);
        }}
      </script>
    </body>
    </html>
    """