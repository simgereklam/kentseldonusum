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

## Site bağlantısı

Site sayfalarındaki `yakut-chat-endpoint` etiketi ve JavaScript yedek adresi `https://kumtas-yakut-chat.simgereklam.workers.dev/chat` kullanır. Ses testi aynı Worker üzerindeki `/live` yoluna istek gönderir.

Canlı kontrol: gerçek API alan adında `/health`; izin verilen site Origin'inden `/chat` ve `/live` POST; ardından gerçek Yakut mikrofon testi. Yerel sahte servis testleri gerçek API kimlik doğrulaması veya dağıtım testi değildir.

Gemini ses tarafı metinden konuşma (TTS) kullanır; çift yönlü Gemini Live ses oturumu değildir.

## Yayın doğrulaması

Worker varsayılan olarak `gemini-3.8-flash-tts` modelini ve Aoede sesini kullanır. `CHAT_LIMITER` bağlantısı yoksa istek sınırı Worker örneği başına uygulanır.

Yayından sonra gerçek Worker adresinde ve site Origin’i ile `/live` ve `/chat` isteklerini doğrulayın. Siteyi yalnızca doğrulanmış Worker adresine yönlendirin. Sitedeki `yakut-ses-test.html` aynı ses servisine kısa bir metin gönderir ve dönen sesi çalar. Bu test hazır MP3 dosyası kullanmaz.
