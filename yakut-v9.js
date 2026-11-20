/* KUMTAS YAKUT V9: genuine GLB animated visitor companion.
 * Runs on homepage; original site layout and background video stay unchanged. */
(() => {
'use strict';
if(window.__yakutV9)return;window.__yakutV9=true;
const url=new URL('YAKUT_V9.glb',document.currentScript.src).href;
const welcome='Merhaba, ben KUMTAŞ İnşaat asistanınız YAKUT. Size yardımcı olmak için buradayım.';
const css=document.createElement('style');
css.textContent=`
#yakut-v9{position:fixed;left:0;bottom:52px;width:clamp(190px,20vw,265px);height:clamp(300px,37vw,410px);z-index:110;pointer-events:none;will-change:transform;filter:drop-shadow(0 6px 12px #001c3273)}
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
@media(max-width:650px){#yakut-v9{width:clamp(118px,32vw,155px);height:clamp(190px,51vw,250px);bottom:52px;left:0}#yakut-v9-ui{bottom:8px;left:3px;gap:4px}#yakut-v9-ui button{padding:8px;font-size:12px}#yakut-v9-ui input{width:min(180px,41vw)}#yakut-v9-caption{bottom:52px;left:3px;max-width:80vw}}
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
let yakutReturnLeftAfterSpeech=false;
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
 result=result.trim();
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
 try{sessionStorage.setItem('yakutAudioApproved','1')}catch(_){}
 visitorInteracted=true;
 listenEnabled=true;
 if(ready&&!openingSpoken){
  openingSpoken=true;openingGreeted=true;
  try{sessionStorage.setItem('yakutVisited','1')}catch(_){}
  pendingSpeechGesture='greet_02';speak(welcome);
 } else if(ready && !speaking) queueListen(700);
}
document.addEventListener('pointerdown',unlockYakutSound,{once:true,capture:true});
document.addEventListener('keydown',unlockYakutSound,{once:true,capture:true});
// meSpeak robotik ses motoru devre dışı: doğal kadın sesi doğrulanana kadar yükleme yapma.

// Ahenk Cep neural Turkish speech: runs in the visitor's browser, not via OS voices.
// Upstream ES modules and the ONNX model are loaded only when speech is requested.
const yakutAhenkRoot='https://ozguradmin.github.io/ahenk-turkish-tts/';
const YAKUT_SPEECH_SPEED=0.94;
let yakutTtsWorker=null,yakutTtsReady=false,yakutTtsFailed=false,yakutTtsContext=null,yakutTtsLastFailure=0;
let yakutTtsSource=null,yakutTtsPending='',yakutTtsId=0,yakutTtsBootTimer=null,yakutTtsSayTimer=null;
let yakutSpeechQueue=[],yakutAudioPlaying=false,yakutReadyChunk=null,yakutVoiceGeneration=0,yakutRequests=new Map();
let yakutAudioStartTime=0,yakutGestureClock=0;
function splitYakutSpeech(text){
 const sentences=String(text).replace(/\s+/g,' ').trim().match(/[^.!?;:]+[.!?;:]?/g)||[];
 const chunks=[];let part='';
 for(const sentence of sentences)for(const word of sentence.trim().split(/\s+/)){
  if(part&&(part+' '+word).length>185){chunks.push(part);part=''}
  part=part?part+' '+word:word;
 }
 if(part)chunks.push(part);
 return chunks;
}
function finishYakutSpeech(){
 yakutAudioPlaying=false;
 if(yakutReadyChunk&&!hidden){const next=yakutReadyChunk;yakutReadyChunk=null;yakutPlaySpeech(next);return}
 if(yakutRequests.size||yakutSpeechQueue.length)return;
 clearTimeout(yakutTtsSayTimer);yakutTtsSayTimer=null;
 yakutSpeechQueue=[];speaking=false;
 if(yakutReturnLeftAfterSpeech){yakutReturnLeftAfterSpeech=false;moveTo(leftGreetingX())}
 if(listenEnabled&&!hidden)queueListen(400);
}
function yakutTtsFailure(e){
 console.warn('YAKUT Ahenk sesi kullanılamıyor:',e?.message||e);
 yakutTtsFailed=true;yakutTtsLastFailure=Date.now();yakutTtsReady=false;yakutTtsPending='';yakutSpeechQueue=[];yakutRequests.clear();yakutReadyChunk=null;yakutAudioPlaying=false;
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
   gain.gain.value=1.0;
   const limiter=yakutTtsContext.createDynamicsCompressor();
   limiter.threshold.value=-10;limiter.knee.value=12;
   limiter.ratio.value=4;limiter.attack.value=0.008;limiter.release.value=0.22;
   src.connect(gain);gain.connect(yakutTtsContext.destination); // Avoid compressor pumping/distortion.
  src.onended=()=>{if(yakutTtsSource===src){yakutTtsSource=null;finishYakutSpeech()}};
  src.start();yakutAudioPlaying=true;yakutAudioStartTime=performance.now();yakutGestureClock=0;if(yakutSpeechQueue.length&&!yakutRequests.size)yakutTtsSayNow(yakutSpeechQueue.shift());
   if(pendingSpeechGesture){const gesture=pendingSpeechGesture;pendingSpeechGesture=null;play(gesture,true);if(phase!=='walking')phase='reacting'}
 }catch(e){yakutTtsFailure(e)}
}
function yakutTtsSayNow(text){
 if(!yakutTtsReady||!yakutTtsWorker)return;
 const id=++yakutTtsId;yakutRequests.set(id,yakutVoiceGeneration);
 yakutTtsWorker.postMessage({type:'say',id,text,style:'neutral',steps:8,speed:YAKUT_SPEECH_SPEED,seed:0});
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
    const generation=yakutRequests.get(data.id);yakutRequests.delete(data.id);if(generation===yakutVoiceGeneration){clearTimeout(yakutTtsSayTimer);if(yakutAudioPlaying)yakutReadyChunk=data;else yakutPlaySpeech(data)}
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
 speaking=true;yakutAudioPlaying=false;yakutReadyChunk=null;++yakutVoiceGeneration;yakutRequests.clear();
 // Keep the microphone active for navigation during speech.
 if(yakutTtsFailed&&Date.now()-yakutTtsLastFailure<12000){
  // Avoid rapid repeated network retries, but never disable speech for the entire visit.
  finishYakutSpeech();return;
 }
 if(yakutTtsSource){try{yakutTtsSource.stop()}catch(e){}yakutTtsSource=null}
 if(!yakutTtsContext&&window.AudioContext){try{yakutTtsContext=new AudioContext();yakutTtsContext.resume().catch(()=>{})}catch(e){}}
 const segments=splitYakutSpeech(text);
 yakutSpeechQueue=segments.slice(1);
 yakutTtsPending=segments[0]||'';
 startYakutAhenk();
 if(yakutTtsReady&&yakutTtsPending){const first=yakutTtsPending;yakutTtsPending='';yakutTtsSayNow(first)}
 if(listenEnabled&&!recognition)queueListen(500);
}
function positionStage(){stage.style.transform='translate3d('+Math.round(posX)+'px,0,0)'}
function leftGreetingX(){return 0}
function centerAnswerX(){return Math.max(0,(innerWidth-stage.offsetWidth)/2)}
function openingGreeting(){
 if(!ready||hidden||openingGreeted)return;
 openingGreeted=true;phase='greeting';pendingSpeechGesture='greet_02';
 show(welcome,12000);
 if(!openingSpoken&&audioUnlocked){openingSpoken=true;try{sessionStorage.setItem('yakutVisited','1')}catch(_){}speak(welcome)}
}
voiceButton.onclick=()=>{
 voiceEnabled=true;visitorInteracted=true;
 if(!ready){show('YAKUT yükleniyor. Ses birazdan başlayacak.',3000);return}
 if(!openingGreeted){posX=leftGreetingX();targetX=posX;positionStage();openingGreeting()}
 else speak(welcome);
};
function moveTo(x){targetX=Math.max(0,Math.min(x,innerWidth-stage.offsetWidth));if(!reduced&&Math.abs(targetX-posX)>12){phase='walking';turnRight=targetX>posX;model.rotation.y=0;play('walk',false,.95)}else{posX=targetX;positionStage();phase='idle';play('wait')}}
let pendingSpeechGesture=null;
function findYakutGesture(preferred){
 if(preferred==='bow')return Object.keys(clips).find(n=>/^(bow|bow_\d+|bowing|respect|selam_eğil)$/i.test(n))
   ||Object.keys(clips).find(n=>/bow|eğil|saygı/i.test(n))||'agree';
 return clips[preferred]?preferred:(clips.agree?'agree':'wait');
}
function react(clip,text,placement='left'){
 if(!ready)return;
 const answering=placement==='center';
 yakutReturnLeftAfterSpeech=answering;
 moveTo(answering?centerAnswerX():leftGreetingX());
 phaseTime=0;
 pendingSpeechGesture=findYakutGesture(clip);
 speak(text);
}
// A single conversation/session for all published pages: greetings are once per visit.
const yakutDistrictPages={'bağcılar':'bagcilar','bahçelievler':'bahcelievler','bakırköy':'bakirkoy','güngören':'gungoren','avcılar':'avcilar','esenler':'esenler','küçükçekmece':'kucukcekmece','zeytinburnu':'zeytinburnu','yenibosna':'yenibosna'};
const yakutPageNames=[
 ['index.html',/ana\s*sayfa|anasayfa|eve\s*dön/i],
 ['sss.html',/sık\s*sorulan\s*sorular|sorular\s*sayfası|sss\b/i],
 ['hakkimizda.html',/hakkımızda/i],
 ['kurumsal.html',/kurumsal|firmamız|şirketimiz|kumtaş\s*(?:inşaat)?\s*kim/i],
 ['hizmetlerimiz.html',/hizmetlerimiz|hizmetler|ne\s*iş\s*yapıyorsunuz|neler\s*yapıyorsunuz/i],
 ['projelerimiz.html',/projelerimiz|projeler|referanslar/i],
 ['iletisim.html',/iletişim|telefon(?:lar)?|adres(?:imiz)?|bize\s*ulaş/i],
 ['bolgelerimiz.html',/bölgelerimiz|bölgeler|hangi\s*ilçelerde/i],
 ['kentsel-donusum.html',/kentsel\s*d[oö]n[uü]ş[uü]m|riskli\s*(?:bina|yapı)|malik\s*hak|arsa\s*payı|kira\s*yardım/i]
];
function normalizeYakutCommand(message){
 return String(message||'').toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü\s]/gi,' ').replace(/\s+/g,' ').trim();
}
function getYakutCurrentPage(){return decodeURIComponent(location.pathname.split('/').pop()||'index.html').toLowerCase()}
function findYakutPage(message){
 const t=normalizeYakutCommand(message);
 // An explicitly named district takes precedence over generic urban transformation.
 const area=Object.keys(yakutDistrictPages).find(d=>new RegExp('(?:^|\\s)'+d+'(?:\\s|$)').test(t));
 if(area)return yakutDistrictPages[area]+'-kentsel-donusum.html';
 const page=yakutPageNames.find(([,re])=>re.test(t));
 return page?page[0]:null;
}
function isYakutHomeCommand(message){
 const t=normalizeYakutCommand(message);
 return /^(?:(?:yakut|asistan|lütfen|beni|bizi|hemen|hadi)\s+)*(?:ana\s*sayfa(?:ya|yı)?|anasayfa(?:ya|yı)?|ana\s*sayfayı\s*aç|ana\s*sayfaya\s*(?:git|dön|geç)|eve\s*dön)(?:\s+(?:aç|git|dön|geç|götür|lütfen|istiyorum))?$/.test(t);
}
function yakutIsPageRequest(message,whileSpeaking=false){
 const t=normalizeYakutCommand(message);
 const page=findYakutPage(t);
 if(!page)return null;
 // A factual question on the subject should not unexpectedly navigate away.
 const asksQuestion=/\b(nedir|nasıl|neden|ne\s*zaman|kaç|hesapla|hesaplama|ne\s*kadar|olur\s*mu|mümkün\s*mü)\b/.test(t);
 const navigationVerb=/(?:aç|git|geç|göster|götür|sayfa|bilgi\s*(?:istiyorum|ver|almak)|anlat|incele|konuşalım)/.test(t);
 const shortLabel=t.split(' ').length<=4;
 const explicitlyAddressed=/\byakut\b/.test(t);
 if(asksQuestion&&!navigationVerb)return null;
 if(whileSpeaking&&!navigationVerb&&!explicitlyAddressed&&!shortLabel)return null;
 return (navigationVerb||shortLabel||explicitlyAddressed)?page:null;
}
function cancelYakutSpeech(){
 ++yakutTtsId;++yakutVoiceGeneration;yakutRequests.clear();yakutReadyChunk=null;yakutAudioPlaying=false;yakutSpeechQueue=[];yakutTtsPending='';
 clearTimeout(yakutTtsSayTimer);yakutTtsSayTimer=null;
 if(yakutTtsSource){const source=yakutTtsSource;yakutTtsSource=null;source.onended=null;try{source.stop()}catch(_){}}
 pendingSpeechGesture=null;speaking=false;processingSpeech=false;
}
function collectYakutPageSpeech(){
 // Only page copy, in reading order. Never include nav links, footer, buttons or hidden controls.
 const root=document.querySelector('main')||document.body;
 const pieces=[],seen=new Set();
 for(const el of root.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd')){
  if(el.closest('header,nav,footer,aside,form,button,#yakut-v9,#yakut-v9-ui,.cta,.breadcrumbs'))continue;
  if(el.closest('p,li,dt,dd')!==null&&el.closest('p,li,dt,dd')!==el)continue;
  if(el.getAttribute('aria-hidden')==='true'||el.hidden)continue;
  const text=(el.textContent||'').replace(/\s+/g,' ').trim();
  if(text.length<12||seen.has(text)||/(çerez|cookie|tüm hakları saklıdır|whatsapp|iletişime geçin)/i.test(text))continue;
  if(/^(h1|h2|h3|h4)$/i.test(el.tagName) && text.length>135)continue;
  seen.add(text);pieces.push(text);
 }
 return pieces.join('. ').replace(/\.{2,}/g,'.').replace(/\s+/g,' ').trim();
}
function yakutPageIntro(path){
 const names={'index.html':'ana sayfa','kentsel-donusum.html':'kentsel dönüşüm','sss.html':'sık sorulan sorular','hizmetlerimiz.html':'hizmetlerimiz','kurumsal.html':'kurumsal','hakkimizda.html':'hakkımızda','projelerimiz.html':'projelerimiz','iletisim.html':'iletişim','bolgelerimiz.html':'bölgelerimiz'};
 const title=names[path]||path.replace('-kentsel-donusum.html','').replace(/-/g,' ');
 return 'Memnuniyetle. '+title+' sayfasını birlikte inceleyelim. ';
}
function yakutSpeakCurrentPage(){
 const page=getYakutCurrentPage();
 const content=collectYakutPageSpeech();
 const text=yakutPageIntro(page)+(content||'Bu sayfada ayrıntılı açıklama bulunamadı. Size hangi konuda yardımcı olabilirim?');
 react('agree',text,'left');
}
function openYakutPage(path){
 const current=getYakutCurrentPage();
 cancelYakutSpeech();
 if(current===path){yakutSpeakCurrentPage();return true}
 try{
  sessionStorage.setItem('yakutVisited','1');
  sessionStorage.setItem('yakutNextTopic',JSON.stringify({path,readPage:true}));
  if(audioUnlocked)sessionStorage.setItem('yakutAudioApproved','1');
 }catch(e){console.warn('YAKUT sayfa geçişi:',e)}
 location.assign(new URL(path,location.origin+'/').href);
 return true;
}
async function handle(message){
const q=String(message||'').trim();if(!q||!ready)return;
processingSpeech=true;
if(recognition){try{recognition.abort()}catch(e){}}
const t=q.toLocaleLowerCase('tr-TR').replace(/[.,!?;:]/g,' ').replace(/\s+/g,' ').trim();
const destination=yakutIsPageRequest(q);
if(destination){openYakutPage(destination);return;}
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
 clip='bow';answer='Ben teşekkür ederim. Yardımcı olabildiysem ne mutlu bana.';
}else if(/(kızgın|sinirli|berbat|kötü|üzgün|saçma|yapamadın)/i.test(t)){
 clip='frustrated_01';answer='Seni anlıyorum. Ne olduğunu anlatırsan birlikte çözmeye çalışabiliriz.';
}else if(/^(?:tamam|anladım|anlaşıldı|şimdi anladım|çok iyi anladım|peki anladım|anlıyorum|oldu anladım)(?:\s+(?:yakut|teşekkürler|sağ ol))?$/.test(t)){
 clip='clap';answer='Harika, anlaştığımıza sevindim.';
}else if(/(merhaba|selam|günaydın|nasılsın|kimsin|adın ne|yakut kimsin|kendini tanıt)/i.test(t)){
 clip='greet_02';answer='Merhaba, size nasıl yardımcı olabilirim?';
}else if(/(malik|hak sahip|çoğunluk|oybirliği|oy birliği|arsa payı|kira yardımı|riskli yapı tespiti|itiraz|tahliye|hisse satış)/i.test(t)){
 clip='agree';answer='6306 sayılı Kanun kapsamındaki dönüşüm kararlarında, oybirliği sağlanamazsa maliklerin arsa paylarına göre salt çoğunluğu esas alınabilir. Maliklerin sözleşme şartlarını ve haklarını incelemesi, riskli yapı tespitini, tebligatları ve uygunluk varsa kira yardımını resmi kurumlardan doğrulaması önemlidir. Ayrıntılar yapının durumuna göre değişir. Resmi bilgi için Kentsel Dönüşüm Başkanlığının mevzuat ve bilgi merkezine bakılmalıdır.';
}else if(/(emsal|imar|arsa|metrekare|m2|m²|daire|dükkan|inşaat alanı|kat karşılığı|kentsel dönüşüm)/i.test(t)){
 clip='agree';await loadSiteKnowledge();const found=siteAnswer(q);
 answer=found?'Bu konuda şu bilgileri paylaşabilirim: '+found.text+' Kesin yapılaşma hakkı için belediyenin güncel imar durumu esas alınır.':'Kentsel dönüşümde arsa, imar durumu, maliklerin hakları ve sözleşme şartları birlikte incelenir. Hangi konuda bilgi almak istersiniz?';
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
 answer=match?match.text:'Bu konuda yardımcı olmak isterim. Bana biraz daha ayrıntı verebilir misiniz?';
}
processingSpeech=false;
const isShortReaction=/(teşekkür|sağ ol|eyvallah|eline sağlık|anladım|anlaşıldı|anlıyorum|tamam|merhaba|selam)/i.test(t);
react(clip,isShortReaction?answer:'Sorunuzu cevaplayalım. '+answer,'center');
}
function queueListen(delay=600){
 clearTimeout(listenRetry);
 if(!listenEnabled||hidden||processingSpeech||recognition||micStarting)return;
 const ms=Math.max(delay,micRestartAt-Date.now(),0);
 listenRetry=setTimeout(()=>{if(listenEnabled&&!hidden&&!processingSpeech&&!recognition)startSpeech()},ms)
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
 if(!ready||!listenEnabled||hidden||processingSpeech||recognition||micStarting)return;
 const rec=new API();recognition=rec;micStarting=true;
 rec.lang='tr-TR';rec.interimResults=false;rec.continuous=false;rec.maxAlternatives=1;
 rec.onstart=()=>{micStarting=false;talk.textContent='🟢 Dinliyorum'};
 rec.onresult=e=>{
  const spoken=e.results?.[0]?.[0]?.transcript;
  if(!spoken)return;
  micFailureCount=0;
  const wanted=yakutIsPageRequest(spoken,speaking||processingSpeech);
  if(wanted){openYakutPage(wanted);return}
  if(speaking||processingSpeech)return; // Ignore YAKUT output except explicit page commands.
  show('Siz: '+spoken,2600);
  handle(spoken);
 };
 rec.onerror=e=>{micStarting=false;micLastError=e.error||'unknown';speechProblem(micLastError)};
 rec.onend=()=>{
  micStarting=false;if(recognition===rec)recognition=null;
  if(listenEnabled&&!hidden&&!processingSpeech){talk.textContent='🟢 Dinliyorum';queueListen(900)}
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
 if(!openingSpoken){openingSpoken=true;openingGreeted=true;try{sessionStorage.setItem('yakutVisited','1')}catch(_){}pendingSpeechGesture='greet_02';speak(welcome)}
 else{speak('Seni dinliyorum. Bana bir şey sorabilirsin.')}
 if(!window.speechSynthesis)queueListen(250);
};

close.onclick=()=>{
hidden=!hidden;stage.style.display=hidden?'none':'block';caption.classList.remove('shown');
if(hidden){stopListening();cancelYakutSpeech();window.speechSynthesis?.cancel()}
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
ready=true;loadSiteKnowledge().catch(console.warn);startYakutAhenk();posX=leftGreetingX();targetX=leftGreetingX();
 // Keep one greeting across every page and use the current page's real content.
 let arrivalReadPage=false;
 try{
  const entry=sessionStorage.getItem('yakutNextTopic');
  if(entry){
   const state=JSON.parse(entry);
   if(state.path===getYakutCurrentPage()){
    sessionStorage.removeItem('yakutNextTopic');
    arrivalReadPage=!!state.readPage;
   }
  }
  if(sessionStorage.getItem('yakutVisited')==='1'||arrivalReadPage){
   openingSpoken=true;openingGreeted=true;
  }
  if(sessionStorage.getItem('yakutAudioApproved')==='1')audioUnlocked=true;
  // Mark visited only after the one-time greeting is actually triggered.
 }catch(e){console.warn('YAKUT oturumu:',e)}
 if(arrivalReadPage){
  const beginNarration=()=>{if(audioUnlocked&&!speaking)yakutSpeakCurrentPage()};
  if(audioUnlocked)queueMicrotask(beginNarration);
  else{
   document.addEventListener('pointerdown',beginNarration,{once:true,capture:true});
   document.addEventListener('keydown',beginNarration,{once:true,capture:true});
  }
 }
listenEnabled=true;voiceButton.hidden=true;queueListen(1600);
model.rotation.y=0; // Keep YAKUT facing visitors while walking either direction.
posX=targetX;phase='idle';play('wait');queueMicrotask(openingGreeting);
positionStage();
const clock=new THREE.Clock();
function frame(){
if(!stage.isConnected)return;requestAnimationFrame(frame);
const dt=Math.min(clock.getDelta(),.06),rect=stage.getBoundingClientRect();
renderer.setSize(Math.max(rect.width,1),Math.max(rect.height,1),false);
camera.aspect=Math.max(rect.width,1)/Math.max(rect.height,1);camera.updateProjectionMatrix();
if(!hidden){
mixer.update(dt);
if(yakutAudioPlaying && phase==='idle'){
 yakutGestureClock+=dt;
 if(yakutGestureClock>7.5){
  yakutGestureClock=0;
  if(clips.agree){phase='reacting';play('agree',true)}
 }
}
if(phase==='walking'){
const step=(innerWidth<650?56:94)*dt;
if(Math.abs(targetX-posX)<=step){posX=targetX;phase='idle';play('wait');walkTimer=0;
 if(!openingGreeted){openingGreeting();phaseTime=1}
}else{posX+=Math.sign(targetX-posX)*step;}
positionStage();
}else if(phase==='idle'&&!reduced){
walkTimer+=dt; // Keep YAKUT by the left edge for narration.
}
if(face){
const v=yakutAudioPlaying?Math.max(0,Math.sin(performance.now()*.016)):.0;
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