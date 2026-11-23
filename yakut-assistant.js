/**
 * YAKUT - Kumtaş İnşaat Tek Ses, Anında Selamlama, Sesli Komut ve Sayfa Geçiş Motoru
 */
const YAKUT_CONFIG = {
  workerUrl: 'https://kumtas-yakut-chat.simgereklam.workers.dev',
  language: 'tr-TR',
  greetingText: 'Merhaba, Kumtaş İnşaat’a hoş geldiniz. Ben dijital asistanınız Yakut. Size nasıl yardımcı olabilirim?',
  mp3Map: {
    // İleride MP3 eklersen yollarını buraya yaz; yoksa tek kadın sesi (/live Aoede) kullanır:
    // acilis: './audio/acilis.mp3',
    // merhaba: './audio/merhaba.mp3',
    // nasilsin: './audio/nasilsin.mp3'
  },
  routes: [
    { path: 'kurumsal.html', label: 'Kurumsal sayfasına geçiyorum.', keywords: ['kurumsal', 'hakkımızda', 'hakkimizda', 'firma bilgisi', 'kumtaş kimdir'] },
    { path: 'kentsel-donusum.html', label: 'Kentsel Dönüşüm sayfasına geçiyorum.', keywords: ['kentsel dönüşüm', 'kentsel donusum', 'riskli bina'] },
    { path: 'projelerimiz.html', label: 'Projelerimiz sayfasına geçiyorum.', keywords: ['projeler', 'projelerimiz', 'binalar'] },
    { path: 'hizmetlerimiz.html', label: 'Hizmetlerimiz sayfasına geçiyorum.', keywords: ['hizmetler', 'hizmetlerimiz'] },
    { path: 'bolgeler.html', label: 'Bölgeler sayfasına geçiyorum.', keywords: ['bölgeler', 'bolgeler', 'ilçeler'] },
    { path: 'sss.html', label: 'Sıkça Sorulan Sorular sayfasına geçiyorum.', keywords: ['sss', 'sık sorulan', 'sorular'] },
    { path: 'iletisim.html', label: 'İletişim sayfasına geçiyorum.', keywords: ['iletişim', 'iletisim', 'telefon', 'adres', 'keşif'] },
    { path: 'yakut-eimar.html', label: 'YAKUT e-İmar sayfasına geçiyorum.', keywords: ['e-imar', 'e imar', 'imar'] },
    { path: 'index.html', label: 'Ana sayfaya geçiyorum.', keywords: ['ana sayfa', 'anasayfa'] }
  ]
};

const SMALL_TALK_RESPONSES = [
  {
    key: 'nasilsin',
    triggers: ['nasılsın', 'nasilsin', 'naber', 'ne haber', 'nasıl gidiyor', 'nasil gidiyor'],
    answer: 'İyiyim, teşekkür ederim. Siz nasılsınız? Size nasıl yardımcı olabilirim?'
  },
  {
    key: 'merhaba',
    triggers: ['merhaba', 'selam', 'selamünaleyküm', 'selamunaleykum', 'günaydın', 'gunaydin', 'iyi akşamlar', 'iyi günler'],
    answer: 'Merhaba, hoş geldiniz! Ben Yakut, size nasıl yardımcı olabilirim?'
  },
  {
    key: 'tesekkur',
    triggers: ['teşekkür', 'tesekkur', 'sağ ol', 'sagol', 'sağol', 'eyvallah'],
    answer: 'Rica ederim, her zaman yardımcı olmaktan memnuniyet duyarım.'
  },
  {
    key: 'kimsin',
    triggers: ['sen kimsin', 'adın ne', 'adin ne', 'kimsin'],
    answer: 'Ben dijital asistanınız Yakut. Kumtaş İnşaat projeleri, kentsel dönüşüm, kira yardımı, sözleşme ve kullandığımız malzemeler hakkında bilgi verebilirim.'
  }
];

const KUMTAS_KNOWLEDGE = [
  {
    id: 'malzeme_genel',
    topics: ['malzeme', 'marka', 'kalite', '1. sınıf', 'birinci sınıf', 'şartname', 'ek-2', 'liste', 'demir', 'beton', 'asansör', 'doğrama'],
    answer:
      'Kumtaş İnşaat projelerinde 1. sınıf malzemeler kullanıyoruz. İnşaat demirinde S420 nervürlü demir (Kardemir, İçtaş, Habaş veya Diler; İzmir veya İran demiri kullanılmıyor ve test raporları sunuluyor), hazır betonda bakanlık onaylı tedarikçi, mantolamada 5 cm taşyünü (Filli Boya veya İzocam), dış cephede Asaş Naturalbond ve Jotun, doğramada Pimapen Nirvana 3 camlı sistem ve asansörde Schindler kullanıyoruz.'
  },
  {
    id: 'isitma_ankastre_klima',
    topics: ['kombi', '20 binlik', '20.000', 'yerden ısıtma', 'ankastre', 'fırın', 'ocak', 'davlumbaz', 'klima', 'arçelik', 'lima', 'demirdöküm', 'ısıtma'],
    answer:
      'Isıtma ve iklimlendirmede folyolu yerden ısıtma ve Demirdöküm Nitromix P24 20.000 KCal yoğuşmalı kombi kullanıyoruz. Mutfakta davlumbaz, ocak ve fırından oluşan ankastre set ile Arçelik 12.000 BTU klima ve Arçelik Lima çözümleri yer alıyor.'
  },
  {
    id: 'ic_mekan_seramik_kapi',
    topics: ['parke', 'seramik', 'kapı', 'mutfak', 'banyo', 'klozet', 'lavabo', 'armatür', 'diafon', 'mermer', 'alçı', 'boya', 'kalekim', 'bien', 'vario', 'eca', 'vitra', 'audio'],
    answer:
      'İç mekanlarda Vario Terraclick 31. sınıf 8 mm parke, Bien seramik, Kalekim yapıştırıcı, Vario MDF iç kapılar, MDF High Gloss mutfak, ECA, Bocchi veya Vitra armatür ve vitrifiye, Audio görüntülü diafon, ABS veya Dalsan perlitli alçı, Marshall iç cephe, Permolit tavan boyası ve mermer merdiven ile sahanlıklar uygulanıyor.'
  },
  {
    id: 'finansman_guvence',
    topics: ['teminat', 'güvence', 'fiyat farkı', 'enflasyon', 'ödeme', 'peşin', 'indirim', 'teşvik', 'kredi', 'daire', 'dükkan', 'ruhsat', 'denetim'],
    answer:
      'Süreç 6306 sayılı Kanun, 2018 Deprem Yönetmeliği, TS 825 ve en az B sınıfı Enerji Kimlik Belgesi standartlarına göre yapı denetim ve belediye kontrolünde yürütülüyor. Ruhsat aşamasında İmar Müdürlüğüne teminat mektubu ve peşinata karşılık teminat senedi veriyoruz; enflasyon veya fiyat farkı talep etmiyoruz, nakit ödemede %20 indirim uyguluyoruz. Teklifte daireler için 1.750.000 TL, dükkanlar için 875.000 TL devlet teşviği ve kredi desteği çerçevesi (malik kredi payı dairede 875.000 TL, dükkanda 437.500 TL sabit) yer alıyor.'
  },
  {
    id: 'kira_tasinma_yardimi',
    topics: ['kira yardımı', 'taşınma yardımı', 'tahliye', 'kiracı', 'malik', 'ev sahibi', 'ne kadar', 'aylık', 'devlet desteği'],
    answer:
      '6306 kapsamındaki dönüşümlerde maliklere aylık kira yardımı, kiracılara ise tahliye ve taşınma desteği sağlanır; süreler ve tutarlar riskli yapıda 18 aya, riskli alanda 48 aya kadar güncel bakanlık tarifesi ve Yarısı Bizden kampanyası koşullarına göre belirlenir. Başvuruda kimlik, tapu veya kira belgesi, riskli yapı raporu, tahliye ve ikametgah belgesi ile banka IBAN bilgisi istenir.'
  },
  {
    id: 'sozlesme_nasil_yapilir',
    topics: ['sözleşme', 'noter', 'kat karşılığı', 'vekalet', 'evrak', 'belge', 'nasıl yapılır', 'imza', 'paylaşım'],
    answer:
      'Kentsel dönüşüm ve kat karşılığı inşaat sözleşmeleri noter huzurunda düzenlenir; sözleşmeye arsa payı ve bağımsız bölüm paylaşım cetveli, teknik şartname ve ödeme planı eklenir. İşlem için tarafların kimlik asılları, tapu kayıtları, riskli yapı raporu, malik karar ve muvafakat belgeleri, şirket imza sirküleri ve gerekli hallerde noter vekaletnamesi hazırlanır.'
  },
  {
    id: 'kentsel_donusum_sureci',
    topics: ['kentsel dönüşüm', 'riskli yapı', 'yıkım', 'ruhsat', 'süreç', 'nasıl başlar', 'başvuru', 'bağcılar', 'bahçelievler', 'yenibosna'],
    answer:
      'Kentsel dönüşüm; lisanslı kuruluşça riskli yapı tespiti ve raporun kesinleşmesi, tahliye ve yıkım işlemleri, proje ve ruhsat süreci ve yeni binanın inşası adımlarıyla ilerler. Bağcılar, Bahçelievler ve Yenibosna başta olmak üzere İstanbul genelinde ücretsiz ön değerlendirme yapıyoruz.'
  },
  {
    id: 'iletisim_bilgi',
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
    this.currentAudio = null;
    this.activeSource = null;
    this.audioCtx = null;
    this.isSpeaking = false;
    this.isListening = false;
    this.shouldKeepListening = false;
    this.recognition = null;
    this.greetSpoken = false;
    this.history = [];
    this.initSpeechRecognition();
  }

  normalize(str) {
    return String(str || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  initSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.lang = 'tr-TR';
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
      // Konuşma bittiyse ve dinleme modu açıksa yeniden komut beklemeye geç
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

  async greetImmediately() {
    if (this.greetSpoken) return;
    const text = YAKUT_CONFIG.greetingText;
    this.hooks.onMessage({ role: 'assistant', text, source: 'greeting' });
    const ok = await this.speak(text, 'acilis');
    if (ok) {
      this.greetSpoken = true;
    }
  }

  findNavigationRoute(cleanText) {
    if (!cleanText) return null;
    const currentPath = this.normalize(window.location.pathname);

    for (const route of YAKUT_CONFIG.routes) {
      for (const kw of route.keywords) {
        const nkw = this.normalize(kw);
        if (!nkw) continue;
        if (cleanText === nkw || cleanText.includes(nkw)) {
          const isHere =
            currentPath.endsWith('/' + route.path) ||
            currentPath.endsWith(route.path) ||
            (route.path === 'index.html' && (currentPath === '' || currentPath === '/'));
          return { ...route, alreadyHere: isHere };
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

  findLocalKnowledgeAnswer(question) {
    const clean = this.normalize(question);
    if (!clean) return null;

    let best = null;
    let bestScore = 0;

    for (const entry of KUMTAS_KNOWLEDGE) {
      let score = 0;
      for (const kw of entry.topics) {
        const nkw = this.normalize(kw);
        if (clean.includes(nkw)) {
          score += nkw.length >= 6 ? 2 : 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }

    return bestScore >= 1 ? best.answer : null;
  }

  async handleUserMessage(rawQuestion, { speakResponse = true } = {}) {
    const question = String(rawQuestion || '').trim();
    if (!question) return null;

    this.stopSpeaking();
    this.hooks.onMessage({ role: 'user', text: question, source: 'user' });
    this.history.push({ role: 'user', text: question });
    this.history = this.history.slice(-8);

    const clean = this.normalize(question);

    // 1. Sayfa komutu -> anında sayfayı aç
    const navMatch = this.findNavigationRoute(clean);
    if (navMatch && !navMatch.alreadyHere) {
      this.hooks.onMessage({ role: 'assistant', text: navMatch.label, source: 'navigation' });
      window.location.href = navMatch.path;
      return navMatch.label;
    }
    if (navMatch && navMatch.alreadyHere) {
      const msg = 'Zaten bu sayfadayız. Size nasıl yardımcı olabilirim?';
      this.hooks.onMessage({ role: 'assistant', text: msg, source: 'navigation' });
      if (speakResponse) await this.speak(msg);
      return msg;
    }

    // 2. Selamlaşma / günlük sohbet ("merhaba", "nasılsın")
    const smallTalk = this.findSmallTalk(clean);
    if (smallTalk) {
      this.hooks.onMessage({ role: 'assistant', text: smallTalk.answer, source: 'small-talk' });
      if (speakResponse) await this.speak(smallTalk.answer, smallTalk.key);
      return smallTalk.answer;
    }

    // 3. Kentsel dönüşüm, malzeme listesi, kira yardımı, sözleşme bilgileri
    let answer = this.findLocalKnowledgeAnswer(question);
    let source = 'local';

    // 4. Yerel listede yoksa Worker /chat üzerinden Türkçe yanıt al
    if (!answer) {
      source = 'worker-chat';
      try {
        const res = await fetch(`${YAKUT_CONFIG.workerUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: `${question} (Sadece Türkçe cevap ver.)`,
            reference: document.title,
            history: this.history,
            research: true
          }),
          signal: AbortSignal.timeout(6000)
        });
        const data = await res.json();
        answer = String(data?.answer || '').trim() || 'Kentsel dönüşüm süreci, kira yardımı, sözleşme veya kullandığımız malzemeler hakkında bilgi verebilirim.';
      } catch {
        answer = 'Şu an bağlantıda kısa bir gecikme var; kentsel dönüşüm, sözleşme veya malzeme listemiz hakkında sorabilirsiniz.';
      }
    }

    this.hooks.onMessage({ role: 'assistant', text: answer, source });
    if (speakResponse) {
      await this.speak(answer);
    }
    return answer;
  }

  stopSpeaking() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
      } catch {}
      this.currentAudio = null;
    }
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {}
      this.activeSource = null;
    }
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    this.setSpeakingState(false);
  }

  setSpeakingState(speaking) {
    this.isSpeaking = Boolean(speaking);
    this.hooks.onSpeakingChange(this.isSpeaking);
    if (!this.isSpeaking && this.shouldKeepListening) {
      setTimeout(() => this.startListening(), 200);
    }
  }

  playMp3(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      this.currentAudio = audio;
      audio.onplay = () => this.setSpeakingState(true);
      audio.onended = () => {
        this.currentAudio = null;
        this.setSpeakingState(false);
        resolve(true);
      };
      audio.onerror = () => {
        this.currentAudio = null;
        this.setSpeakingState(false);
        reject(new Error('MP3_ERROR'));
      };
      audio.play().catch(err => {
        this.currentAudio = null;
        this.setSpeakingState(false);
        reject(err);
      });
    });
  }

  async playSingleFemaleVoice(text) {
    const cleanText = String(text || '').trim();
    if (!cleanText) return false;
    try {
      const res = await fetch(`${YAKUT_CONFIG.workerUrl}/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readAloud: cleanText.slice(0, 1950) }),
        signal: AbortSignal.timeout(15000)
      });
      if (!res.ok) return false;

      const raw = await res.text();
      const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
      const pcmParts = [];
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj?.audio) {
            const bin = atob(obj.audio);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            pcmParts.push(bytes);
          }
        } catch {}
      }
      if (!pcmParts.length) return false;

      const totalLen = pcmParts.reduce((acc, b) => acc + b.length, 0);
      const merged = new Uint8Array(totalLen);
      let pos = 0;
      for (const b of pcmParts) {
        merged.set(b, pos);
        pos += b.length;
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      if (!this.audioCtx) this.audioCtx = new AudioCtx({ sampleRate: 24000 });
      if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();

      const sampleCount = Math.floor(merged.length / 2);
      const audioBuffer = this.audioCtx.createBuffer(1, sampleCount, 24000);
      const channel = audioBuffer.getChannelData(0);
      const view = new DataView(merged.buffer, merged.byteOffset, sampleCount * 2);
      for (let i = 0; i < sampleCount; i++) {
        channel[i] = view.getInt16(i * 2, true) / 32768;
      }

      return await new Promise((resolve) => {
        const src = this.audioCtx.createBufferSource();
        src.buffer = audioBuffer;
        src.connect(this.audioCtx.destination);
        this.activeSource = src;
        this.setSpeakingState(true);
        src.onended = () => {
          if (this.activeSource === src) this.activeSource = null;
          this.setSpeakingState(false);
          resolve(true);
        };
        src.start();
      });
    } catch {
      this.setSpeakingState(false);
      return false;
    }
  }

  async speak(text, mp3Key = null) {
    this.stopSpeaking();

    const mp3Url = mp3Key && YAKUT_CONFIG.mp3Map[mp3Key];
    if (mp3Url) {
      try {
        return await this.playMp3(mp3Url);
      } catch {}
    }

    return this.playSingleFemaleVoice(text);
  }
}

window.YakutAssistant = YakutAssistant;
