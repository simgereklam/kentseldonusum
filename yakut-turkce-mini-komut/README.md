# Yakut — Türkçe mini komut modeli hazırlığı

Durum: **Türkçe ses modeli henüz eğitilmedi. Bu dosya çalışan bir ses tanıyıcı değildir.**

Kaynak: https://github.com/hsiang26/tiny-keyword-spotting
Kaynak lisansı: GPL-3.0. Kod taşınmadan önce lisans yükümlülükleri incelenmelidir.

## Doğrulanan teknik sınır
Kaynak projenin hazır 47 KB modelleri İngilizce/Çince içindir. `run_all.py` Türkçe sözcükleri İngilizce sentez yoluna yönlendirir; yalnızca `--wake-word "sus"` yazmak doğru Türkçe modeli üretmez. Orijinal projedeki `docs/index.html` de İngilizce/Çince modellerin ağırlıklarını içerir.

## İstenen Türkçe sınıflar
- `sus`
- `dur`
- `devam et`
- `diğer` (normal konuşma, Yakut'un kendi sesi, müzik, sessizlik, yakın telaffuzlar)

## Eğitim ve doğrulama için yapılacak işler
1. Türkçe telaffuzlu ses örnekleri toplanmalı/üretilmeli. Özellikle gerçek kullanıcı konuşmaları ve farklı telefon mikrofonları temsil edilmeli.
2. Pozitif örnekler, yakın sesli negatif örnekler ve Yakut'un kadın TTS çıktısı ayrı tutulmalı. Eğitim/test örnekleri birbirine karıştırılmamalı.
3. Kaynağın MFCC + DS-CNN mimarisi kullanılarak üç ayrı küçük model veya tek çok-sınıflı model eğitilmeli.
4. Türkçe veriyle doğruluk, kaçırma ve yanlış tetikleme oranları ölçülmeli. Özellikle Yakut konuşurken ve Android Chrome üzerinde denenmeli.
5. Yalnızca doğrulanmış model ve gerekli JS kodu bu repodan sunulmalı. Dış CDN, dış model URL'si, harici ses API'si kullanılmamalı.
6. Masaüstündeki mevcut ses sistemi değiştirilmemeli; Android testinden önce `yakut-v9.js` içine entegrasyon yapılmamalı.

## Önemli
- Kullanıcı kurulum yapmaz; ancak tarayıcı JS/model dosyalarını kendi sitemizden almak zorundadır.
- Modelin 47 KB olması, toplam JavaScript ve ses işleme kodunun da 47 KB olacağı anlamına gelmez.
- Kaynağın kendi belgelerinde Türkçe desteği doğrulanmış değildir.
- Türkçe model dosyaları olmadan komut tanıma işlevi tamamlandı olarak gösterilmemelidir.
