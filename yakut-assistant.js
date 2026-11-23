/**
 * YAKUT - Kumtaş İnşaat Sadece MP3 Konuşma Bağlantısı
 */
const YAKUT_CONFIG = {
  // MP3 dosyalarının yollarını buraya tanımla (örnek: './audio/merhaba.mp3')
  mp3Map: {
    acilis: '',
    merhaba: '',
    nasilsin: '',
    tesekkur: '',
    kimsin: '',
    kurumsal: '',
    malzeme: '',
    kombi: '',
    kira_yardimi: '',
    sozlesme: '',
    kentsel_donusum: '',
    iletisim: '',
    varsayilan: ''
  },
  routes: [
    { path: 'kurumsal.html', label: 'Kurumsal sayfasına geçiyorum.', keywords: ['kurumsal', 'hakkımızda', 'hakkimizda'] },
    { path: 'kentsel-donusum.html', label: 'Kentsel Dönüşüm sayfasına geçiyorum.', keywords: ['kentsel dönüşüm', 'kentsel donusum', 'riskli bina'] },
    { path: 'projelerimiz.html', label: 'Projelerimiz sayfasına geçiyorum.', keywords: ['projeler', 'projelerimiz'] },
    { path: 'hizmetlerimiz.html', label: 'Hizmetlerimiz sayfasına geçiyorum.', keywords: ['hizmetler', 'hizmetlerimiz'] },
    { path: 'bolgeler.html', label: 'Bölgeler sayfasına geçiyorum.', keywords: ['bölgeler', 'bolgeler'] },
    { path: 'sss.html', label: 'Sıkça Sorulan Sorular sayfasına geçiyorum.', keywords: ['sss', 'sorular'] },
    { path: 'iletisim.html', label: 'İletişim sayfasına geçiyorum.', keywords: ['iletişim', 'iletisim', 'telefon', 'adres'] },
    { path: 'yakut-eimar.html', label: 'YAKUT e-İmar sayfasına geçiyorum.', keywords: ['e-imar', 'e imar', 'imar'] },
    { path: 'index.html', label: 'Ana sayfaya geçiyorum.', keywords: ['ana sayfa', 'anasayfa'] }
  ]
};

const MP3_INTENTS = [
  {
    mp3Key: 'nasilsin',
    text: 'İyiyim, teşekkür ederim. Siz nasılsınız? Size nasıl yardımcı olabilirim?',
    keywords: ['nasılsın', 'nasilsin', 'naber', 'ne haber', 'nasıl gidiyor', 'nasil gidiyor']
  },
  {
    mp3Key: 'merhaba',
    text: 'Merhaba, Kumtaş İnşaat’a hoş geldiniz. Ben dijital asistanınız Yakut. Size nasıl yardımcı olabilirim?',
    keywords: ['merhaba', 'selam', 'günaydın', 'gunaydin', 'iyi akşamlar', 'iyi günler']
  },
  {
    mp3Key: 'tesekkur',
    text: 'Rica ederim, memnuniyetle yardımcı olurum.',
    keywords: ['teşekkür', 'tesekkur', 'sağ ol', 'sagol', 'eyvallah']
  },
  {
    mp3Key: 'kimsin',
    text: 'Ben dijital asistanınız Yakut. Kumtaş İnşaat kentsel dönüşüm asistanıyım.',
    keywords: ['sen kimsin', 'adın ne', 'adin ne', 'kimsin']
  },
  {
    mp3Key: 'kombi',
    text: 'Projelerimizde folyolu yerden ısıtma ve 20.000 KCal kombi ile ankastre set çözümleri sunulmaktadır.',
    keywords: ['kombi', '20 binlik', '20.000', 'yerden ısıtma', 'ankastre', 'fırın', 'ocak', 'davlumbaz', 'klima', 'arçelik', 'lima']
  },
  {
    mp3Key: 'malzeme',
    text: 'İnşaatlarımızda bakanlık onaylı beton ve standartlara uygun 1. sınıf malzemeler kullanılmaktadır.',
    keywords: ['malzeme', 'marka', 'kalite', '1. sınıf', 'birinci sınıf', 'demir', 'beton', 'asansör']
  },
  {
    mp3Key: 'kira_yardimi',
    text: 'Kentsel dönüşüm kapsamında kira yardımı ve taşınma desteği mevzuat şartlarına göre uygulanmaktadır.',
    keywords: ['kira yardımı', 'taşınma yardımı', 'tahliye', 'kiracı', 'kira', 'taşınma']
  },
  {
    mp3Key: 'sozlesme',
    text: 'Kentsel dönüşüm ve kat karşılığı sözleşmeler noter huzurunda gerekli belgelerle düzenlenir.',
    keywords: ['sözleşme', 'noter', 'kat karşılığı', 'vekalet', 'evrak', 'belge']
  },
  {
    mp3Key: 'kentsel_donusum',
    text: 'Kentsel dönüşüm süreci riskli yapı tespiti, tahliye, ruhsat ve inşaat aşamalarından oluşur.',
    keywords: ['kentsel dönüşüm', 'riskli yapı', 'yıkım', 'ruhsat', 'süreç']
  },
  {
    mp3Key: 'iletisim',
    text: 'Bize 0 212 955 5599 veya 0543 181 34 85 numaralı telefonlardan ulaşabilirsiniz.',
    keywords: ['iletişim', 'telefon', 'numara', 'ulaş', 'mail', 'randevu']
  }
];

class YakutAssistant {
  constructor(hooks = {}) {
    this.hooks = {
      onMessage: hooks.onMessage || (() => {}),
      onSpeakingChange: hooks.onSpeakingChange || (() => {}),
      onMp3Missing: hooks.onMp3Missing || (() => {})
    };
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.isSpeaking = false;
    this.greeted = false;

    this.audio.addEventListener('play', () => this.setSpeaking(true));
    this.audio.addEventListener('ended', () => this.setSpeaking(false));
    this.audio.addEventListener('pause', () => {
      if (this.audio.ended || this.audio.currentTime === 0) {
        this.setSpeaking(false);
      }
    });
    this.audio.addEventListener('error', () => this.setSpeaking(false));
  }

  normalize(str) {
    return String(str || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  setSpeaking(state) {
    this.isSpeaking = Boolean(state);
    this.hooks.onSpeakingChange(this.isSpeaking);
  }

  stopMp3() {
    try {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.removeAttribute('src');
      this.audio.load();
    } catch {}
    this.setSpeaking(false);
  }

  async playMp3ByKey(mp3Key, fallbackText = '') {
    this.stopMp3();
    const key = mp3Key && YAKUT_CONFIG.mp3Map[mp3Key] ? mp3Key : 'varsayilan';
    const url = String(YAKUT_CONFIG.mp3Map[key] || '').trim();

    if (!url) {
      this.hooks.onMp3Missing({ mp3Key: key, text: fallbackText });
      return false;
    }

    try {
      this.audio.src = url;
      this.audio.currentTime = 0;
      await this.audio.play();
      return true;
    } catch {
      this.setSpeaking(false);
      this.hooks.onMp3Missing({ mp3Key: key, url, text: fallbackText });
      return false;
    }
  }

  findRoute(cleanText) {
    if (!cleanText) return null;
    const currentPath = this.normalize(window.location.pathname);

    for (const route of YAKUT_CONFIG.routes) {
      for (const kw of route.keywords) {
        const nkw = this.normalize(kw);
        if (!nkw) continue;
        if (cleanText === nkw || cleanText.includes(nkw)) {
          const alreadyHere =
            currentPath.endsWith('/' + route.path) ||
            currentPath.endsWith(route.path) ||
            (route.path === 'index.html' && (currentPath === '' || currentPath === '/'));
          return { ...route, alreadyHere };
        }
      }
    }
    return null;
  }

  findIntent(cleanText) {
    if (!cleanText) return null;
    for (const item of MP3_INTENTS) {
      for (const kw of item.keywords) {
        const nkw = this.normalize(kw);
        if (cleanText === nkw || cleanText.startsWith(nkw + ' ') || cleanText.endsWith(' ' + nkw) || cleanText.includes(' ' + nkw + ' ')) {
          return item;
        }
      }
    }
    return null;
  }

  async greetOnClick(force = false) {
    if (this.greeted && !force) return false;
    this.greeted = true;
    const greetingText = 'Merhaba, Kumtaş İnşaat’a hoş geldiniz. Ben dijital asistanınız Yakut. Size nasıl yardımcı olabilirim?';
    this.hooks.onMessage({ role: 'assistant', text: greetingText, mp3Key: 'acilis' });
    return this.playMp3ByKey('acilis', greetingText);
  }

  async handleUserMessage(rawInput) {
    const input = String(rawInput || '').trim();
    if (!input) return false;

    this.stopMp3();
    this.hooks.onMessage({ role: 'user', text: input });

    const clean = this.normalize(input);

    // 1. Sayfa geçiş komutu
    const route = this.findRoute(clean);
    if (route && !route.alreadyHere) {
      this.hooks.onMessage({ role: 'assistant', text: route.label, mp3Key: route.path.replace('.html', '') });
      window.location.href = route.path;
      return true;
    }

    // 2. Eşleşen MP3 niyeti
    const intent = this.findIntent(clean);
    if (intent) {
      this.hooks.onMessage({ role: 'assistant', text: intent.text, mp3Key: intent.mp3Key });
      return this.playMp3ByKey(intent.mp3Key, intent.text);
    }

    // 3. Genel / tanımlı varsayılan MP3
    const defaultText = 'Kentsel dönüşüm süreci, kira yardımı, sözleşme veya kullandığımız malzemeler hakkında bilgi alabilirsiniz.';
    this.hooks.onMessage({ role: 'assistant', text: defaultText, mp3Key: 'varsayilan' });
    return this.playMp3ByKey('varsayilan', defaultText);
  }
}

window.YakutAssistant = YakutAssistant;
