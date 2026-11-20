# Yakut Bağcılar e-İmar denemesi

Docker imajını depo kökünden `docker build -t yakut-imar scripts` ile oluşturun.
Konteyner 8080 numaralı portta çalışır. HTTPS erişimini barındırma hizmeti sağlamalı.
`YAKUT_WEB_ORIGIN` izin verilen web sitesi adresini ayarlar ve varsayılanı Kumtaş'ın canlı adresidir.

Sorgu adresi `GET /imar/bagcilar?ada=0&parsel=2135&mahalle=Kirazl%C4%B1` biçimindedir.
Canlı belediye sorgusu doğrulandıktan sonra test sayfasına
`<meta name="yakut-imar-service" content="https://SUNUCU_ADRESI">` eklenebilir.
Bağlantı yoksa Yakut mevcut belediye ekranını kullanır.
