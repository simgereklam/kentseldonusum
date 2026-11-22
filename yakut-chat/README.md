# YAKUT API Sunucusu — kurulum ve test

Bu klasör yalnızca API sunucusunu içerir. Site HTML/JS dosyalarına dokunulmaz.

## Uç noktalar

- GET /health: Anahtarların sunucuda ayarlı olup olmadığını boolean olarak bildirir, değerlerini göstermez.
- POST /chat: {question,reference,history,research}; dış bilgi sorularına Gemini yanıt verir. research=true ise önce Tavily, sonuç alınmazsa Firecrawl aranır ve arama metinleri Gemini'ye verilir. Gemini Google Search kapalıdır.
- POST /live: {readAloud}; Gemini Aoede TTS, 24kHz mono 16-bit PCM sesini NDJSON base64 formatında gönderir.

## Gizli anahtarlar ve dağıtım

Cloudflare hesabında yetkili terminalden `yakut-chat` klasörüne geçerek:

```bash
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put TAVILY_API_KEY
npx wrangler secret put FIRECRAWL_API_KEY
npx wrangler deploy
```

Gizli anahtarların değerlerini GitHub'a, `wrangler.toml` dosyasına veya site JavaScript'ine yazmayın. Sohbette paylaşılan API anahtarlarını yenileyin.

## Bağlantı uyarısı

Canlı site şu anda varsayılan olarak `https://kumtas-yakut-api.bloomyvanilla256.chatgpt.site/chat` adresine istek gönderiyor. `wrangler deploy` komutu bu alan adını otomatik olarak Cloudflare Worker'a bağlamaz. Mevcut alan adını yöneten altyapıda bir reverse proxy/route tanımlanmadan, site koduna dokunmadan yeni Workers URL'sine ulaşılmaz. Bu alan adı üzerinde yönetim yetkisi olmadan **sadece API kodu değiştirerek** canlı site bağlantısının düzeldiği iddia edilemez.

Canlı kontrol: gerçek API alan adında `/health`; izin verilen site Origin'inden `/chat` ve `/live` POST; ardından gerçek Yakut mikrofon testi. Yerel sahte servis testleri gerçek API kimlik doğrulaması veya dağıtım testi değildir.

Gemini ses tarafı metinden konuşma (TTS) kullanır; çift yönlü Gemini Live ses oturumu değildir.
