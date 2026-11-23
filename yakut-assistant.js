/**
 * YAKUT - Kumtaş İnşaat Sıfır Kredi (Tamamen Tarayıcı İçi) Ses, Sohbet ve Sayfa Geçiş Motoru
 */
const YAKUT_CONFIG = {
  language: 'tr-TR',
  speechRate: 1.0,
  speechPitch: 1.05,
  greetingText:
    'Merhaba, Kumtaş İnşaat’a hoş geldiniz. Ben dijital asistanınız Yakut. Size nasıl yardımcı olabilirim?',
  routes: [
    { path: 'kurumsal.html', label: 'Kurumsal sayfasına geçiyorum.', keywords: ['kurumsal', 'hakkımızda', 'hakkimizda'] },
    { path: 'kentsel-donusum.html', label: 'Kentsel Dönüşüm sayfasına geçiyorum.', keywords: ['kentsel dönüşüm', 'kentsel donusum', 'dönüşüm', 'donusum', 'riskli bina'] },
    { path: 'projelerimiz.html', label: 'Projelerimiz sayfasına geçiyorum.', keywords: ['projeler', 'projelerimiz', 'proje'] },
    { path: 'hizmetlerimiz.html', label: 'Hizmetlerimiz sayfasına geçiyorum.', keywords: ['hizmetler', 'hizmetlerimiz', 'hizmet'] },
    { path: 'bolgeler.html', label: 'Bölgeler sayfasına geçiyorum.', keywords: ['bölgeler', 'bolgeler', 'bölge', 'ilçeler'] },
    { path: 'sss.html', label: 'Sıkça Sorulan Sorular sayfasına geçiyorum.', keywords: ['sss', 'sorular', 'soru'] },
    { path: 'iletisim.html', label: 'İletişim sayfasına geçiyorum.', keywords: ['iletişim', 'iletisim', 'telefon', 'adres', 'keşif', 'kesif'] },
    { path: 'yakut-eimar.html', label: 'YAKUT e-İmar sayfasına geçiyorum.', keywords: ['e-imar', 'e imar', 'imar'] },
    { path: 'index.html', label: 'Ana sayfaya geçiyorum.', keywords: ['ana sayfa', 'anasayfa', 'ana'] }
  ]
};

const SMALL_TALK_RESPONSES = [
  {
    triggers: ['nasılsın', 'nasilsin', 'naber', 'ne haber', 'nasıl gidiyor', 'nasil gidiyor'],
    answer: 'İyiyim, teşekkür ederim. Siz nasılsınız? Size nasıl yardımcı olabilirim?'
  },
  {
    triggers: ['merhaba', 'selam', 'günaydın', 'gunaydin', 'iyi akşamlar', 'iyi aksamlar', 'iyi günler', 'iyi gunler'],
    answer: 'Merhaba, Kumtaş İnşaat’a hoş geldiniz. Ben dijital asistanınız Yakut. Size nasıl yardımcı olabilirim?'
  },
  {
    triggers: ['teşekkür', 'tesekkur', 'sağ ol', 'sagol', 'eyvallah'],
    answer: 'Rica ederim, her zaman memnuniyetle yardımcı olurum.'
  },
  {
    triggers: ['sen kimsin', 'adın ne', 'adin ne', 'kimsin'],
    answer: 'Ben dijital asistanınız Yakut. Kumtaş İnşaat kentsel dönüşüm asistanıyım.'
  }
];

const KUMTAS_KNOWLEDGE = [
  {
    topics: ['malzeme', 'marka', 'kalite', '1. sınıf', 'birinci sınıf', 'şartname', 'demir', 'beton', 'asansör', 'doğrama'],
    answer:
      'Kumtaş İnşaat projelerinde 1. sınıf malzemeler kullanıyoruz. İnşaat demirinde S420 nervürlü demir, hazır betonda bakanlık onaylı tedarikçi, mantolamada 5 cm taşyünü, dış cephede Asaş Naturalbond ve Jotun, doğramada Pimapen ve asansörde Schindler tercih ediyoruz.'
  },
  {
    topics: ['kombi', '20 binlik', '20.000', 'yerden ısıtma', 'ankastre', 'fırın', 'ocak', 'davlumbaz', 'klima', 'demirdöküm', 'ısıtma'],
    answer:
      'Isıtma ve iklimlendirmede folyolu yerden ısıtma ve 20.000 KCal kombi ile ankastre set çözümleri sunuyoruz.'
  },
  {
    topics: ['kira yardımı', 'taşınma yardımı', 'tahliye', 'kiracı', 'malik', 'kira', 'taşınma'],
    answer:
      '6306 kapsamındaki dönüşümlerde hak sahiplerine kira yardımı ve tahliye taşınma desteği güncel mevzuata göre uygulanır.'
  },
  {
    topics: ['sözleşme', 'noter', 'kat karşılığı', 'vekalet', 'evrak', 'belge'],
    answer:
      'Kentsel dönüşüm ve kat karşılığı sözleşmeler noter huzurunda, tapu, kimlik, riskli yapı raporu ve gerekli vekalet belgeleriyle düzenlenir.'
  },
  {
    topics: ['kentsel dönüşüm', 'riskli yapı', 'yıkım', 'ruhsat', 'süreç'],
    answer:
      'Kentsel dönüşüm süreci riskli yapı tespiti, tahliye ve yıkım, ruhsat ve inşaat aşamalarından oluşur.'
  },
  {
    topics: ['iletişim', 'telefon', 'numara', 'ulaş', 'mail', 'randevu'],
    answer:
      'Bize 0 212 955 5599 veya 0543 181 34 85 numaralı telefonlardan ya da info@kumtas.com.tr adresinden ulaşabilirsiniz.'
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
    this.greeted = false;
    this.sessionId = 0;
    this.initSpeechRecognition();
  }

  normalize(str) {
    return String(str || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  pickFemaleTurkishVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices?.() || [];
    if (!voices.length) return null;

    const femaleHints = ['female', 'kadın', 'woman', 'selin', 'emel', 'ayşe', 'yelda', 'cemre', 'seda', 'zeynep', 'gamze', 'deniz', 'ipek'];
    const trVoices = voices.filter(v => String(v.lang || '').toLowerCase().startsWith('tr'));
    const pool = trVoices.length ? trVoices : voices;

    return (
      pool.find(v => femaleHints.some(h => String(v.name || '').toLowerCase().includes(h))) ||
      trVoices[0] ||
      null
    );
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
    this.sessionId += 1;
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.setSpeaking(false);
  }

  splitIntoChunks(text) {
    const parts = String(text || '')
      .split(/(?<=[.!?…])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
    return parts.length ? parts : [String(text || '').trim()].filter(Boolean);
  }

  speak(text) {
    const cleanText = String(text || '').trim();
    if (!cleanText || !('speechSynthesis' in window)) {
      return Promise.resolve(false);
    }

    this.stopSpeaking();
    const activeSession = this.sessionId;
    const chunks = this.splitIntoChunks(cleanText);
    const voice = this.pickFemaleTurkishVoice();

    return new Promise((resolve) => {
      let idx = 0;

      const speakNext = () => {
        if (activeSession !== this.sessionId || idx >= chunks.length) {
          if (activeSession === this.sessionId) {
            this.setSpeaking(false);
          }
          resolve(activeSession === this.sessionId);
          return;
        }

        const chunk = chunks[idx++];
        const utter = new SpeechSynthesisUtterance(chunk);
        utter.lang = YAKUT_CONFIG.language;
        utter.rate = YAKUT_CONFIG.speechRate;
        utter.pitch = YAKUT_CONFIG.speechPitch;
        if (voice) utter.voice = voice;

        utter.onstart = () => {
          if (activeSession === this.sessionId) {
            this.setSpeaking(true);
          }
        };
        utter.onend = () => {
          if (activeSession !== this.sessionId) {
            resolve(false);
            return;
          }
          speakNext();
        };
        utter.onerror = () => {
          if (activeSession !== this.sessionId) {
            resolve(false);
            return;
          }
          speakNext();
        };

        try {
          window.speechSynthesis.speak(utter);
        } catch {
          speakNext();
        }
      };

      speakNext();
    });
  }

  greetOnClick(force = false) {
    if (this.greeted && !force) return;
    this.greeted = true;
    const text = YAKUT_CONFIG.greetingText;
    this.hooks.onMessage({ role: 'assistant', text, source: 'greeting' });
    this.speak(text);
  }

  findRoute(cleanText) {
    if (!cleanText) return null;
    const currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

    for (const route of YAKUT_CONFIG.routes) {
      for (const kw of route.keywords) {
        const nkw = this.normalize(kw);
        if (!nkw) continue;
        if (cleanText === nkw || cleanText.includes(nkw)) {
          return { ...route, alreadyHere: currentFile === route.path.toLowerCase() };
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
        if (cleanText === ntrig || cleanText.includes(ntrig)) {
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

  handleUserMessage(rawInput, { speakResponse = true } = {}) {
    const input = String(rawInput || '').trim();
    if (!input) return null;

    this.stopSpeaking();
    this.hooks.onMessage({ role: 'user', text: input, source: 'user' });

    const clean = this.normalize(input);

    // 1. Sayfa komutu -> gecikmesiz doğrudan aç
    const route = this.findRoute(clean);
    if (route && !route.alreadyHere) {
      this.stopListening();
      this.hooks.onMessage({ role: 'assistant', text: route.label, source: 'navigation' });
      window.location.assign(route.path);
      return route.label;
    }

    // 2. Günlük sohbet
    const smallTalk = this.findSmallTalk(clean);
    if (smallTalk) {
      this.hooks.onMessage({ role: 'assistant', text: smallTalk.answer, source: 'small-talk' });
      if (speakResponse) this.speak(smallTalk.answer);
      return smallTalk.answer;
    }

    // 3. Kredi yemeyen yerel bilgi bankası
    const answer =
      this.findKnowledgeAnswer(clean) ||
      'Kentsel dönüşüm süreci, kira yardımı, noter sözleşmesi veya kullandığımız 1. sınıf malzemeler hakkında sorabilirsiniz; dilerseniz kurumsal, projeler veya iletişim sayfasına da geçebilirim.';

    this.hooks.onMessage({ role: 'assistant', text: answer, source: 'knowledge' });
    if (speakResponse) this.speak(answer);
    return answer;
  }
}

window.YakutAssistant = YakutAssistant;
