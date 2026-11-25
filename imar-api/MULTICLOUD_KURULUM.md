# İstanbul e-İmar / TKGM multi-cloud deneme altyapısı

## Mevcut durum
- Orijinal çalışan Python kodu **değiştirilmedi**: `imar-api/app_sadece_tkgm_duzeltildi.py`.
- GitHub Actions testi Kadıköy Erenköy 1402 ada 34 parsel için **iki resim** ve `response.json` üretti: https://github.com/simgereklam/kentseldonusum/actions/runs/45674546860
- `imar-api/modal_app.py` Modal için kodu hazırlar.
- `imar-api/Dockerfile` ve `imar-api/web_app.py` Cloud Run için kullanılır.
- `imar-gateway/worker.mjs` iki gerçek HTTPS API adresi verildikten sonra sıralı deneme / hata halinde geçiş yapar.
- **Bu dosyalar kendiliğinden Modal / Cloud Run / Cloudflare üzerinde hizmet oluşturmaz.**
- GitHub Actions, anında HTTP yanıtı döndüren üçüncü bir sunucu değildir; yalnızca manuel/planlı test veya daha sonra geliştirilecek asenkron kuyruk işidir.

## Modal (hesap açılması gerekir)
1. Modal hesabında web uygulaması dağıtımına izin verildiğini doğrula. Kullanımı/kredi şartlarını kontrol et.
2. Geliştirici ortamında `imar-api` dizininden `python -m pip install modal`; `modal setup`.
3. Modal hesabında `kumtas-imar-gateway` isimli bir secret oluştur; `IMAR_GATEWAY_SECRET` adında **güçlü, rastgele**, benzersiz anahtar koy. Bu anahtarın aynısı Cloud Run ve Cloudflare Gateway tarafında da kullanılır.
4. `modal deploy modal_app.py` çalıştır. HTTPS endpoint adresini kaydet. Modal uygulaması 2 CPU, 4 GB RAM, en çok bir konteyner kullanacak şekilde ayarlanmıştır.
5. `/health` adresi ile servis ve erişim kontrolü yap. Modal hesabı olmadan kod otomatik deploy edilemez.

## Google Cloud Run (Google Cloud hesabı ve faturalandırma etkinleştirmesi gerekir)
1. Cloud Run ve Cloud Build / Artifact Registry servislerini etkinleştir; maliyet uyarısı ve üst sınır politikaları ayarla. Ücretsiz kotayı aşan veya ek Google Cloud kaynaklarının kullanımı **ücret yaratabilir**.
2. `IMAR_GATEWAY_SECRET` değerini Google Secret Manager'da sakla ve Cloud Run servis hesabının bu sırrı okumasına izin ver.
3. Cloud SDK ile kök dizinden örnek kurulum:
```bash
gcloud run deploy kumtas-imar-backend \
  --source ./imar-api \
  --region europe-west1 \
  --memory 4Gi --cpu 2 \
  --concurrency 1 \
  --max-instances 1 --min-instances 0 \
  --timeout 180 \
  --allow-unauthenticated \
  --set-secrets IMAR_GATEWAY_SECRET=kumtas-imar-gateway:latest
```
4. HTTPS servis URL'sini kaydet. Kamuya açık URL, secret olmadan sorgu ve görsel erişimi vermez.

## Cloudflare yönlendirme Worker'ı
Bu Worker mevcut `yakut-chat` servisi ile **ayrı** oluşturulmalıdır. Herhangi bir Yakut kodu değiştirilmez.

```bash
cd imar-gateway
npx wrangler login
npx wrangler secret put IMAR_GATEWAY_SECRET
npx wrangler secret put MODAL_URL
npx wrangler secret put CLOUD_RUN_URL
npx wrangler deploy
```

- `MODAL_URL` / `CLOUD_RUN_URL` HTTPS servis taban adresleridir (sonunda `/sorgula` yok).
- En az bir URL ve ortak sır ayarlanmadan sorgu yapılamaz.
- Tarayıcıdan Worker'ın `/health` ve `/sorgula` adresleri kullanılabilir.
- Worker, iki hazır sağlayıcı arasında sırayla seçim yapar; 429/5xx/timeout durumunda diğerini dener.
- **GitHub Actions otomatik web fallback değildir**; onun için ayrıca kuyruk, görüntü saklama ve güvenli sonuç aktarımı gereklidir.
- Worker üzerinde kalıcı rate limit/captcha ve maliyet denetimi **henüz eklenmedi**. Gateway'i kullanıcıya açmadan önce Cloudflare WAF/Rate Limiting ve uygun erişim kontrolleri ayarlanmalıdır.
- Görüntüler şu an her sağlayıcının geçici dosya sisteminde tutuluyor. Soğuk başlangıç / ölçek değişimi nedeniyle görüntü kaybolabilir. Gerçek üretim kullanımı öncesi kalıcı nesne depolama (ör. R2) ya da cevapla birlikte görüntü aktarımı gereklidir.
- Mevcut `imar-sorgu-test.html` test formunda Python API adresini Gateway HTTPS taban adresiyle değiştirince sorgu/görseller kullanılabilir; otomatik hale getirmek için sadece bu test sayfası güncellenmelidir.
- Belediye sorgulama şu an yalnızca Kadıköy için, TKGM ise ayrı modül ile desteklenir; İstanbul'un 39 ilçesi henüz otomatik sorgulanamaz.

## Güvenlik / sonuç doğrulama
- Backend'de key doğrulama vardır ve rastgele hedef URL ile Playwright tarayıcı açılması engellenmiştir.
- HTML sayfasına ve GitHub deposuna asla anahtar / API token yazılmamalı.
- Sorgu gerçekte çalışsa bile raporun doğru ada-parsel olduğunu ayrıca kontrol etmeliyiz.
- Her iki platformda canlı gerçek parsel sorgusu, erişim anahtarları ve hizmet URL'leri alınmadan doğrulanamaz.
