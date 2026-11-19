# KUMTAŞ İnşaat – YAKUT entegrasyonu

YAKUT asistan kodu `yakut.js` dosyasında, mevcut siteden ayrı tutulur.
Ana sayfa, üst menü sayfaları ve tamamlanmış bölge sayfalarının kapanışına tek satır eklenmiştir:

```html
<script defer src="yakut/yakut.js"></script>
```

## Gerekli medya dosyaları

Klasöre ayrıca şu iki dosya konulunca sinematik açılış otomatik devreye girer:

- `YAKUT_V9.glb` — V9 dudak hareketleri ve Selam 2 içeren robot (yaklaşık 10 MB).
- `kumtas-acilis.mp4` — kullanıcının gönderdiği KUMTAŞ 3D altın logo açılış videosu (yaklaşık 15 MB).

Dosyalar olmadan sohbet butonu çalışır ancak 3D robot ve sinematik açılış **görünmez**. Bu güvenli geri dönüş sayesinde var olan site kapanmaz.

## Durum

- Temel sohbet ve örnek taban oturum hesabı eklendi.
- Gerçek canlı yapay zekâ API'si **henüz bağlanmadı**.
- Türkçe ses sentezi ve tarayıcı destekliyorsa ses tanıma kullanır.
- Robotun `greet_02` animasyonu 3D medya dosyası sunucuya yüklendiğinde kullanılır.
- Mevcut tasarıma dokunulmadı.

Eksik HTML kapanış etiketli Avcılar ve Esenler sayfalarına müdahale edilmedi.
