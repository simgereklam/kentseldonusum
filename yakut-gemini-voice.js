/* Yakut audio is generated exclusively by Emel via the protected Worker. */
(() => {
'use strict';
if(window.YakutGeminiVoice)return;
class YakutGeminiVoice{
 constructor({endpoint,onStart=()=>{},onEnd=()=>{},onError=()=>{}}={}){
  this.endpoint=endpoint;
  this.onStart=onStart;this.onEnd=onEnd;this.onError=onError;
  this.context=null;this.analyser=null;this.samples=null;
  this.cache=new Map();
  this.generation=0;this.controller=null;this.sources=new Set();this.playing=false;
 }
 unlock(){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return Promise.resolve(false);
  try{
   if(!this.context)this.context=new Audio();
   const resume=this.context.state==='running'?Promise.resolve():this.context.resume();
   return Promise.resolve(resume).then(()=>this.context.state==='running').catch(()=>false);
  }catch(error){this.onError(error);return Promise.resolve(false);}
 }
 get ready(){return this.context?.state==='running';}
 getLevel(){
  if(!this.playing||!this.analyser)return 0;
  if(!this.samples)this.samples=new Uint8Array(this.analyser.fftSize);
  this.analyser.getByteTimeDomainData(this.samples);
  let sum=0;for(const sample of this.samples){const n=(sample-128)/128;sum+=n*n;}
  return Math.min(1,Math.sqrt(sum/this.samples.length)*6);
 }
 split(text,max=450){
  const words=String(text||'').trim().split(/\s+/).filter(Boolean);
  const pieces=[];let current='';
  for(const word of words){
   if(current&&current.length+word.length+1>max){pieces.push(current);current='';}
   current=current?current+' '+word:word;
  }
  if(current)pieces.push(current);
  return pieces;
 }
 stop(){
  ++this.generation;
  this.controller?.abort();this.controller=null;
  for(const item of this.sources){
   try{item.source.stop()}catch(_){}
   item.finish();
  }
  this.sources.clear();
  this.playing=false;this.onEnd(false);
 }
 compactPauses(buffer){
  const rate=buffer.sampleRate,step=Math.max(1,Math.floor(rate*.01)),channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
  const cuts=[];let quiet=-1;
  for(let p=0;p<buffer.length;p+=step){
   let peak=0;for(const ch of channels)for(let j=p;j<Math.min(p+step,buffer.length);j++)peak=Math.max(peak,Math.abs(ch[j]));
   if(peak<0.003){if(quiet<0)quiet=p;}else if(quiet>=0){
    if(quiet>0&&p-quiet>rate*.45)cuts.push([quiet+Math.floor(rate*.12),p-Math.floor(rate*.12)]);
    quiet=-1;
   }
  }
  if(!cuts.length)return buffer;
  const out=this.context.createBuffer(buffer.numberOfChannels,buffer.length-cuts.reduce((n,[a,b])=>n+b-a,0),rate);
  for(let c=0;c<channels.length;c++){let from=0,to=0;const dest=out.getChannelData(c);for(const [a,b] of cuts){dest.set(channels[c].subarray(from,a),to);to+=a-from;from=b;}dest.set(channels[c].subarray(from),to);}
  return out;
 }
 async speak(text,{beforePlayback,chunkSize=180}={}){
  this.stop();
  const token=this.generation,parts=this.split(text,chunkSize);
  if(!parts.length)return false;
  if(!this.ready){this.onError(new Error('AUDIO_LOCKED'));return false;}
  const controller=new AbortController();this.controller=controller;
  let started=false,success=false;
  let timeout=null;
  try{
   const load=async phrase=>{
    if(this.cache.has(phrase))return this.cache.get(phrase);
    const recordings={"2004 yılında kurulan Kumtaş İnşaat, 22 yıllık hizmet geçmişiyle Türkiye’nin farklı bölgelerinde inşaat, taahhüt, madencilik, hafriyat ve konut üretimi alanlarında faaliyet göstermektedir. Faaliyet alanlarımız: İnşaat taahhüt projeleri, madencilik ve hafriyat hizmetleri, konut ve ticari yapılar, sanayi yapıları, soğuk hava depoları ve antrepolar. Öne çıkan referanslarımız: Bursa Şişecam Fabrikası. 2004 yılından bu yana aralıksız iş ortaklığı. Kumtaş İnşaat, Bursa Şişecam tesislerinde sürekli taahhüt işleri yürütmekte olup, aynı sahada yerleşik şube ofisi ve makine parkuru bulundurmaktadır. Konut projeleri: 50 konut ve ticari alan projeleri başarıyla tamamlanmış ve sahiplerine teslim edilmiştir.":"a26d9d04864e714e13e6d547.mp3","Ana sayfadayız. Burada ücretsiz ön değerlendirme talebi gönderebilir, hizmet bölgelerini inceleyebilir ve E-İmar hesabını açabilirsiniz.":"944242cb9aa6be2e7e426067.mp3","Avcılar Kentsel Dönüşüm sayfasındayız. Merkez, Cihangir ve Denizköşkler çevresinde, zemin koşulları ve bina yaşı dikkate alınarak ön değerlendirme yapılabilir.":"569fe9d41a3e4dbff1a126f2.mp3","Bahçelievler Kentsel Dönüşüm sayfasındayız. Siyavuşpaşa, Çobançeşme, Hürriyet ve çevresindeki binalarda mevcut daire hakları, arsa payları ve metrekare dengesi değerlendirilir.":"df7371bddcde73f17493dfce.mp3","Bakıp size haber vereceğim. Lütfen biraz bekleyin.":"95adab7979a4a5e55c7ac428.mp3","Bakırköy Kentsel Dönüşüm sayfasındayız. İncirli, Osmaniye ve Kartaltepe çevresinde bina yenileme ön incelemesi yapılabilir. Arsa değeri, imar hakkı ve malik beklentileri birlikte değerlendirilir.":"a956820c3498c253ef6574f2.mp3","Bağcılar Kentsel Dönüşüm sayfasındayız. Güneşli, Mahmutbey, Bağlar, Demirkapı ve Kirazlı dahil çevredeki binalar için arsa alanı, mevcut daire sayısı ve imar durumu incelenir.":"e317d7bef2d636cbe6039c25.mp3","Başvuru sayfasındayız. İlçe, mahalle, ada parsel ve bina bilgilerinizi girerek ücretsiz ön değerlendirme isteyebilirsiniz. Gönder düğmesi bilgileri WhatsApp mesajına dönüştürür.":"dba47d884a2f01e89272856e.mp3","Binanızı yıkmadan önce haklarınızı netleştirin. Süreç sade, anlaşılır ve maliklerin karar verebileceği şekilde ilerler. Birinci aşama, ön görüşme. İlçe, mahalle, ada parsel, daire metrekare ve bina bilgileri alınır. İkinci aşama, imar ve fizibilite. Arsa alanı, mevcut ruhsat, kat adedi ve yapılabilir proje modeli incelenir. Üçüncü aşama, malik bilgilendirme. Kat karşılığı model, metrekare dengesi ve teslim şartları anlatılır. Dördüncü aşama, sözleşme ve teminat. Noter onaylı sözleşme, teminat ve malzeme standardı netleştirilir. Beşinci aşama, yıkım ve ruhsat. Yasal süreçler, ruhsat hazırlığı ve kontrollü yıkım planlanır. Altıncı aşama, yeni bina teslimi. Kaba inşaat, ince işler, dış cephe ve anahtar teslim süreci tamamlanır.":"ae3347bdc05d354f158b9efe.mp3","Bu sayfa hakkında daha fazla bilgi ister misiniz?":"ca09d72420548a1564091cce.mp3","Bölgeler sayfasındayız. Yenibosna, Bahçelievler, Bakırköy, Bağcılar, Güngören, Avcılar, Esenler, Küçükçekmece ve Zeytinburnu için ayrı sayfalarımız var.":"fc03aba7f9858ef0d5ebb127.mp3","Bölgelerimiz sayfasındayız. İlçenizi seçerek hizmetleri ve binanız için ön değerlendirmede istenen bilgileri inceleyebilirsiniz.":"c2c50044cac946fe182754b4.mp3","E-posta adresimiz. İnfo, et işareti, kumtaş, nokta com, nokta te re.":"31de21eda66eed6451850f47.mp3","E-posta adresimiz: info, et işareti, kumtas, nokta, com, nokta, tr.":"56f31f0dabd09701d6bc214b.mp3","E-İmar ve Ön Proje sayfasındayız. Bağcılar ve Bahçelievler için mahalle, ada ve parsel bilgisiyle belediyeyi sorgulayabilirsiniz. Net parsel alanı, TAKS ve emsal değerleriyle alan hesabı yapabilirsiniz.":"c713dabe7c06395bf228b846.mp3","Efendim, dinliyorum.":"912142dbc30b97c0af9a781b.mp3","Esenler Kentsel Dönüşüm sayfasındayız. Menderes, Nenehatun ve Fevzi Çakmak çevresinde bina yenileme, imar incelemesi ve malik görüşmeleri hakkında bilgi alabilirsiniz.":"5fbe155e3c9da32920e5c196.mp3","Evet, sizi dinliyorum.":"68b8a7c71167b80783bb85eb.mp3","Görüşmek üzere, kendinize iyi bakın.":"cee4592c7bfa0957312cb811.mp3","Günaydın, güzel bir gün geçirmenizi dilerim.":"14efdae5335f4f9cdb4a346a.mp3","Güngören Kentsel Dönüşüm sayfasındayız. Merkez, Sanayi ve Tozkoparan çevresinde bina yenileme için malik anlaşması, metrekare dengesi ve ruhsat süreci değerlendirilir.":"5b8da641df8972a8304f611b.mp3","Her zaman yardımcı olmaktan mutluluk duyarım.":"0ed09916e1bd9a527c26da56.mp3","Hizmetlerimiz sayfasındayız. Ücretsiz ön değerlendirme, imar ve ada parsel incelemesi, kat karşılığı inşaat, sözleşme ve anahtar teslim bina yenileme hizmetlerimizi burada inceleyebilirsiniz.":"5bf3f22cf5ccee32700e7168.mp3","Kentsel Dönüşüm sayfasındayız. Süreç ön görüşme ve imar incelemesiyle başlar. Malik hakları, metrekare dengesi, sözleşme, teminat ve teslim şartları birlikte değerlendirilir.":"6891adc1b261a6e050f236a6.mp3","Kurumsal sayfasındayız. Kumtaş İnşaat iki bin dört yılında kuruldu. İnşaat, taahhüt, madencilik, hafriyat ve konut üretimi alanlarında çalışıyor.":"454a1132a7e95aeab307da86.mp3","Küçükçekmece Kentsel Dönüşüm sayfasındayız. Sefaköy, Halkalı ve Kanarya çevresinde arsa alanı, daire metrekareleri ve proje seçenekleri değerlendirilir.":"05c558ccbb4bc6ab86f0329d.mp3","Maliklerin arsa payı, mevcut daire metrekareleri, imar hakkı ve yeni projedeki bağımsız bölümler birlikte değerlendirilir. Teslim şartları, teminat ve malzeme standardı sözleşmede açıklığa kavuşturulur.":"672120fd8da7c53727d041bc.mp3","Merhaba, hoş geldiniz. Ben Kumtaş İnşaat dijital asistanınız Yakut. Sizin için ne yapabilirim?":"37b32e64c7aed32e0b71fe66.mp3","Merhaba, sizi dinliyorum.":"c9edcaa06d6c550f1a5a7a35.mp3","Merkez adresimiz Kocasinan Merkez Mahallesi, Mahmutbey Caddesi, numara iki yüz kırk beş bölü A, Bahçelievler, İstanbul.":"a68fdc66fc5a00512fb966df.mp3","Ofis sabit telefon numaramız. Sıfır. İki, bir, iki. Dokuz, beş, beş. Beş, beş. Dokuz, dokuz.":"a2f946bd0cf6e0c0cd6be56d.mp3","Ofisimiz İstanbul Bahçelievler'de. Kocasinan Merkez Mahallesi, Mahmutbey Caddesi, bina numarası iki yüz kırk beş, A harfi.":"650f9de2b3f8f24157aeac0b.mp3","Peki, ihtiyacınız olduğunda buradayım.":"f3006266a948ba21fd75be39.mp3","Projelerimiz sayfasındayız. Tamamlanan, devam eden ve örnek çalışmalarımızı burada görebilirsiniz. Kendi binanız için ilçe, mahalle, ada parsel ve daire bilgileriyle ön değerlendirme isteyebilirsiniz.":"7cc1c67de8f16426f26a0229.mp3","Rica ederim, her zaman buradayım.":"53a18fdc2d14aff39b6e11b8.mp3","Rica ederim, ne demek.":"3f935ad82bdda3814fab1733.mp3","Riskli yapı değerlendirmesinde binanın deprem güvenliği ve teknik durumu incelenir. Binanız için ilk görüşmede bina yaşı, kat sayısı, arsa ve daire bilgileriyle ön değerlendirme isteyebilirsiniz.":"4f7377ee9486cdfdb85c4975.mp3","Sık Sorulan Sorular sayfasındayız. Burada riskli yapı, kat karşılığı inşaat, malik hakları, teminat, metrekare dengesi ve teslim süreci hakkında yanıtlar var.":"85a4cc60feb5703a82f941c0.mp3","Tabii ki, size yardımcı olayım.":"cbf51f71cae8b2fae8676f74.mp3","Tabii, bekliyorum.":"fac58b394ac8bee2056bd7d5.mp3","Tabii, hangi kısmı daha anlaşılır anlatmamı istersiniz?":"af3440a3f30a848572241770.mp3","Teşekkür ederim, çok naziksiniz.":"83b9f806eeef385ba114ac7f.mp3","WhatsApp cep telefonu numaramız. Sıfır. Beş, dört, üç. Bir, sekiz, bir. Üç, dört. Sekiz, beş.":"a8bbea4d5a7678e232fa34d1.mp3","Yenibosna Kentsel Dönüşüm sayfasındayız. Çobançeşme, Zafer ve Hürriyet çevresinde ada parsel, arsa alanı ve daire metrekareleriyle bina yenileme ön değerlendirmesi yapılır.":"8cc529910a965fca5e08e9b5.mp3","Zeytinburnu Kentsel Dönüşüm sayfasındayız. Merkezefendi, Sümer ve Telsiz çevresindeki binalar için imar şartları ve kat karşılığı yenileme seçenekleri incelenir.":"ad9c5639554e04e3e7e4e613.mp3","Çok teşekkür ederim.":"7ed3f9f676e7036d5da20397.mp3","İletişim sayfasındayız. Buradan ücretsiz ön değerlendirme isteyebilir, ofis adresimize, sabit telefonumuza ve WhatsApp hattımıza ulaşabilirsiniz.":"2fe951fec929992a7a683ebe.mp3","İyi akşamlar, hoş geldiniz.":"ce89f00cf6cf5cd211460415.mp3","İyiyim, teşekkür ederim. Siz nasılsınız?":"878bb23b02b0920dc5b2879d.mp3","Şu anda canlı ses bağlantısına erişemiyorum. İsterseniz bulunduğumuz sayfayı, hizmetlerimizi veya iletişim bilgilerimizi anlatabilirim.":"8331ca7cddcc285519632f55.mp3"};
    const file=recordings[phrase];
    if(file){
     try{
      const local=await fetch(new URL('yakut-sesler/'+file,location.origin+'/'),{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(2500)])});
      if(local.ok){
       const audio=await this.context.decodeAudioData(await local.arrayBuffer());
       if(token!==this.generation)return null;
       this.cache.set(phrase,audio);return audio;
      }
     }catch(error){if(controller.signal.aborted)return null;}
    }
    if(controller.signal.aborted)return null;
    const response=await fetch(new URL('/live',this.endpoint),{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({readAloud:phrase}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(65000)])
    });
    if(!response.ok)throw new Error('EMEL_VOICE_HTTP_'+response.status);
    if(!response.headers.get('Content-Type')?.includes('audio/mpeg'))throw new Error('EMEL_AUDIO_FORMAT');
    const bytes=await response.arrayBuffer();
    if(token!==this.generation)return null;
    const buffer=this.compactPauses(await this.context.decodeAudioData(bytes));
    if(this.cache.size>=12)this.cache.delete(this.cache.keys().next().value);
    this.cache.set(phrase,buffer);return buffer;
   };
   const pending=new Map();
   const prefetch=i=>{if(i<parts.length&&!pending.has(i))pending.set(i,load(parts[i]).then(buffer=>({buffer}),error=>({error})));};
   prefetch(0);prefetch(1);
   for(let i=0;i<parts.length;i++){
    if(token!==this.generation)return false;
    const result=await pending.get(i);
    pending.delete(i);
    if(result.error)throw result.error;
    const buffer=result.buffer;
    if(token!==this.generation||!buffer)return false;
    prefetch(i+1);prefetch(i+2);
    if(!this.analyser){
      this.analyser=this.context.createAnalyser();
      this.analyser.fftSize=512;
      this.analyser.connect(this.context.destination);
    }
    const source=this.context.createBufferSource();
    source.buffer=buffer;source.connect(this.analyser);
    let finish;
    const played=new Promise(resolve=>{finish=resolve;});
    const entry={source,finish};this.sources.add(entry);
    source.onended=()=>{this.sources.delete(entry);finish();};
    if(!started&&beforePlayback){
     await beforePlayback();
     if(token!==this.generation||controller.signal.aborted)return false;
    }
    source.start();
    if(!started){started=true;this.playing=true;this.onStart();}
    await played;
   }
   success=token===this.generation&&started;
   return success;
  }catch(error){
   if(token===this.generation&&!controller.signal.aborted)this.onError(error);
   return false;
  }finally{
   clearTimeout(timeout);
   controller.abort();
   if(token===this.generation){
    if(!success){
     for(const item of this.sources){try{item.source.stop()}catch(_){}item.finish();}
     this.sources.clear();
    }
    this.controller=null;this.playing=false;this.onEnd(success);
   }
  }
 }
}
window.YakutGeminiVoice=YakutGeminiVoice;
})();
