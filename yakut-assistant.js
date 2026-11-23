/**
 * YAKUT - Kumtaş İnşaat Tam Cevap, Tek Komut Navigasyon, Anında Karşılama ve MP3/Ses Motoru
 */
const YAKUT_CONFIG = {
  workerUrl: 'https://kumtas-yakut-chat.simgereklam.workers.dev',
  defaultSpeechRate: 1.0,
  // Cevap uzunluğuna sınır yok; MP3 veya ses tam metni okur
  maxSpeechChars: 0,
  mp3Map: {
    // İleride MP3 dosyalarını buraya eklediğinde otomatik olarak öncelikli çalar:
    // merhaba: './audio/merhaba.mp3',
    // nasilsin: './audio/iyiyim-siz-nasilsiniz.mp3',
    // kurumsal_teklif: './audio/kurumsal-teklif.mp3',
    // kurumsal: './audio/kurumsal-detay.mp3',
    // genel_teklif: './audio/genel-teklif.mp3'
  },
  routes: [
    { path: 'kurumsal.html', label: 'Kurumsal sayfasına geçiyorum.', keywords: ['kurumsal', 'kurumsal sayfa', 'kurumsal sayfası', 'hakkımızda', 'hakkimizda', 'firma bilgisi', 'kumtaş kimdir'] },
    { path: 'kentsel-donusum.html', label: 'Kentsel Dönüşüm sayfasına geçiyorum.', keywords: ['kentsel dönüşüm', 'kentsel donusum', 'dönüşüm sayfası', 'riskli bina'] },
    { path: 'projelerimiz.html', label: 'Projelerimiz sayfasına geçiyorum.', keywords: ['projeler', 'projelerimiz', 'binalar', 'örnek projeler'] },
    { path: 'hizmetlerimiz.html', label: 'Hizmetlerimiz sayfasına geçiyorum.', keywords: ['hizmetler', 'hizmetlerimiz', 'neler yapıyorsunuz'] },
    { path: 'bolgeler.html', label: 'Bölgeler sayfasına geçiyorum.', keywords: ['bölgeler', 'bolgeler', 'hangi ilçeler', 'ilçeler'] },
    { path: 'sss.html', label: 'Sıkça Sorulan Sorular sayfasına geçiyorum.', keywords: ['sss', 'sık sorulan', 'sorular'] },
    { path: 'iletisim.html', label: 'İletişim sayfasına geçiyorum.', keywords: ['iletişim', 'iletisim', 'telefon', 'adres', 'keşif'] },
    { path: 'yakut-eimar.html', label: 'YAKUT e-İmar sayfasına geçiyorum.', keywords: ['e-imar', 'e imar', 'imar analizi', 'ada parsel'] },
    { path: 'index.html', label: 'Ana sayfaya geçiyorum.', keywords: ['ana sayfa', 'anasayfa', 'başlangıç'] }
  ]
};

const SMALL_TALK_RESPONSES = [
  {
    key: 'nasilsin',
    triggers: ['nasılsın', 'nasilsin', 'naber', 'ne haber', 'nasıl gidiyor', 'nasil gidiyor', 'keyfin nasıl', 'keyfin nasil'],
    answer: 'İyiyim, teşekkür ederim. Siz nasılsınız? Kentsel dönüşüm süreci, kira ve taşınma yardımları, sözleşme adımları veya kullandığımız malzemeler hakkında nasıl yardımcı olabilirim?'
  },
  {
    key: 'merhaba',
    triggers: ['merhaba', 'selam', 'selamünaleyküm', 'selamunaleykum', 'günaydın', 'gunaydin', 'iyi akşamlar', 'iyi aksamlar', 'iyi günler', 'iyi gunler'],
    answer: 'Merhaba! Ben Yakut, Kumtaş İnşaat asistanıyım. Bugün size nasıl yardımcı olabilirim?'
  },
  {
    key: 'tesekkur',
    triggers: ['teşekkür', 'tesekkur', 'sağ ol', 'sagol', 'sağol', 'eyvallah', 'çok sağol', 'cok sagol'],
    answer: 'Rica ederim, ne demek! Başka bir konuda merak ettiğiniz bir şey varsa memnuniyetle anlatırım.'
  },
  {
    key: 'kimsin',
    triggers: ['sen kimsin', 'adın ne', 'adin ne', 'kimsin'],
    answer: 'Ben Yakut; Kumtaş İnşaat için kentsel dönüşüm süreci, kira ve taşınma yardımları, sözleşme adımları ve malzeme listemiz hakkında bilgi veren dijital asistanınızım.'
  },
  {
    key: 'gorusuruz',
    triggers: ['görüşürüz', 'gorusuruz', 'hoşça kal', 'hosca kal', 'bay bay', 'bye', 'kapat'],
    answer: 'Görüşmek üzere, sağlıklı ve güvenli günler dilerim.'
  }
];

const KUMTAS_KNOWLEDGE = [
  {
    id: 'malzeme_genel',
    topics: ['malzeme', 'marka', 'kalite', '1. sınıf', 'birinci sınıf', 'şartname', 'ek-2', 'liste', 'demir', 'beton', 'asansör', 'doğrama'],
    answer:
      'Kumtaş İnşaat projelerinde 1. sınıf ve standartlara uygun malzemeler kullanıyoruz. İnşaat demirinde S420 nervürlü demir (Kardemir, İçtaş, Habaş veya Diler; İzmir veya İran demiri kullanılmıyor ve test raporları sunuluyor), hazır betonda bakanlık onaylı tedarikçi, mantolamada 5 cm taşyünü (Filli Boya veya İzocam), dış cephede Asaş Naturalbond ve Jotun, doğramada Pimapen Nirvana 3 camlı sistem ve asansörde Schindler tercih ediyoruz.'
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
      'Süreç 6306 sayılı Kanun, 2018 Deprem Yönetmeliği, TS 825 ve en az B sınıfı Enerji Kimlik Belgesi standartlarına göre yapı denetim ve belediye kontrolünde yürütülüyor. Ruhsat aşamasında İmar Müdürlüğüne teminat mektubu ve peşinata karşılık teminat senedi veriyoruz; müteahhit olarak enflasyon veya fiyat farkı talep etmiyoruz, nakit ödemede %20 indirim uyguluyoruz. Teklifte daireler için 1.750.000 TL, dükkanlar için 875.000 TL devlet teşviği ve kredi desteği çerçevesi (malik kredi payı dairede 875.000 TL, dükkanda 437.500 TL sabit) yer alıyor.'
  },
  {
    id: 'kira_tasinma_yardimi',
    topics: ['kira yardımı', 'taşınma yardımı', 'tahliye', 'kiracı', 'malik', 'ev sahibi', 'ne kadar', 'aylık', 'devlet desteği'],
    answer:
      '6306 kapsamındaki dönüşümlerde maliklere aylık kira yardımı, kiracılara ise tahliye ve taşınma desteği sağlanır; tutarlar ve süreler (riskli yapıda 18 aya, riskli alanda 48 aya kadar uzayabilen kira desteği; İstanbul ve il gruplarına göre güncel bakanlık tarifesi ve Yarısı Bizden kampanyası koşulları) başvuru tarihindeki güncel mevzuata göre belirlenir. Başvuruda kimlik, tapu veya kira belgesi, riskli yapı raporu, tahliye ve ikametgah belgesi ile banka IBAN bilgisi istenir.'
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
      'Kentsel dönüşüm; lisanslı kuruluşça riskli yapı tespiti ve raporun kesinleşmesi, tahliye ve yıkım işlemleri, proje ve ruhsat süreci ve yeni binanın inşası adımlarıyla ilerler. Bağcılar, Bahçelievler ve Yenibosna başta olmak üzere İstanbul genelinde ada ve parsel verilerine göre ücretsiz ön değerlendirme yapıyoruz.'
  },
  {
    id: 'iletisim_bilgi',
    topics: ['iletişim', 'telefon', 'numara', 'ulaş', 'mail', 'eposta', 'e-posta', 'randevu', 'keşif'],
    answer:
      'Bize 0 212 955 5599 veya 0543 181 34 85 numaralı telefonlardan ya da info@kumtas.com.tr adresinden ulaşabilir, sayfadaki form üzerinden ücretsiz keşif ve ön değerlendirme talep edebilirsiniz.'
  }
];

class YakutAssistant {
  constructor(hooks = {}) {
    this.hooks = {
      onMessage: hooks.onMessage || (() => {}),
      onSpeakingChange: hooks.onSpeakingChange || (() => {}),
      onNavigate: hooks.onNavigate || null,
      onError: hooks.onError || (() => {})
    };
    this.currentAudio = null;
    this.isSpeaking = false;
    this.pendingOffer = null;
    this.greetedOnce = false;
    this.history = [];
    this.safetyTimer = null;
    this.navTimer = null;
  }

  normalize(str) {
    return String(str || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  detectPageSection() {
    const path = this.normalize(window.location.pathname + ' ' + document.title);
    if (path.includes('kurumsal') || path.includes('hakkimizda')) {
      return {
        key: 'kurumsal',
        title: 'Kurumsal ve Hakkımızda',
        offer: 'Kurumsal sayfasındayız; Kumtaş İnşaat ve sunduğumuz güvenceler hakkında bilgi vermemi ister misiniz?',
        detail:
          'Kumtaş İnşaat Hafriyat Madencilik Tic. San. Ltd. Şti. olarak 6306 sayılı Kanun ve deprem yönetmeliğine uygun güvenli yapılar üretiyoruz. Ruhsatta teminat mektubu, peşinata teminat senedi sunuyor ve fiyat farkı talep etmiyoruz.'
      };
    }
    if (path.includes('malzeme') || path.includes('teknik') || path.includes('teklif')) {
      return {
        key: 'malzeme',
        title: 'Malzeme ve Teknik Özellikler',
        offer: 'Malzeme ve teknik detaylar sayfasındayız; kullandığımız demir, beton, kombi, yerden ısıtma ve ankastre özelliklerini anlatmamı ister misiniz?',
        detail: KUMTAS_KNOWLEDGE[0].answer + ' ' + KUMTAS_KNOWLEDGE[1].answer + ' ' + KUMTAS_KNOWLEDGE[2].answer
      };
    }
    if (path.includes('imar')) {
      return {
        key: 'imar',
        title: 'İmar ve Dönüşüm Bilgileri',
        offer: 'İmar sayfasındayız; kira yardımı, taşınma yardımı ve sözleşme süreci hakkında bilgi vermemi ister misiniz?',
        detail: KUMTAS_KNOWLEDGE[4].answer + ' ' + KUMTAS_KNOWLEDGE[5].answer
      };
    }
    return {
      key: 'genel',
      title: 'Kentsel Dönüşüm Danışmanı',
      offer: 'Merhaba, ben Yakut. Kurumsal veya diğer sayfalarımıza geçmek isterseniz söyleyebilirsiniz; kentsel dönüşüm, kira yardımı, sözleşme veya malzeme listemiz hakkında bilgi vermemi ister misiniz?',
      detail: KUMTAS_KNOWLEDGE[6].answer + ' ' + KUMTAS_KNOWLEDGE[0].answer + ' ' + KUMTAS_KNOWLEDGE[4].answer
    };
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

  navigateTo(targetPath, label) {
    if (this.navTimer) {
      clearTimeout(this.navTimer);
      this.navTimer = null;
    }
    this.stopSpeaking();
    this.hooks.onMessage({ role: 'assistant', text: label, source: 'navigation' });
    if (typeof this.hooks.onNavigate === 'function') {
      this.hooks.onNavigate(targetPath, label);
    }
    this.navTimer = setTimeout(() => {
      window.location.href = targetPath;
    }, 150);
  }

  async greetOnPageOpen({ autoSpeak = true, force = false } = {}) {
    if (this.greetedOnce && !force) return this.pendingOffer?.offer || null;
    this.greetedOnce = true;

    const sec = this.detectPageSection();
    this.pendingOffer = {
      sectionKey: sec.key,
      sectionTitle: sec.title,
      offer: sec.offer,
      text: sec.detail
    };
    this.hooks.onMessage({ role: 'assistant', text: sec.offer, source: 'page-offer' });
    if (autoSpeak) {
      this.speak(sec.offer, `${sec.key}_teklif`);
    }
    return sec.offer;
  }

  isAffirmative(cleanText) {
    const yesWords = [
      'evet', 'isteriz', 'isterim', 'anlat', 'oku', 'olur', 'tamam',
      'tabii', 'tabi', 'evet anlat', 'evet oku', 'lütfen', 'hadi', 'devam'
    ];
    return yesWords.some(w => cleanText === w || cleanText.startsWith(w + ' '));
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

  getPageContextText() {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map(el => el.textContent?.trim())
      .filter(Boolean)
      .slice(0, 8)
      .join(' | ');
    const bodyText = (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 1200);
    return `Sayfa: ${document.title} (${window.location.pathname}). Başlıklar: ${headings}. İçerik özeti: ${bodyText}`.slice(0, 1450);
  }

  async handleUserMessage(rawQuestion, { speakResponse = true } = {}) {
    const question = String(rawQuestion || '').trim();
    if (!question) return null;

    this.stopSpeaking();

    this.hooks.onMessage({ role: 'user', text: question, source: 'user' });
    this.history.push({ role: 'user', text: question });
    this.history = this.history.slice(-8);

    const clean = this.normalize(question);

    // 1. Tek komutla sayfa açma ("kurumsal", "iletişim", "bölgeler" vb.)
    const navMatch = this.findNavigationRoute(clean);
    if (navMatch && !navMatch.alreadyHere) {
      this.navigateTo(navMatch.path, navMatch.label);
      return navMatch.label;
    }
    if (navMatch && navMatch.alreadyHere) {
      const samePageMsg = 'Zaten bu sayfadayız; ne konuda bilgi vermek istersiniz?';
      this.hooks.onMessage({ role: 'assistant', text: samePageMsg, source: 'navigation' });
      if (speakResponse) this.speak(samePageMsg);
      return samePageMsg;
    }

    // 2. Günlük sohbet / selamlaşma / hal-hatır
    const smallTalk = this.findSmallTalk(clean);
    if (smallTalk) {
      this.history.push({ role: 'assistant', text: smallTalk.answer });
      this.history = this.history.slice(-8);
      this.hooks.onMessage({ role: 'assistant', text: smallTalk.answer, source: 'small-talk' });
      if (speakResponse) {
        this.speak(smallTalk.answer, smallTalk.key);
      }
      return smallTalk.answer;
    }

    let answer = null;
    let mp3Key = null;
    let source = 'local';

    // 3. Açılış teklifine onay ("evet", "isteriz", "anlat")
    if (this.pendingOffer && this.isAffirmative(clean)) {
      answer = this.pendingOffer.text;
      mp3Key = this.pendingOffer.sectionKey;
      this.pendingOffer = null;
      source = 'section-detail';
    }

    // 4. Yerel bilgi bankası (sınırsız tam metin)
    if (!answer) {
      answer = this.findLocalKnowledgeAnswer(question);
    }

    // 5. Yerel bilgi bankasında yoksa Worker /chat hattına sor
    if (!answer) {
      source = 'worker-chat';
      try {
        const res = await fetch(`${YAKUT_CONFIG.workerUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            reference: this.getPageContextText(),
            history: this.history,
            research: true
          }),
          signal: AbortSignal.timeout(8000)
        });
        const data = await res.json();
        answer = data?.answer || 'Bu konuda şu an net bir bilgiye ulaşamadım; dilerseniz kentsel dönüşüm, sözleşme, kira ve taşınma yardımı veya malzeme listemiz hakkında sorabilirsiniz.';
      } catch {
        answer = 'Şu an yanıt biraz gecikti; kurumsal sayfa, malzeme listesi, kira yardımı veya sözleşme konularında hemen yardımcı olabilirim.';
        source = 'fallback';
      }
    }

    this.history.push({ role: 'assistant', text: answer });
    this.history = this.history.slice(-8);
    this.hooks.onMessage({ role: 'assistant', text: answer, source });

    if (speakResponse) {
      this.speak(answer, mp3Key);
    }

    return answer;
  }

  stopSpeaking() {
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
      } catch {}
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.setSpeakingState(false);
  }

  setSpeakingState(speaking) {
    this.isSpeaking = Boolean(speaking);
    this.hooks.onSpeakingChange(this.isSpeaking);
  }

  playMp3(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      this.currentAudio = audio;

      const cleanup = () => {
        if (this.safetyTimer) {
          clearTimeout(this.safetyTimer);
          this.safetyTimer = null;
        }
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        this.setSpeakingState(false);
      };

      // Uzun MP3 dosyalarının kesilmemesi için geniş süre (5 dakika)
      this.safetyTimer = setTimeout(() => {
        cleanup();
        reject(new Error('MP3_TIMEOUT'));
      }, 300000);

      audio.onplay = () => this.setSpeakingState(true);
      audio.onended = () => {
        cleanup();
        resolve(true);
      };
      audio.onerror = () => {
        cleanup();
        reject(new Error('MP3_ERROR'));
      };

      audio.play().catch(err => {
        cleanup();
        reject(err);
      });
    });
  }

  speakFallbackBrowser(text) {
    return new Promise((resolve) => {
      const fullText = YAKUT_CONFIG.maxSpeechChars > 0
        ? String(text || '').slice(0, YAKUT_CONFIG.maxSpeechChars)
        : String(text || '');

      if (!fullText || !('speechSynthesis' in window)) {
        this.setSpeakingState(false);
        resolve(false);
        return;
      }

      try {
        window.speechSynthesis.cancel();
      } catch {}

      const utter = new SpeechSynthesisUtterance(fullText);
      utter.lang = 'tr-TR';
      utter.rate = YAKUT_CONFIG.defaultSpeechRate;

      const voices = window.speechSynthesis.getVoices?.() || [];
      const trVoice = voices.find(v => String(v.lang || '').toLowerCase().startsWith('tr'));
      if (trVoice) utter.voice = trVoice;

      const finish = (ok) => {
        if (this.safetyTimer) {
          clearTimeout(this.safetyTimer);
          this.safetyTimer = null;
        }
        this.setSpeakingState(false);
        resolve(ok);
      };

      // Uzun cevapların yarım kalmaması için geniş güvenlik süresi
      this.safetyTimer = setTimeout(() => {
        try { window.speechSynthesis.cancel(); } catch {}
        finish(false);
      }, Math.max(25000, fullText.length * 140));

      utter.onstart = () => this.setSpeakingState(true);
      utter.onend = () => finish(true);
      utter.onerror = () => finish(false);

      try {
        window.__YAKUT_ALLOW_NATIVE_SPEECH__ = true;
        window.speechSynthesis.speak(utter);
      } catch {
        finish(false);
      } finally {
        setTimeout(() => {
          window.__YAKUT_ALLOW_NATIVE_SPEECH__ = false;
        }, 50);
      }
    });
  }

  async speak(text, mp3Key = null) {
    this.stopSpeaking();

    const mp3Url = mp3Key && YAKUT_CONFIG.mp3Map[mp3Key];
    if (mp3Url) {
      try {
        await this.playMp3(mp3Url);
        return true;
      } catch {}
    }

    return this.speakFallbackBrowser(text);
  }
}

window.YakutAssistant = YakutAssistant;
