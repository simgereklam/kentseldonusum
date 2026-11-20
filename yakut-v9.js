/* KUMTAS YAKUT V9: genuine GLB animated visitor companion.
 * Runs on homepage; original site layout and background video stay unchanged. */
(() => {
'use strict';
if(window.__yakutV9)return;window.__yakutV9=true;
const url=new URL('YAKUT_V9.glb',document.currentScript.src).href;
const welcome='Merhaba, ben KUMTAŞ İnşaat asistanınız YAKUT. Size yardımcı olmak için buradayım.';
const css=document.createElement('style');
css.textContent=`
#yakut-v9{position:fixed;left:-35px;bottom:70px;width:clamp(195px,22vw,290px);height:clamp(315px,40vw,445px);z-index:110;pointer-events:none;will-change:transform;filter:drop-shadow(0 6px 12px #001c3273)}
#yakut-v9 canvas{display:block;width:100%;height:100%}
/* YAKUT is a voice-only on-page character: no caption, chat box, or buttons. */
#yakut-v9-ui,#yakut-v9-caption{display:none!important}
#yakut-v9-ui{position:fixed;bottom:14px;left:3px;z-index:130;display:flex;gap:6px;align-items:center;max-width:calc(100vw - 24px);font:600 13px Arial,sans-serif}
#yakut-v9-ui button{border:1px solid #4fb3e9;background:#095983;color:#fff;border-radius:18px;padding:9px 12px;cursor:pointer;box-shadow:0 3px 10px #0003}
#yakut-v9-ui button:hover{background:#137aaa}
#yakut-v9-ui input{display:none;width:min(320px,45vw);padding:9px;border:1px solid #71c8fa;border-radius:14px;background:#fff;color:#122f44;font:13px Arial,sans-serif}
#yakut-v9-ui.open input{display:block}
#yakut-v9-caption{position:fixed;bottom:65px;left:4px;max-width:min(260px,75vw);z-index:131;display:none;background:#073b5cf2;color:#fff;padding:8px 10px;border:1px solid #6dccff;border-radius:12px;font:12px/1.45 Arial,sans-serif;box-shadow:0 5px 15px #0004}
#yakut-v9-caption.shown{display:block}
@media(max-width:650px){#yakut-v9{width:175px;height:282px;bottom:62px;left:-23px}#yakut-v9-ui{bottom:8px;left:3px;gap:4px}#yakut-v9-ui button{padding:8px;font-size:12px}#yakut-v9-ui input{width:min(180px,41vw)}#yakut-v9-caption{bottom:52px;left:3px;max-width:80vw}}
@media(prefers-reduced-motion:reduce){#yakut-v9{transition:none!important}}
`;
document.head.appendChild(css);
const stage=document.createElement('div');stage.id='yakut-v9';stage.setAttribute('aria-label','Hareketli 3D YAKUT asistanı');
stage.appendChild(document.createElement('canvas'));
const ui=document.createElement('div');ui.id='yakut-v9-ui';
ui.innerHTML='<button id="yakut-voice" type="button" aria-label="Karşılama sesini aç" hidden>🔊 Sesi Aç</button><button id="yakut-talk" type="button" aria-label="Mikrofon izni ver" hidden>🎤 İzin Ver</button><button id="yakut-close" type="button" aria-label="YAKUT’u gizle">✕</button>';
const caption=document.createElement('div');caption.id='yakut-v9-caption';
document.body.append(stage,caption,ui);
const voiceButton=ui.querySelector('#yakut-voice'),talk=ui.querySelector('#yakut-talk'),close=ui.querySelector('#yakut-close');
let THREE,model,mixer,face,clips={},current=null,ready=false,hidden=false,speaking=false,recognition=null,listenEnabled=false,micStarting=false,listenRetry=null,visitorInteracted=false;
let siteSections=[],siteLoaded=false,siteLoadPromise=null,preferredVoice=null,openingGreeted=false,openingSpoken=false,voiceEnabled=false;
let micFailureCount=0,micLastError='',micRestartAt=0;
let processingSpeech=false;
let phase='loading',posX=-280,targetX=0,walkTimer=0,phaseTime=0,turnRight=true,dialogTimer=0,normalScale=1,basePosition=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function show(text,ms=7000){/* No on-screen text by design. Keep speech and diagnostic logs separate. */}
function play(name,once=false,speed=1){if(!THREE||!clips[name])return false;
const next=clips[name];if(current&&current!==next)current.fadeOut(.22);
next.reset().setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity).setEffectiveTimeScale(speed).setEffectiveWeight(1).fadeIn(.22).play();
next.clampWhenFinished=!!once;current=next;return true;
}

/* KUMTAS site knowledge: searchable extracts from the actual published pages.
   This is grounded retrieval, not a connection to a general-purpose AI model. */
const sitePages=[
'index.html','kurumsal.html','hakkimizda.html','kentsel-donusum.html',
'hizmetlerimiz.html','sss.html','projelerimiz.html','iletisim.html',
'bolgelerimiz.html','yenibosna-kentsel-donusum.html','bahcelievler-kentsel-donusum.html',
'bakirkoy-kentsel-donusum.html','bagcilar-kentsel-donusum.html',
'gungoren-kentsel-donusum.html','avcilar-kentsel-donusum.html',
'esenler-kentsel-donusum.html','kucukcekmece-kentsel-donusum.html',
'zeytinburnu-kentsel-donusum.html'
];
const stopWords=new Set('ben sen siz bize bana sana nasıl nedir ne neden nerede hangi hakkında bilgi verir misin istiyorum anlat açıkla açıklar mısın olabilir için ile veya daha biraz bir iki çok bu şu o da de ve ya da olan olarak var mı mı mu mü dir dır'.split(/\s+/));
function tokens(s){return [...new Set(String(s).toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü0-9\s]/gi,' ').split(/\s+/).filter(w=>w.length>2&&!stopWords.has(w)))];}
function cleanText(el){return (el.textContent||'').replace(/\s+/g,' ').trim();}
async function loadSiteKnowledge(){
 if(siteLoadPromise)return siteLoadPromise;
 siteLoadPromise=(async()=>{
  const pages=await Promise.allSettled(sitePages.map(async path=>{
   const response=await fetch(new URL(path,location.origin+'/'),{cache:'no-store'});
   if(!response.ok)throw Error(path+' '+response.status);
   const html=await response.text();
   const doc=new DOMParser().parseFromString(html,'text/html');
   doc.querySelectorAll('script,style,nav,header,footer,form,button,svg,noscript,aside,select,option').forEach(n=>n.remove());
   let heading='',output=[];
   doc.body?.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd').forEach(el=>{
    if(el.closest('p,li,dd,dt')!==null && el.closest('p,li,dd,dt')!==el)return;
    const txt=cleanText(el);if(!txt||txt.length<20||txt.length>700)return;
    if(/^H[1-4]$/.test(el.tagName)){heading=txt;return}
    if(/^(ana sayfa|whatsapp|telefon|tüm hakları saklıdır)/i.test(txt))return;
    output.push({path,heading,text:txt});
   });
   return output.slice(0,90)
  }));
  siteSections=pages.filter(p=>p.status==='fulfilled').flatMap(p=>p.value).slice(0,850);
  siteLoaded=siteSections.length>0;
  return siteSections;
 })();
 return siteLoadPromise;
}
function siteAnswer(q){
 const words=tokens(q);
 if(!siteLoaded||words.length===0)return null;
 const ranked=siteSections.map(x=>{
  const all=(x.heading+' '+x.text+' '+x.path.replace(/[-.]/g,' ')).toLocaleLowerCase('tr-TR');
  let score=0;
  for(const word of words){
   const stem=word.length>5?word.slice(0,-2):word;
   if(all.includes(word))score+=4;
   else if(stem.length>3&&all.includes(stem))score+=2;
   if(x.heading.toLocaleLowerCase('tr-TR').includes(stem))score+=4;
  }
  if(x.path.includes('sss'))score+=.2;
  return {...x,score};
 }).filter(x=>x.score>=Math.max(3,words.length*1.6)).sort((a,b)=>b.score-a.score);
 if(!ranked.length)return null;
 const top=ranked[0],extra=ranked.find(x=>x.path!==top.path&&x.score>=top.score*.75&&x.text!==top.text);
 let result=top.text+(extra?' '+extra.text:'');
 result=result.slice(0,550).replace(/\s+\S*$/,'').trim();
 return {text:result,path:top.path};
}
function chooseVoice(){
 const voices=window.speechSynthesis?.getVoices()||[];
 const turkish=voices.filter(v=>/^tr(-|$)/i.test(v.lang));
 if(!turkish.length)return null;
 // The browser does not expose a voice gender field: select only known feminine voice names.
 const selected=turkish.find(v=>/emel|selin|zeynep|ayla|dilara|filiz|esra|female|kadın/i.test(v.name));
 preferredVoice=selected||null;
 return selected||null;
}
window.speechSynthesis?.addEventListener?.('voiceschanged',chooseVoice);
chooseVoice();

/* Browser-based Turkish voice synthesis fallback. Uses meSpeak (GPL) at a CDN,
   female-style f3 variant; does not require Windows voices or an API key.
   This is a robotic synthesizer, not a natural neural female voice. */
const mespeakBase='https://cdn.jsdelivr.net/gh/foxdog-studios/meSpeak@master/';
let mespeakPromise=null,audioUnlocked=false,robotSpeechId=null,ttsGeneration=0;
function mespeakLoad(loader,path){
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('Ses motoru zaman aşımı')),16000);
  try{loader(mespeakBase+path,(ok,result)=>{clearTimeout(timer);if(ok===false)reject(Error(String(result)));else resolve()})}
  catch(e){clearTimeout(timer);reject(e)}
 });
}
function initMespeak(){
 if(mespeakPromise)return mespeakPromise;
 mespeakPromise=(async()=>{
  if(!window.meSpeak){
   await new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=mespeakBase+'mespeak.full.js';
    script.onload=resolve;script.onerror=()=>reject(Error('meSpeak script yüklenemedi'));document.head.appendChild(script);
   });
  }
  if(!window.meSpeak)throw Error('meSpeak bulunamadı');
  meSpeak.loadConfig(mespeakBase+'mespeak_config.json');
  await new Promise((resolve,reject)=>{const began=Date.now();const check=()=>{if(meSpeak.isConfigLoaded())resolve();else if(Date.now()-began>16000)reject(Error('YAKUT ses yapılandırması yüklenemedi'));else setTimeout(check,120)};check()});
  await mespeakLoad(meSpeak.loadVoice.bind(meSpeak),'voices/tr.json');
  return true;
 })();
 mespeakPromise.catch(()=>{mespeakPromise=null});
 return mespeakPromise;
}
async function speakWithEngine(text){
 const id=++ttsGeneration;speaking=true;
 if(recognition){try{recognition.abort()}catch(e){}}
 try{
  await initMespeak();
  if(id!==ttsGeneration||hidden)return;
  if(!audioUnlocked){speaking=false;if(listenEnabled)queueListen(600);return}
  if(robotSpeechId!==null){try{meSpeak.stop(robotSpeechId)}catch(e){}}
  robotSpeechId=meSpeak.speak(text,{voice:'tr',variant:'f3',pitch:76,speed:145,amplitude:100},()=>{
   if(id!==ttsGeneration)return;robotSpeechId=null;speaking=false;
   if(listenEnabled&&!hidden)queueListen(600);
  });
  if(robotSpeechId===false||robotSpeechId===undefined){speaking=false;if(listenEnabled)queueListen(600)}
 }catch(e){speaking=false;console.warn('YAKUT ses motoru:',e.message);if(listenEnabled)queueListen(600)}
}
function unlockYakutSound(){
 audioUnlocked=true;
 visitorInteracted=true;
 listenEnabled=true;
 if(ready&&!openingSpoken){
  openingSpoken=true;
  play('greet_02',true);speak(welcome);
 } else if(ready && !speaking) queueListen(700);
}
document.addEventListener('pointerdown',unlockYakutSound,{once:true,capture:true});
document.addEventListener('keydown',unlockYakutSound,{once:true,capture:true});
// meSpeak robotik ses motoru devre dışı: doğal kadın sesi doğrulanana kadar yükleme yapma.

// Ahenk Cep neural Turkish speech: runs in the visitor's browser, not via OS voices.
// Upstream ES modules and the ONNX model are loaded only when speech is requested.
const yakutAhenkRoot='https://ozguradmin.github.io/ahenk-turkish-tts/';
let yakutTtsWorker=null,yakutTtsReady=false,yakutTtsFailed=false,yakutTtsContext=null,yakutTtsLastFailure=0;
let yakutTtsSource=null,yakutTtsPending='',yakutTtsId=0,yakutTtsBootTimer=null,yakutTtsSayTimer=null;
function finishYakutSpeech(){
 clearTimeout(yakutTtsSayTimer);yakutTtsSayTimer=null;
 speaking=false;
 if(listenEnabled&&!hidden)queueListen(650);
}
function yakutTtsFailure(e){
 console.warn('YAKUT Ahenk sesi kullanılamıyor:',e?.message||e);
 yakutTtsFailed=true;yakutTtsLastFailure=Date.now();yakutTtsReady=false;yakutTtsPending='';
 clearTimeout(yakutTtsBootTimer);clearTimeout(yakutTtsSayTimer);
 try{yakutTtsWorker?.terminate()}catch(_){}
 yakutTtsWorker=null;finishYakutSpeech();
}
function yakutPlaySpeech(data){
 try{
  if(!yakutTtsContext)yakutTtsContext=new (window.AudioContext||window.webkitAudioContext)();
  yakutTtsContext.resume().catch(()=>{});
  const pcm=new Float32Array(data.audio);
  const buf=yakutTtsContext.createBuffer(1,pcm.length,data.sampleRate);
  buf.copyToChannel(pcm,0);
  if(yakutTtsSource){try{yakutTtsSource.stop()}catch(_){}}
  const src=yakutTtsContext.createBufferSource();
  yakutTtsSource=src;src.buffer=buf;// Make the voice present and clear without clipping at higher volumes.
   const gain=yakutTtsContext.createGain();
   gain.gain.value=1.75;
   const limiter=yakutTtsContext.createDynamicsCompressor();
   limiter.threshold.value=-14;limiter.knee.value=8;
   limiter.ratio.value=12;limiter.attack.value=0.003;limiter.release.value=0.18;
   src.connect(gain);gain.connect(limiter);limiter.connect(yakutTtsContext.destination);
  src.onended=()=>{if(yakutTtsSource===src){yakutTtsSource=null;finishYakutSpeech()}};
  src.start();
 }catch(e){yakutTtsFailure(e)}
}
function yakutTtsSayNow(text){
 if(!yakutTtsReady||!yakutTtsWorker)return;
 const id=++yakutTtsId;
 yakutTtsWorker.postMessage({type:'say',id,text:text.slice(0,600),style:'neutral',steps:8,speed:1,seed:0});
 clearTimeout(yakutTtsSayTimer);
 yakutTtsSayTimer=setTimeout(()=>yakutTtsFailure(Error('Ses üretimi zaman aşımı')),90000);
}
function startYakutAhenk(){
 if(yakutTtsWorker)return;
 if(yakutTtsFailed){if(Date.now()-yakutTtsLastFailure<12000)return;yakutTtsFailed=false}
 try{
  // Local blob-backed module worker avoids a cross-origin Worker constructor.
  // The imported upstream module resolves its own relative dependencies at its real URL.
  const script='import '+JSON.stringify(yakutAhenkRoot+'js/worker.js')+';';
  const blobUrl=URL.createObjectURL(new Blob([script],{type:'text/javascript'}));
  yakutTtsWorker=new Worker(blobUrl,{type:'module'});
  URL.revokeObjectURL(blobUrl);
  yakutTtsWorker.onerror=e=>yakutTtsFailure(Error(e.message||'Ses işçisi başlatılamadı'));
  yakutTtsWorker.onmessage=({data})=>{
   if(data.type==='ready'){
    clearTimeout(yakutTtsBootTimer);yakutTtsReady=true;
    if(yakutTtsPending){const text=yakutTtsPending;yakutTtsPending='';yakutTtsSayNow(text)}
   }else if(data.type==='audio'){
    if(data.id===yakutTtsId){clearTimeout(yakutTtsSayTimer);yakutPlaySpeech(data)}
   }else if(data.type==='error'){
    yakutTtsFailure(Error(data.message||'Ses motoru hatası'));
   }
  };
  const ua=navigator.userAgent||'';
  yakutTtsWorker.postMessage({
   type:'init',modelBase:'https://huggingface.co/ozgurguler/ahenk-cep-tr/resolve/main/onnx/',
   pyBase:yakutAhenkRoot+'py/',variant:'f16',ep:'wasm',
   device:{ios:/iPhone|iPad|iPod/i.test(ua),mobile:/Android|iPhone|iPad|iPod/i.test(ua),webkit:/AppleWebKit/i.test(ua)},
   maxThreads:1,front:'js'
  });
  yakutTtsBootTimer=setTimeout(()=>yakutTtsFailure(Error('Ahenk modeli yüklenemedi')),120000);
 }catch(e){yakutTtsFailure(e)}
}
function speak(text){
 show(text,Math.max(7000,text.length*85));
 if(!audioUnlocked){if(listenEnabled)queueListen(650);return}
 speaking=true;
 if(recognition){try{recognition.abort()}catch(e){}}
 if(yakutTtsFailed&&Date.now()-yakutTtsLastFailure<12000){
  // Avoid rapid repeated network retries, but never disable speech for the entire visit.
  finishYakutSpeech();return;
 }
 if(yakutTtsSource){try{yakutTtsSource.stop()}catch(e){}yakutTtsSource=null}
 if(!yakutTtsContext&&window.AudioContext){try{yakutTtsContext=new AudioContext();yakutTtsContext.resume().catch(()=>{})}catch(e){}}
 yakutTtsPending=text;
 startYakutAhenk();
 if(yakutTtsReady){yakutTtsPending='';yakutTtsSayNow(text)}
}
function positionStage(){stage.style.transform='translate3d('+Math.round(posX)+'px,0,0)'}
function leftGreetingX(){return innerWidth<650?23:35}
function openingGreeting(){
 if(!ready||hidden||openingGreeted)return;
 openingGreeted=true;phase='greeting';play('greet_02',true);
 show(welcome,12000);
 if(!openingSpoken&&audioUnlocked){openingSpoken=true;speak(welcome)}
}
voiceButton.onclick=()=>{
 voiceEnabled=true;visitorInteracted=true;
 if(!ready){show('YAKUT yükleniyor. Ses birazdan başlayacak.',3000);return}
 if(!openingGreeted){posX=leftGreetingX();targetX=posX;positionStage();openingGreeting()}
 else speak(welcome);
};
function moveTo(x){targetX=Math.max(0,Math.min(x,innerWidth-stage.offsetWidth));if(!reduced&&Math.abs(targetX-posX)>12){phase='walking';turnRight=targetX>posX;model.rotation.y=0;play('walk',false,.95)}else{posX=targetX;positionStage();phase='idle';play('wait')}}
function react(clip,text){if(!ready)return;phase='reacting';phaseTime=0;play(clip,true,1);speak(text)}
async function handle(message){
const q=String(message||'').trim();if(!q||!ready)return;
processingSpeech=true;
if(recognition){try{recognition.abort()}catch(e){}}
const t=q.toLocaleLowerCase('tr-TR').replace(/[.,!?;:]/g,' ').replace(/\s+/g,' ').trim();
let clip='agree',answer='';
// A standing-at-attention request must not fall through to an unrelated approval gesture.
if(/(saygı duruşu|saygıyla eğil|öne eğil|öne doğru eğil|eğilerek selam ver|saygı selamı|başını eğ|eğil|eğilir misin|selam duruşu)/i.test(t)){
 targetX=posX;walkTimer=0;phase='reacting';phaseTime=0;
 model.rotation.y=0;
 // GLB animation names can vary; prefer a real bow clip, never an unrelated 'agree' gesture.
 const bowName=Object.keys(clips).find(n=>/^(bow|bow_\d+|bowing|respect|selam_eğil)$/i.test(n))
   || Object.keys(clips).find(n=>/bow|eğil|saygı/i.test(n));
 if(bowName){play(bowName,true);console.info('YAKUT eğilme:',bowName)}
 else {phase='idle';play('wait');console.warn('YAKUT modelinde eğilme animasyonu bulunamadı:',Object.keys(clips))}
 processingSpeech=false;if(listenEnabled)queueListen(650);
 return;
}
if(/(komik|şaka|espri|gül|gülsene|gül bakalım|kahkaha|haha|ahah|🤣|😂|fıkra)/i.test(t)){
 clip='laugh_02';answer='Hahaha! Çok güldüm! Seninle sohbet etmek çok eğlenceli.';
}else if(/(harika|mükemmel|süper|çok güzel|başarılı|tebrik|aferin|sevindim|sevin|mutlu|muhteşem|bravo|ne kadar güzel|çok iyisin)/i.test(t)){
 clip='dance_01';answer='Çok sevindim! Böyle güzel sözler duymak harika!';
}else if(/(teşekkür|sağ ol|eyvallah|eline sağlık)/i.test(t)){
 clip='bow';answer='Ne demek! Yardımcı olabildiysem ne mutlu bana.';
}else if(/(kızgın|sinirli|berbat|kötü|üzgün|saçma|yapamadın)/i.test(t)){
 clip='frustrated_01';answer='Seni anlıyorum. Ne olduğunu anlatırsan birlikte çözmeye çalışabiliriz.';
}else if(/(merhaba|selam|günaydın|nasılsın|kimsin|adın ne|yakut kimsin|kendini tanıt)/i.test(t)){
 clip='greet_02';answer='Merhaba! Ben YAKUT. KUMTAŞ İnşaat için buradayım. Nasıl yardımcı olabilirim?';
}else if(/(malik|hak sahip|çoğunluk|oybirliği|oy birliği|arsa payı|kira yardımı|riskli yapı tespiti|itiraz|tahliye|hisse satış)/i.test(t)){
 clip='agree';answer='6306 sayılı Kanun kapsamındaki dönüşüm kararlarında, oybirliği sağlanamazsa maliklerin arsa paylarına göre salt çoğunluğu esas alınabilir. Maliklerin sözleşme şartlarını ve haklarını incelemesi, riskli yapı tespitini, tebligatları ve uygunluk varsa kira yardımını resmi kurumlardan doğrulaması önemlidir. Ayrıntılar yapının durumuna göre değişir. Resmi bilgi için Kentsel Dönüşüm Başkanlığının mevzuat ve bilgi merkezine bakılmalıdır.';
}else if(/(emsal|imar|arsa|metrekare|m2|m²|daire|dükkan|inşaat alanı|kat karşılığı|kentsel dönüşüm)/i.test(t)){
 clip='agree';await loadSiteKnowledge();const found=siteAnswer(q);
 answer=found?found.text+' Bu, KUMTAŞ internet sitesinin '+found.path.replace('.html','')+' sayfasındaki bilgidir. Kesin yapılaşma hakkı için belediyenin güncel imar durumu esas alınmalıdır.':'Kentsel dönüşümde arsa alanı, imar durumu, mevcut bina bilgileri ve maliklerin anlaşma şartları birlikte incelenir. Arsa alanını, ilçeyi ve biliyorsan ada parsel numaranı söyle. Kesin haklar için belediyenin güncel imar durumu gerekir.';
}else if(/(el salla|el sallasana|elini salla|selam ver|selamla)/i.test(t)){
 clip='greet_02';answer='Merhaba! Seni görmek güzel!';
}else if(/(dans et|dans etsene|dans eder misin|oyna|dans yap)/i.test(t)){
 clip='dance_01';answer='Hadi biraz neşelenelim!';
}else if(/(alkış|alkışla|alkışlasana)/i.test(t)){
 clip='clap';answer='Bravo! Seni alkışlıyorum!';
}else if(/(yürü|yürüsene|yürüyebilir misin|gez|gezinsene|dolaş|sola git|sağa git)/i.test(t)){
 const x=/sola/.test(t)?innerWidth*.07:/sağa/.test(t)?innerWidth*.72:innerWidth*(.15+Math.random()*.6);
 processingSpeech=false;moveTo(x);speak('Tamam! Biraz yürüyüş yapıyorum.');return;
}else{
 clip='agree';
 await loadSiteKnowledge();
 const match=siteAnswer(q);
 answer=match?match.text+' Bu bilgi KUMTAŞ internet sitesindeki '+match.path.replace('.html','')+' sayfasından alınmıştır.':'Bu konuda sitemizde doğrulanmış bilgi bulamadım. Kentsel dönüşüm ve malik haklarıyla ilgili bir soruyu daha ayrıntılı sorabilir veya KUMTAŞ ile görüşebilirsiniz.';
}
processingSpeech=false;
react(clip,answer);
}
function queueListen(delay=600){
 clearTimeout(listenRetry);
 if(!listenEnabled||hidden||speaking||processingSpeech||recognition||micStarting)return;
 const ms=Math.max(delay,micRestartAt-Date.now(),0);
 listenRetry=setTimeout(()=>{if(listenEnabled&&!hidden&&!speaking&&!processingSpeech&&!recognition)startSpeech()},ms)
}
function stopListening(){
 listenEnabled=false;clearTimeout(listenRetry);micStarting=false;
 if(recognition){try{recognition.abort()}catch(e){}}
 talk.textContent='🎤 YAKUT';
}
function speechProblem(err){
 if(!listenEnabled||hidden)return;
 if(err==='not-allowed'||err==='service-not-allowed'){
  stopListening();show('Mikrofon erişimi engellendi. Tarayıcı adres çubuğundaki kilit simgesinden bu site için mikrofon izni verin.',10000);
  talk.hidden=false;return;
 }
 if(err==='audio-capture'){
  stopListening();show('Mikrofon bulunamadı veya başka bir uygulama tarafından kullanılıyor. Mikrofonu kontrol edin; isterseniz yazarak devam edin.',11000);
  talk.hidden=false;return;
 }
 if(err==='no-speech'||err==='aborted'){return}
 // SpeechRecognition may rely on a browser speech server and cannot always run offline.
 micFailureCount++;
 if(err==='network'||err==='language-not-supported'||err==='language-unavailable'){
  if(micFailureCount>=3){
   stopListening();show('Tarayıcının ses tanıma bağlantısı çalışmıyor. İnternet bağlantısını kontrol edin veya mesajı yazın. Tekrar denemek için 🎤 YAKUT düğmesine basın.',11000);
   talk.hidden=false;return;
  }
  micRestartAt=Date.now()+Math.min(12000,2000*micFailureCount);
  show('Ses bağlantısı kontrol ediliyor. Sorun devam ederse yazılı mesaj kullanabilirsiniz.',4000);
 }else{
  if(micFailureCount>=4){
   stopListening();show('Ses algılama başlatılamadı. Mikrofon iznini ve tarayıcı ayarlarını kontrol edin. Yazılı mesaj gönderebilirsiniz.',10000);talk.hidden=false;return;
  }
  micRestartAt=Date.now()+Math.min(8000,1500*micFailureCount);
 }
}
function startSpeech(){
 const API=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!API){stopListening();talk.hidden=false;show('Bu tarayıcı ses tanımayı desteklemiyor. Chrome veya Edge kullanın.',9000);return}
 if(!ready||!listenEnabled||hidden||speaking||processingSpeech||recognition||micStarting)return;
 const rec=new API();recognition=rec;micStarting=true;
 rec.lang='tr-TR';rec.interimResults=false;rec.continuous=false;rec.maxAlternatives=1;
 rec.onstart=()=>{micStarting=false;talk.textContent='🟢 Dinliyorum'};
 rec.onresult=e=>{
  const spoken=e.results?.[0]?.[0]?.transcript;
  if(!spoken)return;
  micFailureCount=0;
  show('Siz: '+spoken,2600);
  handle(spoken);
 };
 rec.onerror=e=>{micStarting=false;micLastError=e.error||'unknown';speechProblem(micLastError)};
 rec.onend=()=>{
  micStarting=false;if(recognition===rec)recognition=null;
  if(listenEnabled&&!hidden&&!speaking&&!processingSpeech){talk.textContent='🟢 Dinliyorum';queueListen(700)}
  else if(!listenEnabled)talk.textContent='🎤 YAKUT';
 };
 try{rec.start()}catch(e){
  micStarting=false;if(recognition===rec)recognition=null;
  speechProblem('start-failed');if(listenEnabled)queueListen(1500);
 }
}
talk.onclick=()=>{
 if(!ready)return;
 voiceEnabled=true;visitorInteracted=true;
 talk.hidden=false;
 if(listenEnabled&&recognition){stopListening();show('Dinleme durduruldu.',3000);return}
 listenEnabled=true;micFailureCount=0;micRestartAt=0;visitorInteracted=true;talk.hidden=true;talk.textContent='🟢 Dinliyorum';
 if(!openingSpoken){openingSpoken=true;play('greet_02',true);speak(welcome)}
 else{speak('Seni dinliyorum. Bana bir şey sorabilirsin.')}
 if(!window.speechSynthesis)queueListen(250);
};

close.onclick=()=>{
hidden=!hidden;stage.style.display=hidden?'none':'block';caption.classList.remove('shown');
if(hidden){stopListening();speechSynthesis?.cancel();speaking=false}
close.textContent=hidden?'Göster':'✕';talk.style.display=hidden?'none':'';voiceButton.style.display=hidden?'none':'';if(!hidden){positionStage();listenEnabled=true;queueListen(400);show('YAKUT dinlemeye devam ediyor.',3500)}
};
window.addEventListener('resize',()=>{posX=Math.max(-stage.offsetWidth,Math.min(posX,innerWidth-stage.offsetWidth));targetX=Math.max(0,Math.min(targetX,innerWidth-stage.offsetWidth));positionStage()});
async function init(){
try{
const [three,{GLTFLoader}]=await Promise.all([
import('https://esm.sh/three@0.164.1'),
import('https://esm.sh/three@0.164.1/examples/jsm/loaders/GLTFLoader.js')
]);THREE=three;
const renderer=new THREE.WebGLRenderer({canvas:stage.querySelector('canvas'),alpha:true,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,50);
camera.position.set(0,0,3.3);camera.lookAt(0,0,0);
scene.add(new THREE.HemisphereLight(0xe7f8ff,0x273c57,2.6));
const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-4,5,6);scene.add(light);
const fill=new THREE.DirectionalLight(0x46bbff,1.6);fill.position.set(4,4,-2);scene.add(fill);
const gltf=await new GLTFLoader().loadAsync(url);model=gltf.scene;
const bbox=new THREE.Box3().setFromObject(model);
const size=bbox.getSize(new THREE.Vector3()),center=bbox.getCenter(new THREE.Vector3());
normalScale=1.55/Math.max(size.y,0.01);
model.scale.setScalar(normalScale);model.position.set(-center.x*normalScale,-center.y*normalScale,-center.z*normalScale);
basePosition=model.position.clone();
model.traverse(o=>{if(o.isSkinnedMesh){o.frustumCulled=false;if(o.morphTargetDictionary)face=o}});
scene.add(model);mixer=new THREE.AnimationMixer(model);
gltf.animations.forEach(c=>clips[c.name]=mixer.clipAction(c));
mixer.addEventListener('finished',()=>{if(phase==='reacting'||phase==='greeting'){phase='idle';play('wait');walkTimer=0}});
ready=true;loadSiteKnowledge().catch(console.warn);posX=-stage.offsetWidth;targetX=leftGreetingX();
listenEnabled=true;voiceButton.hidden=true;queueListen(1600);
model.rotation.y=0; // Keep YAKUT facing visitors while walking either direction.
if(reduced){posX=targetX;phase='idle';play('wait');queueMicrotask(openingGreeting)}else{phase='walking';play('walk',false,.95)}
positionStage();
const clock=new THREE.Clock();
function frame(){
if(!stage.isConnected)return;requestAnimationFrame(frame);
const dt=Math.min(clock.getDelta(),.06),rect=stage.getBoundingClientRect();
renderer.setSize(Math.max(rect.width,1),Math.max(rect.height,1),false);
camera.aspect=Math.max(rect.width,1)/Math.max(rect.height,1);camera.updateProjectionMatrix();
if(!hidden){
mixer.update(dt);
if(phase==='walking'){
const step=(innerWidth<650?56:94)*dt;
if(Math.abs(targetX-posX)<=step){posX=targetX;phase='idle';play('wait');walkTimer=0;
 if(!openingGreeted){openingGreeting();phaseTime=1}
}else{posX+=Math.sign(targetX-posX)*step;}
positionStage();
}else if(phase==='idle'&&!reduced){
walkTimer+=dt;if(!speaking&&walkTimer>13){walkTimer=0;moveTo(innerWidth*(.08+Math.random()*.65))}
}
if(face){
const v=speaking?Math.max(0,Math.sin(performance.now()*.016)):.0;
for(const [name,i] of Object.entries(face.morphTargetDictionary)){
const influence=/jawOpen|viseme_A/i.test(name)?v*.65:/viseme_O/i.test(name)?v*.18:0;
face.morphTargetInfluences[i]=THREE.MathUtils.damp(face.morphTargetInfluences[i],influence,14,dt)}
}
}
renderer.render(scene,camera);
}frame();
}catch(err){
console.error('YAKUT V9 yüklenemedi:',err);stage.remove();ui.remove();caption.remove();
}}
init();
})();