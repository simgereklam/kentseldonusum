/**
 * YAKUT - Kumtaş İnşaat MP3 Dosyasız Doğrudan Sesli Sohbet ve Sayfa Geçiş Motoru
 */
const YAKUT_CONFIG = {
  language: 'tr-TR',
  speechRate: 1.0,
  speechPitch: 1.08,
  greetingText:
    'Merhaba, Kumtaş İnşaat’a hoş geldiniz. Ben dijital asistanınız Yakut. Size nasıl yardımcı olabilirim?',
  routes: [
    {
      path: 'kurumsal.html',
      label: 'Kurumsal sayfasına geçiyorum.',
      keywords: ['kurumsal', 'kurumsal sayfa', 'kurumsal sayfası', 'hakkımızda', 'hakkimizda', 'firma bilgisi', 'kumtaş kimdir']
    },
    {
      path: 'kentsel-donusum.html',
      label: 'Kentsel Dönüşüm sayfasına geçiyorum.',
      keywords: ['kentsel dönüşüm', 'kentsel donusum', 'dönüşüm sayfası', 'riskli bina']
    },
    {
      path: 'projelerimiz.html',
      label: 'Projelerimiz sayfasına geçiyorum.',
      keywords: ['projeler', 'projelerimiz', 'binalar', 'örnek projeler']
    },
    {
      path: 'hizmetlerimiz.html',
      label: 'Hizmetlerimiz sayfasına geçiyorum.',
      keywords: ['hizmetler', 'hizmetlerimiz', 'neler yapıyorsunuz']
    },
    {
      path: 'bolgeler.html',
      label: 'Bölgeler sayfasına geçiyorum.',
      keywords: ['bölgeler', 'bolgeler', 'hangi ilçeler', 'ilçeler']
    },
    {
      path: 'sss.html',
      label: 'Sıkça Sorulan Sorular sayfasına geçiyorum.',
      keywords: ['sss', 'sık sorulan', 'sorular']
    },
    {
      path: 'iletisim.html',
      label: 'İletişim sayfasına geçiyorum.',
      keywords: ['iletişim', 'iletisim', 'telefon', 'adres', 'keşif']
    },
    {
      path: 'yakut-eimar.html',
      label: 'YAKUT e-İmar sayfasına geçiyorum.',
      keywords: ['e-imar', 'e imar', 'imar analizi', 'ada parsel']
    },
    {
      path: 'index.html',
      label: 'Ana sayfaya geçiyorum.',
      keywords: ['ana sayfa', 'anasayfa', 'başlangıç']
    }
  ]
};

const SMALL_TALK_RESPONSES = [
  {
    triggers: ['nasılsın', 'nasilsin', 'naber', 'ne haber', 'nasıl gidiyor', 'nasil gidiyor', 'keyfin nasıl', 'keyfin nasil'],
    answer:
      'İyiyim, teşekkür ederim. Siz nasılsınız? Kentsel dönüşüm süreci, kira ve taşınma yardımları, sözleşme adımları veya kullandığımız malzemeler hakkında nasıl yardımcı olabilirim?'
  },
  {
    triggers: ['merhaba', 'selam', 'selamünaleyküm', 'selamunaleykum', 'günaydın', 'gunaydin', 'iyi akşamlar', 'iyi aksamlar', 'iyi günler', 'iyi gunler'],
    answer:
      'Merhaba, Kumtaş İnşaat’a hoş geldiniz. Ben dijital asistanınız Yakut. Size nasıl yardımcı olabilirim?'
  },
  {
    triggers: ['teşekkür', 'tesekkur', 'sağ ol', 'sagol', 'sağol', 'eyvallah', 'çok sağol', 'cok sagol'],
    answer:
      'Rica ederim, her zaman memnuniyetle yardımcı olurum. Başka bir konuda merak ettiğiniz bir şey var mı?'
  },
  {
    triggers: ['sen kimsin', 'adın ne', 'adin ne', 'kimsin'],
    answer:
      'Ben dijital asistanınız Yakut. Kumtaş İnşaat projeleri, kentsel dönüşüm süreci, kira ve taşınma yardımları, sözleşme adımları ve malzeme listemiz hakkında bilgi verebilirim.'
  },
  {
    triggers: ['görüşürüz', 'gorusuruz', 'hoşça kal', 'hosca kal', 'bay bay', 'bye', 'kapat'],
    answer:
      'Görüşmek üzere, sağlıklı ve güvenli günler dilerim.'
  }
];

const KUMTAS_KNOWLEDGE = [
  {
    topics: ['malzeme', 'marka', 'kalite', '1. sınıf', 'birinci sınıf', 'şartname', 'ek-2', 'liste', 'demir', 'beton', 'asansör', 'doğrama'],
    answer:
      'Kumtaş İnşaat projelerinde 1. sınıf malzemeler kullanıyoruz. İnşaat demirinde S420 nervürlü demir (Kardemir, İçtaş, Habaş veya Diler; İzmir veya İran demiri kullanılmıyor ve test raporları sunuluyor), hazır betonda bakanlık onaylı tedarikçi, mantolamada 5 cm taşyünü (Filli Boya veya İzocam), dış cephede Asaş Naturalbond ve Jotun, doğramada Pimapen Nirvana 3 camlı sistem ve asansörde Schindler kullanıyoruz.'
  },
  {
    topics: ['kombi', '20 binlik', '20.000', 'yerden ısıtma', 'ankastre', 'fırın', 'ocak', 'davlumbaz', 'klima', 'arçelik', 'lima', 'demirdöküm', 'ısıtma'],
    answer:
      'Isıtma ve iklimlendirmede folyolu yerden ısıtma ve Demirdöküm Nitromix P24 20.000 KCal yoğuşmalı kombi kullanıyoruz. Mutfakta davlumbaz, ocak ve fırından oluşan ankastre set ile Arçelik 12.000 BTU klima ve Arçelik Lima çözümleri yer alıyor.'
  },
  {
    topics: ['ic_mekan', 'parke', 'seramik', 'kapı', 'mutfak', 'banyo', 'klozet', 'lavabo', 'armatür', 'diafon', 'mermer', 'alçı', 'boya', 'kalekim', 'bien', 'vario', 'eca', 'vitra', 'audio'],
    answer:
      'İç mekanlarda Vario Terraclick 31. sınıf 8 mm parke, Bien seramik, Kalekim yapıştırıcı, Vario MDF iç kapılar, MDF High Gloss mutfak, ECA, Bocchi veya Vitra armatür ve vitrifiye, Audio görüntülü diafon, ABS veya Dalsan perlitli alçı, Marshall iç cephe, Permolit tavan boyası ve mermer merdiven ile sahanlıklar uygulanıyor.'
  },
  {
    topics: ['teminat', 'güvence', 'fiyat farkı', 'enflasyon', 'ödeme', 'peşin', 'indirim', 'teşvik', 'kredi', 'daire', 'dükkan', 'ruhsat', 'denetim'],
    answer:
      'Süreç 6306 sayılı Kanun, 2018 Deprem Yönetmeliği, TS 825 ve en az B sınıfı Enerji Kimlik Belgesi standartlarına göre yapı denetim ve belediye kontrolünde yürütülüyor. Ruhsat aşamasında İmar Müdürlüğüne teminat mektubu ve peşinata karşılık teminat senedi veriyoruz; enflasyon veya fiyat farkı talep etmiyoruz, nakit ödemede %20 indirim uyguluyoruz. Teklifte daireler için 1.750.000 TL, dükkanlar için 875.000 TL devlet teşviği ve kredi desteği çerçevesi (malik kredi payı dairede 875.000 TL, dükkanda 437.500 TL sabit) yer alıyor.'
  },
  {
    topics: ['kira yardımı', 'taşınma yardımı', 'tahliye', 'kiracı', 'malik', 'ev sahibi', 'ne kadar', 'aylık', 'devlet desteği'],
    answer:
      '6306 kapsamındaki dönüşümlerde maliklere aylık kira yardımı, kiracılara ise tahliye ve taşınma desteği sağlanır; süreler ve tutarlar riskli yapıda 18 aya, riskli alanda 48 aya kadar güncel bakanlık tarifesi ve Yarısı Bizden kampanyası koşullarına göre belirlenir. Başvuruda kimlik, tapu veya kira belgesi, riskli yapı raporu, tahliye ve ikametgah belgesi ile banka IBAN bilgisi istenir.'
  },
  {
    topics: ['sözleşme', 'noter', 'kat karşılığı', 'vekalet', 'evrak', 'belge', 'nasıl yapılır', 'imza', 'paylaşım'],
    answer:
      'Kentsel dönüşüm ve kat karşılığı inşaat sözleşmeleri noter huzurunda düzenlenir; sözleşmeye arsa payı ve bağımsız bölüm paylaşım cetveli, teknik şartname ve ödeme planı eklenir. İşlem için tarafların kimlik asılları, tapu kayıtları, riskli yapı raporu, malik karar ve muvafakat belgeleri, şirket imza sirküleri ve gerekli hallerde noter vekaletnamesi hazırlanır.'
  },
  {
    topics: ['kentsel dönüşüm', 'riskli yapı', 'yıkım', 'ruhsat', 'süreç', 'nasıl başlar', 'başvuru', 'bağcılar', 'bahçelievler', 'yenibosna'],
    answer:
      'Kentsel dönüşüm; lisanslı kuruluşça riskli yapı tespiti ve raporun kesinleşmesi, tahliye ve yıkım işlemleri, proje ve ruhsat süreci ve yeni binanın inşası adımlarıyla ilerler. Bağcılar, Bahçelievler ve Yenibosna başta olmak üzere İstanbul genelinde ücretsiz ön değerlendirme yapıyoruz.'
  },
  {
    topics: ['iletişim', 'telefon', 'numara', 'ulaş', 'mail', 'eposta', 'e-posta', 'randevu', 'keşif'],
    answer:
      'Bize 0 212 955 5599 veya 0543 181 34 85 numaralı telefonlardan ya da info@kumtas.com.tr adresinden ulaşabilir, sayfadaki form üzerinden ücretsiz keşif talep edebilirsiniz.'
  }
];

class YakutAssistant {
  constructor(hooks = {}) {
    this.hooks = {
      onMessage: hooks.onMessage || (() => {}),
      onSpeakingChange: hooks.onSpeakingChange || (() => {}),
      onListeningChange: hooks.onListeningChange || (() => {})
    };
    this.isSpeaking = false;
    this.isListening = false;
    this.shouldKeepListening = false;
    this.recognition = null;
    this.greetDone = false;
    this.safetyTimer = null;
    this.initSpeechRecognition();
  }

  normalize(str) {
    return String(str || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  pickBestFemaleTurkishVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices?.() || [];
    if (!voices.length) return null;

    const femaleHints = [
      'female', 'kadın', 'woman', 'selin', 'emel', 'ayşe', 'yelda',
      'cemre', 'seda', 'zeynep', 'gamze', 'deniz', 'ipek', 'aoede'
    ];
    const maleHints = ['male', 'erkek', 'man', 'ahmet', 'mehmet', 'ali', 'emre', 'mustafa'];

    const trVoices = voices.filter(v => String(v.lang || '').toLowerCase().startsWith('tr'));
    const pool = trVoices.length ? trVoices : voices;

    const explicitFemale = pool.find(v => {
      const n = String(v.name || '').toLowerCase();
      return femaleHints.some(h => n.includes(h));
    });
    if (explicitFemale) return explicitFemale;

    const nonMale = pool.find(v => {
      const n = String(v.name || '').toLowerCase();
      return !maleHints.some(h => n.includes(h));
    });
    return nonMale || trVoices[0] || null;
  }

  initSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.lang = YAKUT_CONFIG.language;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      this.isListening = true;
      this.hooks.onListeningChange(true);
    };

    rec.onresult = (event) => {
      const transcript = event?.results?.[0]?.[0]?.transcript || '';
      if (transcript.trim()) {
        this.handleUserMessage(transcript.trim(), { speakResponse: true });
      }
    };

    rec.onerror = () => {
      this.isListening = false;
      this.hooks.onListeningChange(false);
    };

    rec.onend = () => {
      this.isListening = false;
      this.hooks.onListeningChange(false);
      if (this.shouldKeepListening && !this.isSpeaking) {
        setTimeout(() => this.startListening(), 250);
      }
    };

    this.recognition = rec;
  }

  startListening() {
    if (!this.recognition || this.isSpeaking) return;
    this.shouldKeepListening = true;
    if (this.isListening) return;
    try {
      this.recognition.start();
    } catch {}
  }

  stopListening() {
    this.shouldKeepListening = false;
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {}
    this.isListening = false;
    this.hooks.onListeningChange(false);
  }

  setSpeaking(state) {
    this.isSpeaking = Boolean(state);
    this.hooks.onSpeakingChange(this.isSpeaking);
    if (!this.isSpeaking && this.shouldKeepListening) {
      setTimeout(() => this.startListening(), 250);
    }
  }

  stopSpeaking() {
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.setSpeaking(false);
  }

  speak(text) {
    return new Promise((resolve) => {
      this.stopSpeaking();
      const cleanText = String(text || '').trim();
      if (!cleanText || !('speechSynthesis' in window)) {
        resolve(false);
        return;
      }

      const runUtterance = () => {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(cleanText);
          utter.lang = YAKUT_CONFIG.language;
          utter.rate = YAKUT_CONFIG.speechRate;
          utter.pitch = YAKUT_CONFIG.speechPitch;

          const voice = this.pickBestFemaleTurkishVoice();
          if (voice) utter.voice = voice;

          const finish = (ok) => {
            if (this.safetyTimer) {
              clearTimeout(this.safetyTimer);
              this.safetyTimer = null;
            }
            this.setSpeaking(false);
            resolve(ok);
          };

          this.safetyTimer = setTimeout(() => {
            try { window.speechSynthesis.cancel(); } catch {}
            finish(false);
          }, Math.max(15000, cleanText.length * 130));

          utter.onstart = () => this.setSpeaking(true);
          utter.onend = () => finish(true);
          utter.onerror = () => finish(false);

          window.speechSynthesis.speak(utter);
        } catch {
          this.setSpeaking(false);
          resolve(false);
        }
      };

      const voices = window.speechSynthesis.getVoices?.() || [];
      if (!voices.length && typeof window.speechSynthesis.addEventListener === 'function') {
        let fired = false;
        const onVoices = () => {
          if (fired) return;
          fired = true;
          window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
          runUtterance();
        };
        window.speechSynthesis.addEventListener('voiceschanged', onVoices);
        setTimeout(() => {
          if (!fired) {
            fired = true;
            window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
            runUtterance();
          }
        }, 120);
      } else {
        runUtterance();
      }
    });
  }

  async greetOnClick(force = false) {
    if (this.greetDone && !force) return false;
    this.greetDone = true;
    const text = YAKUT_CONFIG.greetingText;
    this.hooks.onMessage({ role: 'assistant', text, source: 'greeting' });
    return this.speak(text);
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

  findSmallTalk(cleanText) {
    if (!cleanText) return null;
    for (const item of SMALL_TALK_RESPONSES) {
      for (const trig of item.triggers) {
        const ntrig = this.normalize(trig);
        if (cleanText === ntrig || cleanText.startsWith(ntrig + ' ') || cleanText.endsWith(' ' + ntrig) || cleanText.includes(' ' + ntrig + ' ')) {
          return item;
        }
      }
    }
    return null;
  }

  findKnowledgeAnswer(cleanText) {
    if (!cleanText) return null;
    let best = null;
    let bestScore = 0;

    for (const entry of KUMTAS_KNOWLEDGE) {
      let score = 0;
      for (const topic of entry.topics) {
        const ntopic = this.normalize(topic);
        if (cleanText.includes(ntopic)) {
          score += ntopic.length >= 6 ? 2 : 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }

    return bestScore >= 1 ? best.answer : null;
  }

  async handleUserMessage(rawInput, { speakResponse = true } = {}) {
    const input = String(rawInput || '').trim();
    if (!input) return null;

    this.stopSpeaking();
    this.hooks.onMessage({ role: 'user', text: input, source: 'user' });

    const clean = this.normalize(input);

    // 1. Sayfa geçiş komutu
    const route = this.findRoute(clean);
    if (route && !route.alreadyHere) {
      this.hooks.onMessage({ role: 'assistant', text: route.label, source: 'navigation' });
      window.location.href = route.path;
      return route.label;
    }

    // 2. Selamlaşma / hal-hatır sohbeti
    const smallTalk = this.findSmallTalk(clean);
    if (smallTalk) {
      this.hooks.onMessage({ role: 'assistant', text: smallTalk.answer, source: 'small-talk' });
      if (speakResponse) await this.speak(smallTalk.answer);
      return smallTalk.answer;
    }

    // 3. Kentsel dönüşüm, malzeme, kombi, kira yardımı, sözleşme ve iletişim bilgileri
    const answer =
      this.findKnowledgeAnswer(clean) ||
      'Kentsel dönüşüm süreci, kira ve taşınma yardımları, noter sözleşmesi veya kullandığımız 1. sınıf malzemeler hakkında sorabilirsiniz; dilerseniz kurumsal, projeler veya iletişim sayfasına da geçebilirim.';

    this.hooks.onMessage({ role: 'assistant', text: answer, source: 'knowledge' });
    if (speakResponse) {
      await this.speak(answer);
    }
    return answer;
  }
}

window.YakutAssistant = YakutAssistant;
