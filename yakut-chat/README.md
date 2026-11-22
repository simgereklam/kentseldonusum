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

## Review notes for the live-connection PR (2026-11-22)

The default Gemini TTS REST model was changed to `gemini-2.5-flash-preview-tts` as documented by Google. The `Aoede` voice remains unchanged. The same default is used in the Python alternative.

`CHAT_LIMITER` is optional at runtime; if unavailable, the Worker uses a best-effort per-isolate rate limiter. Configure account-level Cloudflare rate limiting in production because individual isolates do not share state.

**Do not guess the workers.dev URL** from the Worker name. A Worker named `kumtas-yakut-chat` does not reveal the account's workers.dev subdomain. Verify the live deployment URL and ownership before editing `yakut-v9.js`, preconnect tags, or HTML meta tags. The website still targets the older chatgpt.site API address, and a PR merge does not replace that live host. The domain owner must configure a route/proxy or explicitly authorize a verified frontend URL change.

**Branding caution:** The currently published site and prerecorded MP3 speech identify KUMTAŞ İNŞAAT. Do not change `yakut-site-voice.js` wording to MASFEY without verifying that brand change is intended and replacing prerecorded voice files; text-only edits would make written and spoken branding disagree.
