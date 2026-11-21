/* KUMTAS YAKUT V9: genuine GLB animated visitor companion.
 * Runs on homepage; original site layout and background video stay unchanged. */
(() => {
'use strict';
if(window.__yakutV9)return;window.__yakutV9=true;
const url=new URL('YAKUT_V9.glb',document.currentScript.src).href;
const chestLogoUrl=new URL('yakut-mavi-amblem.jpg',url).href;
const welcome='Merhaba, hoş geldiniz. Ben KUMTAŞ İnşaat dijital asistanınız YAKUT. Sizin için ne yapabilirim?';
const css=document.createElement('style');
css.textContent=`
#yakut-v9{position:fixed;left:0;bottom:52px;width:clamp(255px,28vw,370px);height:min(73dvh,clamp(380px,53vw,580px));z-index:110;pointer-events:none;will-change:transform;filter:drop-shadow(0 6px 12px #001c3273)}
#yakut-v9 canvas{display:block;width:100%;height:100%}
#yakut-enable-audio{position:fixed;z-index:135;bottom:18px;left:14px;border:0;background:#09638c;color:white;padding:11px 15px;border-radius:24px;font:700 14px Arial,sans-serif;box-shadow:0 5px 16px #0005;cursor:pointer}
#yakut-enable-audio[hidden]{display:none!important}
/* YAKUT is a voice-only on-page character: no caption, chat box, or buttons. */
#yakut-v9-ui,#yakut-v9-caption{display:none!important}
#yakut-v9-ui{position:fixed;bottom:14px;left:3px;z-index:130;display:flex;gap:6px;align-items:center;max-width:calc(100vw - 24px);font:600 13px Arial,sans-serif}
#yakut-v9-ui button{border:1px solid #4fb3e9;background:#095983;color:#fff;border-radius:18px;padding:9px 12px;cursor:pointer;box-shadow:0 3px 10px #0003}
#yakut-v9-ui button:hover{background:#137aaa}
#yakut-v9-ui input{display:none;width:min(320px,45vw);padding:9px;border:1px solid #71c8fa;border-radius:14px;background:#fff;color:#122f44;font:13px Arial,sans-serif}
#yakut-v9-ui.open input{display:block}
#yakut-v9-caption{position:fixed;bottom:65px;left:4px;max-width:min(260px,75vw);z-index:131;display:none;background:#073b5cf2;color:#fff;padding:8px 10px;border:1px solid #6dccff;border-radius:12px;font:12px/1.45 Arial,sans-serif;box-shadow:0 5px 15px #0004}
#yakut-v9-caption.shown{display:block}
@media(max-width:650px){#yakut-v9{width:clamp(225px,65vw,325px);height:min(62dvh,clamp(355px,101vw,500px));bottom:45px;left:0}#yakut-v9-ui{bottom:8px;left:3px;gap:4px}#yakut-v9-ui button{padding:8px;font-size:12px}#yakut-v9-ui input{width:min(180px,41vw)}#yakut-v9-caption{bottom:52px;left:3px;max-width:80vw}}
@media(prefers-reduced-motion:reduce){#yakut-v9{transition:none!important}}
`;
document.head.appendChild(css);
const stage=document.createElement('div');stage.id='yakut-v9';stage.setAttribute('aria-label','Hareketli 3D YAKUT asistanı');
stage.appendChild(document.createElement('canvas'));
const ui=document.createElement('div');ui.id='yakut-v9-ui';
ui.innerHTML='<button id="yakut-voice" type="button" aria-label="Karşılama sesini aç" hidden>🔊 Sesi Aç</button><button id="yakut-talk" type="button" aria-label="Mikrofon izni ver" hidden>🎤 İzin Ver</button><button id="yakut-close" type="button" aria-label="YAKUT’u gizle">✕</button>';
const caption=document.createElement('div');caption.id='yakut-v9-caption';
document.body.append(stage,caption,ui);
const enableAudio=document.createElement('button');enableAudio.id='yakut-enable-audio';enableAudio.type='button';enableAudio.textContent='🔊 YAKUT’u Dinle';enableAudio.hidden=true;document.body.appendChild(enableAudio);
const voiceButton=ui.querySelector('#yakut-voice'),talk=ui.querySelector('#yakut-talk'),close=ui.querySelector('#yakut-close');
let THREE,model,mixer,face,clips={},current=null,ready=false,hidden=false,speaking=false,recognition=null,listenEnabled=false,micStarting=false,listenRetry=null,visitorInteracted=false;
let siteSections=[],siteLoaded=false,siteLoadPromise=null,preferredVoice=null,openingGreeted=false,openingSpoken=false,voiceEnabled=false;
let micFailureCount=0,micLastError='',micRestartAt=0;
let processingSpeech=false;
let yakutReturnLeftAfterSpeech=false;
let yakutFirstInteraction=false,yakutWelcomeRequested=false,yakutFirstGreetingDone=false,yakutPageOfferPending=false,yakutOfferSpoken=false,yakutIsGreetingWalking=false,yakutPendingPageSpeech=false;
let yakutGreetingInProgress=false,yakutGreetingEndAt=0;
let yakutCurrentPrompt='',yakutLastOfferAt=0,yakutLastInputAt=0,yakutOpeningBow=false,yakutSpeechEndedAt=0;
let phase='loading',posX=-280,targetX=0,walkTimer=0,phaseTime=0,turnRight=true,dialogTimer=0,normalScale=1,basePosition=null;
let yakutGreetingIdleTimer=null;
let yakutWelcomeWaitingForSound=false;
// Prepare greeting audio during movement, but hold playback until the bow finishes.
let yakutHoldWelcomeAudio=false;
function cancelGreetingRetreat(){clearTimeout(yakutGreetingIdleTimer);yakutGreetingIdleTimer=null}
function scheduleGreetingRetreat(delay=14000){cancelGreetingRetreat();yakutGreetingIdleTimer=setTimeout(()=>{if(!hidden&&ready&&!speaking&&!processingSpeech&&phase!=='walking'&&getYakutCurrentPage()==='index.html'){moveTo(leftGreetingX())}},delay)}
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
   const response=await fetch(new URL(path,location.origin+'/'),{signal:AbortSignal.timeout(4000)});
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
   siteSections.push(...output.slice(0,90));
   siteLoaded=siteSections.length>0;
   return output.slice(0,90)
  }));
  siteSections=pages.filter(p=>p.status==='fulfilled').flatMap(p=>p.value).slice(0,850);
  siteLoaded=siteSections.length>0;
  return siteSections;
 })();
 return siteLoadPromise;
}
const yakutPracticalAnswers=[
 [/zemin et[uü]d|zemin raporu|zemin g[uü][cç]lendirme/, 'Zemin etüdü, zeminin özelliklerini ve temel tasarımına ilişkin önerileri ortaya koyar. Zemin iyileştirmesi gerekip gerekmediği, etüt ve proje değerlendirmesiyle belirlenir.'],
 [/hava man[iî]|hava m nia|mania|mânia/, 'Hava mânia kısıtı, parselde izin verilebilecek yapı yüksekliğini etkileyebilir. Güncel imar durumunda ve plan notlarında parsel için geçerli yükseklik sınırına bakılır.'],
 [/ge[cç]ici konut|ta[sş][ıi]nma plan[ıi]|tahliye haz[ıi]rl[ıi][gğ][ıi]/, 'Taşınma takvimini, geçici konutu ve abonelik işlemlerini tahliyeden önce planlayabilirsiniz. Binayla ilgili yazılı bildirimdeki tarihleri ayrıca kontrol edin.'],
 [/m[uü]teahhit se[cç]|y[uü]klenici se[cç]|teklifleri nas[ıi]l kar[sş][ıi]la[sş]t[ıi]r/, 'Teklifleri aynı iş kapsamı üzerinden karşılaştırın. Teknik şartnameyi, teslim süresini, ödeme planını, paylaşım tablosunu, geçmiş projeleri ve sunulan teminatları yazılı isteyin.'],
 [/ke[sş]fe ne getir|[oö]n inceleme i[cç]in|ke[sş]if i[cç]in hangi belge/, 'Ön inceleme için taşınmazın adresini, ada ve parsel numaralarını, yaklaşık arsa alanını metrekare olarak ve mevcut daire ile dükkân sayılarını hazırlayın. Elinizde güncel imar durum belgesi, plan notları veya mevcut yapı projesi varsa bunları da paylaşabilirsiniz.', true]
];
async function yakutFindAnswer(q){
 const existing=siteAnswer(q);
 if(existing)return existing;
 let timer;
 try{
  await Promise.race([loadSiteKnowledge(),new Promise(resolve=>{timer=setTimeout(resolve,350)})]);
 }finally{clearTimeout(timer)}
 return siteAnswer(q);
}
function siteAnswer(q){
 const practical=yakutPracticalAnswers.find(([pattern])=>pattern.test(normalizeYakutCommand(q)));
 if(practical)return {text:practical[1], exact: practical[2] === true};
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
 const selected=turkish.find(v=>/\bsiri\b/i.test(v.name))||['yelda','emel','selin','zeynep','ayla','dilara','filiz','esra','female','kadın']
  .map(name=>turkish.find(v=>v.name.toLocaleLowerCase('tr-TR').includes(name))).find(Boolean);
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
 yakutFirstInteraction=true;
 audioUnlocked=true;
 try{sessionStorage.setItem('yakutAudioApproved','1')}catch(_){}
 visitorInteracted=true;
 listenEnabled=true;
 if(yakutTtsContext?.state==='suspended')yakutTtsContext.resume().catch(()=>{});
 if(!ready){yakutWelcomeRequested=true;return}
 if(yakutWelcomeWaitingForSound){
  yakutWelcomeWaitingForSound=false;enableAudio.hidden=true;cancelGreetingRetreat();
  speak(welcome);return;
 }
 beginYakutVisit();
}
function beginYakutVisit(){
 if(!ready||hidden)return;
 if(getYakutCurrentPage()==='kentsel-donusum.html'&&audioUnlocked){
  try{if(sessionStorage.getItem('yakutExplainMalik')==='1'){yakutExplainMalik();return}}catch(_){}
 }
 if(getYakutCurrentPage()==='index.html' && !yakutFirstGreetingDone){
  yakutFirstGreetingDone=true;yakutWelcomeRequested=false;openingSpoken=true;openingGreeted=true;
  cancelGreetingRetreat();
  yakutIsGreetingWalking=true;
  if(phase==='walking')return;
  if(audioUnlocked){yakutHoldWelcomeAudio=true;speak(welcome)}
  moveTo(centerAnswerX());
  if(phase!=='walking')finishYakutGreetingWalk();
  return;
 }
 if(yakutPageOfferPending){offerYakutPage();return}
 if(!speaking)queueListen(450);
}
document.addEventListener('pointerdown',unlockYakutSound,{once:true,capture:true});
document.addEventListener('keydown',unlockYakutSound,{once:true,capture:true});
document.addEventListener('wheel',unlockYakutSound,{once:true,capture:true,passive:true});
document.addEventListener('touchmove',unlockYakutSound,{once:true,capture:true,passive:true});
enableAudio.addEventListener('click',unlockYakutSound);
// meSpeak robotik ses motoru devre dışı: doğal kadın sesi doğrulanana kadar yükleme yapma.

// Ahenk Cep neural Turkish speech: runs in the visitor's browser, not via OS voices.
// Upstream ES modules and the ONNX model are loaded only when speech is requested.
const yakutAhenkRoot='https://ozguradmin.github.io/ahenk-turkish-tts/';
const YAKUT_SPEECH_SPEED=1.02;
let yakutTtsWorker=null,yakutTtsReady=false,yakutTtsFailed=false,yakutTtsContext=null,yakutTtsLastFailure=0;
let yakutTtsSource=null,yakutTtsPending='',yakutTtsId=0,yakutTtsBootTimer=null,yakutTtsSayTimer=null;
let yakutSpeechQueue=[],yakutAudioPlaying=false,yakutReadyChunk=null,yakutVoiceGeneration=0,yakutRequests=new Map();
let yakutAudioStartTime=0,yakutGestureClock=0;
function splitYakutSpeech(text){
 // For the initial greeting, synthesize a short first phrase so it can be ready
 // before the bow finishes instead of waiting for the entire greeting audio.
 if(String(text).trim()===welcome){
  return ['Merhaba, hoş geldiniz.', 'Ben KUMTAŞ İnşaat dijital asistanınız YAKUT. Sizin için ne yapabilirim?'];
 }
 const normalized=String(text).replace(/\s+/g,' ').trim();
 const opening=normalized.match(/^.{8,100}?[.!?](?=\s)/)?.[0];
 const remainder=opening?normalized.slice(opening.length).trim():normalized;
 const sentences=remainder.match(/[^.!?;:]+[.!?;:]?/g)||[];
 const chunks=opening?[opening]:[];let part='';
 for(const sentence of sentences)for(const word of sentence.trim().split(/\s+/)){
  if(part&&(part+' '+word).length>185){chunks.push(part);part=''}
  part=part?part+' '+word:word;
 }
 if(part)chunks.push(part);
 return chunks;
}
let yakutSpeechStartTimer;
function finishYakutSpeech(){
 yakutAudioPlaying=false;
 if(yakutReadyChunk&&!hidden){const next=yakutReadyChunk;yakutReadyChunk=null;yakutPlaySpeech(next);return}
 if(yakutRequests.size||yakutSpeechQueue.length)return;
 clearTimeout(yakutTtsSayTimer);yakutTtsSayTimer=null;
 yakutSpeechQueue=[];speaking=false;yakutSpeechEndedAt=Date.now();
 if(yakutGreetingInProgress){yakutGreetingInProgress=false;yakutGreetingEndAt=Date.now();scheduleGreetingRetreat()}
 if(yakutReturnLeftAfterSpeech){yakutReturnLeftAfterSpeech=false;moveTo(leftGreetingX())}
 if(yakutPageOfferPending && !yakutOfferSpoken && !yakutIsGreetingWalking)offerYakutPage();
 if(listenEnabled&&!hidden)queueListen(300);
}
function yakutBrowserSpeech(){
 clearTimeout(yakutSpeechStartTimer);
 ++yakutVoiceGeneration;
 yakutRequests.clear();yakutReadyChunk=null;yakutSpeechQueue=[];yakutTtsPending='';
 clearTimeout(yakutTtsSayTimer);
 const voice=chooseVoice();
 if(!voice||!window.SpeechSynthesisUtterance){finishYakutSpeech();return}
 const turn=yakutVoiceGeneration;
 const utterance=new SpeechSynthesisUtterance(yakutCurrentPrompt);
 utterance.voice=voice;utterance.lang='tr-TR';utterance.rate=1.03;utterance.pitch=1;
 const done=()=>{if(turn===yakutVoiceGeneration)finishYakutSpeech()};
 utterance.onend=done;utterance.onerror=done;
 window.speechSynthesis.speak(utterance);
}
function yakutTtsFailure(e){
 console.warn('YAKUT Ahenk sesi kullanılamıyor:',e?.message||e);
 yakutTtsFailed=true;yakutTtsLastFailure=Date.now();yakutTtsReady=false;yakutTtsPending='';yakutSpeechQueue=[];yakutRequests.clear();yakutReadyChunk=null;yakutAudioPlaying=false;
 clearTimeout(yakutTtsBootTimer);clearTimeout(yakutTtsSayTimer);
 try{yakutTtsWorker?.terminate()}catch(_){}
 yakutTtsWorker=null;if(speaking&&!yakutAudioPlaying&&!yakutGreetingInProgress&&!yakutHoldWelcomeAudio)yakutBrowserSpeech();else finishYakutSpeech();
}
function yakutPlaySpeech(data){
 if(yakutHoldWelcomeAudio){yakutReadyChunk=data;return}
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
  src.start();
  clearTimeout(yakutSpeechStartTimer);yakutAudioPlaying=true;yakutAudioStartTime=performance.now();yakutGestureClock=0;if(yakutSpeechQueue.length&&!yakutRequests.size)yakutTtsSayNow(yakutSpeechQueue.shift());
   // The speaking gesture must never interrupt the real walk animation.
   if(pendingSpeechGesture&&phase!=='walking'){
    const gesture=pendingSpeechGesture;pendingSpeechGesture=null;play(gesture,true);phase='reacting';
   }
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
 // Pause microphone recognition before producing sound to prevent self-triggered loops.
 clearTimeout(listenRetry);
 if(recognition){try{recognition.abort()}catch(_){}}
 yakutCurrentPrompt=String(text||'');

 if(!audioUnlocked){if(listenEnabled)queueListen(650);return}
 speaking=true;yakutAudioPlaying=false;yakutReadyChunk=null;++yakutVoiceGeneration;yakutRequests.clear();
 const voice=text===welcome?null:chooseVoice();
 if(voice&&window.SpeechSynthesisUtterance){yakutBrowserSpeech();return}
 if(text!==welcome&&text.length<=600&&yakutTtsContext?.state==='running'){
  const turn=yakutVoiceGeneration;
  yakutCloudVoice(text).then(data=>{
   if(turn!==yakutVoiceGeneration||hidden)return;
   if(data)yakutPlaySpeech(data);
   else yakutLocalSpeech(text);
  });
  return;
 }
 yakutLocalSpeech(text);
}
async function yakutCloudVoice(text){
 try{
  const response=await fetch('https://kumtas-yakut-api.bloomyvanilla256.chatgpt.site/speech',{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text}),
   signal:AbortSignal.timeout(4000)});
  if(!response.ok)return null;
  const {audio}=await response.json();
  if(typeof audio!=='string'||audio.length>4000000)return null;
  const bytes=atob(audio);
  const pcm=new Float32Array(Math.floor(bytes.length/2));
  if(!pcm.length)return null;
  for(let i=0;i<pcm.length;i++){
   const value=bytes.charCodeAt(i*2)|(bytes.charCodeAt(i*2+1)<<8);
   pcm[i]=(value>=32768?value-65536:value)/32768;
  }
  return {audio:pcm,sampleRate:24000};
 }catch(_){return null}
}
function yakutLocalSpeech(text){
 if(text!==welcome&&chooseVoice()){
  yakutBrowserSpeech();return;
 }
 if(yakutTtsFailed&&Date.now()-yakutTtsLastFailure<12000){
  // Avoid rapid repeated network retries, but never disable speech for the entire visit.
  if(text!==welcome)yakutBrowserSpeech();else finishYakutSpeech();return;
 }
 if(yakutTtsSource){try{yakutTtsSource.stop()}catch(e){}yakutTtsSource=null}
 if(!yakutTtsContext&&window.AudioContext){try{yakutTtsContext=new AudioContext();yakutTtsContext.resume().catch(()=>{})}catch(e){}}
 const segments=splitYakutSpeech(text);
 yakutSpeechQueue=segments.slice(1);
 yakutTtsPending=segments[0]||'';
 startYakutAhenk();
 if(yakutTtsReady&&yakutTtsPending){const first=yakutTtsPending;yakutTtsPending='';yakutTtsSayNow(first)}
 clearTimeout(yakutSpeechStartTimer);
 if(text!==welcome)yakutSpeechStartTimer=setTimeout(()=>{
  if(speaking&&!yakutAudioPlaying&&chooseVoice())yakutBrowserSpeech();
 },2200);
 // Listening resumes only after the voice ends.
}
function positionStage(){stage.style.transform='translate3d('+Math.round(posX)+'px,0,0)'}
function leftGreetingX(){return 0}
function centerAnswerX(){return Math.max(0,(innerWidth-stage.offsetWidth)/2)}
function openingGreeting(){
 if(!ready||hidden||openingGreeted)return;
 // Do not greet before the visitor interacts; never greet again on another page.
 if(!yakutFirstInteraction)return;
 beginYakutVisit();
}
function finishYakutGreetingWalk(){
 yakutIsGreetingWalking=false;yakutGreetingInProgress=true;phase='greeting';model.rotation.y=0;
 const bow=findYakutGesture('bow');
 if(bow&&clips[bow]){yakutOpeningBow=true;play(bow,true)}
 else {console.warn('YAKUT: Eğilme animasyonu dosyada bulunamadı');completeYakutOpening()}
}
function completeYakutOpening(){
 yakutOpeningBow=false;
 try{sessionStorage.setItem('yakutGreeted','1');sessionStorage.setItem('yakutVisited','1')}catch(_){}
 phase='idle';play('wait');yakutReturnLeftAfterSpeech=false;
 if(audioUnlocked){
  enableAudio.hidden=true;
  if(yakutHoldWelcomeAudio){
   yakutHoldWelcomeAudio=false;
   if(yakutReadyChunk){const prepared=yakutReadyChunk;yakutReadyChunk=null;yakutPlaySpeech(prepared)}
   else if(!speaking)speak(welcome);
  }else speak(welcome);
 }
 else {
  // Browsers may block sound until a real user gesture; bow still plays automatically.
  yakutWelcomeWaitingForSound=true;enableAudio.hidden=false;
  scheduleGreetingRetreat(20000);
 }
}
voiceButton.onclick=()=>{
 voiceEnabled=true;visitorInteracted=true;
 if(!ready){show('YAKUT yükleniyor. Ses birazdan başlayacak.',3000);return}
 if(!openingGreeted)openingGreeting();
 else queueListen(250);
};
function moveTo(x){targetX=Math.max(0,Math.min(x,innerWidth-stage.offsetWidth));if(!reduced&&Math.abs(targetX-posX)>12){phase='walking';turnRight=targetX>posX;model.rotation.y=turnRight?Math.PI/2:-Math.PI/2;const gait=Object.keys(clips).find(n=>/^(walk|walk_\d+|walking)$/i.test(n))||Object.keys(clips).find(n=>/walk|yürü/i.test(n));if(gait)play(gait,false,1.12);else{console.warn('YAKUT: yürüme animasyonu bulunamadı, kayma yerine sabit kalıyor');targetX=posX;phase='idle';play('wait')}}else{posX=targetX;positionStage();phase='idle';play('wait')}}
let pendingSpeechGesture=null;
function findYakutGesture(preferred){
 if(preferred==='bow')return Object.keys(clips).find(n=>/^(to[ _-]?bow|bow|bow_\d+|bowing|respect|selam_eğil)$/i.test(n))||Object.keys(clips).find(n=>/bow|eğil|saygı/i.test(n))||null;
 return clips[preferred]?preferred:(clips.agree?'agree':'wait');
}
function react(clip,text,placement='left'){
 if(!ready)return;
 const answering=placement==='center';
 yakutReturnLeftAfterSpeech=answering;
 if (answering) {
  targetX=posX;
  if (phase==='walking') {
   phase='idle';
   walkTimer=0;
   play('wait');
  }
  model.rotation.y=0;
 } else {
  moveTo(leftGreetingX());
 }
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
 ['bolgelerimiz.html',/bölgelerimiz|bölgeler|bolgeler|bölge sayfası|hangi\s*ilçelerde/i],
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
 if(yakutScenarioRequest(message))return null;
 const t=normalizeYakutCommand(message);
 const page=findYakutPage(t);
 if(!page)return null;
 // A factual question on the subject should not unexpectedly navigate away.
 const asksQuestion=/\b(nedir|nasıl|neden|ne\s*zaman|kaç|hesapla|hesaplama|ne\s*kadar|olur\s*mu|mümkün\s*mü)\b/.test(t);
 const navigationVerb=/(?:aç|git|geç|göster|götür|sayfa|bilgi\s*(?:istiyorum|ver|almak)|anlat|incele|konuşalım|bakalım|göreyim|görebilir miyim|yönlendir)/.test(t);
 const shortLabel=t.split(' ').length<=4;
 const explicitlyAddressed=/\byakut\b/.test(t);
 if(asksQuestion&&!navigationVerb)return null;
 if(whileSpeaking&&!navigationVerb&&!explicitlyAddressed&&!shortLabel)return null;
 return (navigationVerb||shortLabel||explicitlyAddressed)?page:null;
}
function cancelYakutSpeech(){
 clearTimeout(yakutSpeechStartTimer);
 window.speechSynthesis?.cancel();
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
  if(el.closest('[hidden],[aria-hidden="true"]'))continue;
  const text=(el.textContent||'').replace(/\s+/g,' ').trim();
  if(text.length<12||seen.has(text)||/(çerez|cookie|tüm hakları saklıdır|whatsapp|iletişime geçin)/i.test(text))continue;
  if(/^(h1|h2|h3|h4)$/i.test(el.tagName) && text.length>135)continue;
  seen.add(text);pieces.push(text);
 }
 const summary=[];let length=0;
 for(const text of pieces){
  const sentence=/[.!?…:;]$/.test(text)?text:text+'.';
  if(length+sentence.length>1200)continue;
  summary.push(sentence);length+=sentence.length+1;
  if(summary.length===7)break;
 }
 return summary.join(' ');
}
function yakutPageIntro(path){
 const names={'index.html':'ana sayfa','kentsel-donusum.html':'kentsel dönüşüm','sss.html':'sık sorulan sorular','hizmetlerimiz.html':'hizmetlerimiz','kurumsal.html':'kurumsal','hakkimizda.html':'hakkımızda','projelerimiz.html':'projelerimiz','iletisim.html':'iletişim','bolgelerimiz.html':'bölgeler'};
 const districts={'bagcilar':'Bağcılar','bahcelievler':'Bahçelievler','bakirkoy':'Bakırköy','gungoren':'Güngören','avcilar':'Avcılar','esenler':'Esenler','kucukcekmece':'Küçükçekmece','zeytinburnu':'Zeytinburnu','yenibosna':'Yenibosna'};
 const area=path.replace('-kentsel-donusum.html','');
 const title=names[path]||(districts[area]?districts[area]+' kentsel dönüşüm':path.replace(/-/g,' '));
 return 'Memnuniyetle. '+title+' sayfasını birlikte inceleyelim. ';
}
function prepareYakutPageOffer(){
 yakutPageOfferPending=true;yakutOfferSpoken=false;
 if(ready&&audioUnlocked&&!speaking)offerYakutPage();
}
function offerYakutPage(){
 if(!ready||!yakutPageOfferPending||yakutOfferSpoken||speaking||yakutIsGreetingWalking||!audioUnlocked)return;
 yakutOfferSpoken=true;
 const page=getYakutCurrentPage();
 const topic=yakutPageIntro(page).replace(/^Memnuniyetle\.\s*/, '').replace(/ sayfasını birlikte inceleyelim\.\s*$/,'');
 const offer=page==='iletisim.html'
  ?'İletişim sayfasındayız. Size adres tarif etmemi ister misiniz?'
  :topic+' sayfasındayız. Size yardımcı olabilir miyim?';
 yakutLastOfferAt=Date.now();
 react('agree',offer,'left');
}
function handleYakutOfferAnswer(t){
 if(!yakutPageOfferPending||!yakutOfferSpoken)return false;
 const normalized=normalizeYakutCommand(t).replace(/^(?:yakut|asistan)\s+/,'').replace(/\s+lütfen$/,'').trim();
 if(/^(?:evet|peki|tamam|olur tabii|evet anlatır mısın|isterim|evet istiyorum|evet anlat|evet bilgi ver|istiyorum|istiyorum anlat|olur|olur anlat|olur isterim|tabii|tabii ki|tabii anlat|anlat|anlat bakalım|anlatsana|anlatır mısın|anlatabilir misin|anlatabilirsin|bilgi ver|bilgi verir misin|bilgileri anlat|bilgi almak istiyorum|dinliyorum|lütfen anlat|evet lütfen|memnuniyetle|başlayabilirsin|başla|hadi anlat|buyur anlat)$/.test(normalized)||/^(?:evet|olur|tabii|peki|tamam)\s+(?:anlat|anlatabilirsin|istiyorum|bilgi ver)(?:\s+bakalım)?$/.test(normalized)){
  yakutPageOfferPending=false;yakutOfferSpoken=false;
  yakutSpeakCurrentPage();
  return true;
 }
 if(/^(?:hayır|hayır istemiyorum|hayır istemem|istemiyorum|istemiyorum teşekkürler|gerek yok|şimdilik hayır|sonra|daha sonra|şimdi değil|hayır teşekkürler|istemem|yok teşekkürler|hayır sağ ol|hayır gerek yok)$/.test(normalized)){
  yakutPageOfferPending=false;yakutOfferSpoken=false;
  react('agree','Tamam, ne zaman isterseniz yardıma hazırım.','left');
  return true;
 }
 return false;
}
function yakutSpeakCurrentPage(){
 const page=getYakutCurrentPage();
 if(page==='iletisim.html'){react('agree',yakutContact.address,'left');return}
 const content=collectYakutPageSpeech();
 const text=yakutPageIntro(page)+(content||'Bu sayfada ayrıntılı açıklama bulunamadı. Size hangi konuda yardımcı olabilirim?');
 react('agree',text,'left');
}
// Verified site contact details. Speak slash as 'A harfi', not a mathematical fraction.
const yakutContact={
 address:'Kocasinan Merkez Mahallesi, Mahmutbey Caddesi, bina numarası iki yüz kırk beş, A harfi, Bahçelievler, İstanbul.',
 landline:'Sabit telefon numaramız: sıfır, iki yüz on iki, dokuz yüz elli beş, elli beş, doksan dokuz.',
 mobile:'Cep telefonu ve WhatsApp numaramız: sıfır, beş yüz kırk üç, yüz seksen bir, otuz dört, seksen beş.',
 email:'E-posta adresimiz: info, et işareti, kumtas, nokta, com, nokta, tr.'
};
function yakutContactRequest(message){
 const t=normalizeYakutCommand(message);
 const wantsContact=/(iletişim bilgi|iletişimimiz|iletişim adres|iletişim numara|bize nasıl ulaş|nasıl ulaşabilirim|irtibat|adresimiz|adresinizi|adresiniz|telefon numara|telefonunuz|telefonunuzu|telefonlarımız|mail adres|e posta adres|eposta adres|mailiniz|mailinizi|numaranız|numaranızı)/.test(t);
 if(!wantsContact)return null;
 const asksAddress=/adres|neredesiniz|nerede bulunuyorsunuz/.test(t);
 const asksPhone=/telefon|numara|whatsapp|cep/.test(t);
 const asksEmail=/mail|e posta|eposta/.test(t);
 if(asksAddress&&!asksPhone&&!asksEmail&&!/iletişim bilgi/.test(t))return yakutContact.address;
 if(asksPhone&&!asksAddress&&!asksEmail&&!/iletişim bilgi/.test(t))return yakutContact.landline+' '+yakutContact.mobile;
 if(asksEmail&&!asksAddress&&!asksPhone&&!/iletişim bilgi/.test(t))return yakutContact.email;
 return Object.values(yakutContact).join(' ');
}
const yakutMalikIntro='Malik hakları hakkında sizi bilgilendireyim. Kentsel dönüşümde riskli yapı tespiti ve tebligat, maliklerin karar sürecine katılımı ve sözleşme koşulları ayrı ayrı değerlendirilir. Riskli yapı tespitine itiraz ve kira yardımı gibi konularda süreler ve başvuru koşulları önemlidir. Hangisini ayrıntılı anlatalım?';
function yakutExplainMalik(){
 try{
  sessionStorage.removeItem('yakutExplainMalik');
  yakutChatHistory=[{role:'user',text:'Kentsel dönüşümde malik hakları'},{role:'assistant',text:yakutMalikIntro}];
  sessionStorage.setItem('yakutChatHistory',JSON.stringify(yakutChatHistory));
 }catch(_){}
 react('agree',yakutMalikIntro,'center');
}
function openYakutPage(path){
 const current=getYakutCurrentPage();
 cancelYakutSpeech();
 if(current===path){queueListen(250);return true}
 try{
  sessionStorage.setItem('yakutVisited','1');
  if(audioUnlocked)sessionStorage.setItem('yakutAudioApproved','1');
 }catch(e){console.warn('YAKUT sayfa geçişi:',e)}
 location.assign(new URL(path,location.origin+'/').href);
 return true;
}
let yakutScenario = null;
const yakutAreaUnit = '(?:m²|m2|metre\\s*kare|metrekare)';
function yakutScenarioRequest(message) {
 const t = normalizeYakutCommand(message.replace(/â/gi, 'a'));
 if (/(?:^| )(?:aç|git|götür|sayfasına|sayfasını)(?: |$)/.test(t)) return false;
 return /(?:kaç daire|kaç konut|kaç dükk[aâ]n|taban oturumu|inşaat alanı|(?:arsa|daire|dükk[aâ]n).{0,35}hesap)/.test(t) ||
  Boolean(yakutScenario && (
   /^(?:peki )?(?:dükk[aâ]n|mağaza)/.test(t) ||
   /(?:kat|brüt|arsam|arsa alanı)/.test(t) && /\d/.test(message) ||
   (yakutScenario.waiting && (/^\d+(?:[.,]\d+)?$/.test(message.trim()) ||
    new RegExp(yakutAreaUnit, 'i').test(message) ||
    Object.keys(yakutDistrictPages).some(name => t.startsWith(name))))
  ));
}
function yakutScenarioAnswer(message) {
 const original = message.toLocaleLowerCase('tr-TR');
 const t = normalizeYakutCommand(message.replace(/â/gi, 'a'));
 const namedDistrict = Object.keys(yakutDistrictPages).find(name =>
  new RegExp('(?:^| )' + name + '(?:$| |da|de|ta|te)').test(t));
 const state = yakutScenario ??= {district:null, area:null, floors:null, flat:null, shop:0, waiting:null};
 if (namedDistrict && state.district && namedDistrict !== state.district) {
  Object.assign(state, {area:null, floors:null, flat:null, shop:0, waiting:null});
 }
 state.district = namedDistrict || state.district;
 const number = '(\\d+(?:[.,]\\d+)*)';
 const read = value => value && Number(value.replace(/\.(?=\d{3}(?:[.,]|$))/g,'').replace(',','.'));
 const area = original.match(new RegExp(number + '\\s*' + yakutAreaUnit, 'i'));
 const bare = original.trim().match(new RegExp('^' + number + '$'));
 const floors = original.match(/\b(\d+)\s*kat(?:lı|lıysa)?(?:[\s.,!?]|$)/);
 const flat = /(?:brüt|daire başına)/.test(t);
 const shop = /dükk[aâ]n|mağaza/.test(t);
 const value = read(area?.[1] || bare?.[1]);
 if (floors && Number(floors[1]) > 0) state.floors = Number(floors[1]);
 if (Number.isFinite(value) && value > 0) {
  if (shop && !/arsa/.test(t) || state.waiting === 'shop' && !/arsa|brüt/.test(t)) state.shop = value;
  else if (flat || state.waiting === 'flat' && !/arsa/.test(t)) state.flat = value;
  else if (state.waiting === 'area' || area && (!state.area || /arsa/.test(t))) state.area = value;
  else if (bare && state.waiting === 'floors' && Number.isInteger(value)) state.floors = value;
 }
 if (!state.district) {
  state.waiting = 'district';
  return 'Arsanız hangi ilçede?';
 }
 if (!state.area) {
  state.waiting = 'area';
  return 'Arsanız kaç metrekare?';
 }
 const fmt = value => value.toLocaleString('tr-TR', {maximumFractionDigits:2});
 const scenarios = [30,40,50].map(percent => ({percent, base:state.area * percent / 100}));
 const describe = fn => scenarios.map(({percent,base}) => 'yüzde ' + percent + ' için ' + fn(base)).join(', ');
 const base = 'Taban oturumu ön hesabı: ' + describe(base => fmt(base) + ' metrekare') + '.';
 if (shop && !state.shop) {
  state.waiting = 'shop';
  return base + ' Dükkân için zeminde kaç metrekare ayıralım?';
 }
 if (!state.floors) {
  state.waiting = 'floors';
  return base + ' Bunlar varsayımsal oranlar. Daire hesabı için zemin dahil kaç kat varsayalım?';
 }
 const total = 'Zemin dahil ' + state.floors + ' kat varsayımıyla toplam brüt alan: ' +
  describe(base => fmt(base * state.floors) + ' metrekare') + '.';
 if (!state.flat) {
  state.waiting = 'flat';
  return total + ' Bir daireyi brüt kaç metrekare varsayalım?';
 }
 state.waiting = null;
 return (state.shop ? 'Zeminde ' + fmt(state.shop) + ' metrekare dükkân ayırarak: ' : 'Daire ön hesabı: ') +
  describe(base => state.shop > base ? 'dükkân zemine sığmaz' :
   Math.floor(base / state.flat) * (state.floors - 1) + Math.floor((base - state.shop) / state.flat) + ' daire') +
  '. Ortak alanlar ve imar koşulları sonucu değiştirebilir.';
}
let yakutChatHistory=[];
try{
 const history=JSON.parse(sessionStorage.getItem('yakutChatHistory')||'[]');
 if(Array.isArray(history))yakutChatHistory=history.slice(-4);
}catch(_){}
const yakutWeatherCities=['İstanbul','Ankara','İzmir','Bursa','Antalya','Adana','Konya','Kocaeli','Sakarya','Gaziantep','Trabzon','Eskişehir','Samsun','Tekirdağ','Yalova'];
let yakutWeatherCity='';
let yakutWeatherPending='';
function yakutWeatherRequest(command){
 const weather=/hava durumu|hava nasıl|hava kaç derece|hava soğuk|hava sıcak|yağmur (?:var mı|yağacak mı|yağar mı)|kar (?:var mı|yağacak mı|yağar mı)|şemsiye (?:alayım|gerek)/.test(command);
 const simpleFollowup=/^(?:peki )?(?:yarın|bugün)(?: nasıl| ne olacak| nasıl olacak| peki)?$/.test(command);
 if(!weather&&!yakutWeatherPending&&!(yakutWeatherCity&&simpleFollowup))return null;
 const findCity=value=>yakutWeatherCities.find(name=>{
  const city=name.toLocaleLowerCase('tr-TR');
  return new RegExp('(?:^| )'+city+'(?:da|de|ta|te|nın|nin)?(?: |$)').test(value);
 });
 const city=findCity(command)||(simpleFollowup?yakutWeatherCity:'');
 const period=/yarın/.test(command)?'tomorrow':/bugün/.test(command)?'today':yakutWeatherPending||'now';
 if(city)return {city,period};
 if(yakutWeatherPending||/(?:[a-zçğıöşü]+ (?:da|de|ta|te) (?:hava|yağmur|kar)|[a-zçğıöşü]+(?:da|de|ta|te) (?:hava|yağmur|kar))/.test(command))return {city:'',period};
 return {ask:true,period};
}
function rememberYakutTurn(question,answer){
 yakutChatHistory=[...yakutChatHistory,{role:'user',text:question.slice(0,420)},
  {role:'assistant',text:answer.slice(0,420)}].slice(-4);
 try{sessionStorage.setItem('yakutChatHistory',JSON.stringify(yakutChatHistory))}catch(_){}
}
async function handle(message){
const q=String(message||'').trim();if(!q||!ready)return;
cancelGreetingRetreat();
const command=normalizeYakutCommand(q);
if(/^(?:yakut\s+)?(?:dur|sus|konuşma|kes|yeter)$/.test(command)){yakutScenario=null;yakutWeatherPending='';cancelYakutSpeech();yakutPageOfferPending=false;moveTo(leftGreetingX());return}
if(/^(?:yakut\s+)?(?:hayır|istemiyorum|bir şey istemiyorum|yardım istemiyorum|gerek yok|şimdilik gerek yok|sonra|şimdi değil)(?:\s+teşekkürler)?$/.test(command)){yakutScenario=null;cancelYakutSpeech();yakutPageOfferPending=false;moveTo(leftGreetingX());return}
if(command==='yakut'||command==='yakut dinle'){cancelYakutSpeech();react('greet_02','Efendim, dinliyorum.','left');return}
processingSpeech=true;
if(recognition){try{recognition.abort()}catch(e){}}
const weather=yakutWeatherRequest(command);
 if(weather?.ask){
  yakutWeatherPending=weather.period;
  const reply='Hangi şehir için hava durumuna bakayım?';
  rememberYakutTurn(q,reply);
  processingSpeech=false;react('agree',reply,'center');return;
 }
 if(weather){yakutWeatherPending='';yakutWeatherCity=weather.city;}
 let answer='';
 const generation=yakutVoiceGeneration;
 const projectQuestion=/(?:referans|projeleriniz|tamamladığınız proje|yaptığınız proje|devam eden proje)/.test(command)&&
  !/(?:başka firma|başka şirket|rakip|kredi|kaynakça)/.test(command);
 const greetingOnly=/^(?:(?:yakut|sen|siz|peki|merhaba|selam)\s+)*(?:nasılsın(?:ız)?|naber|ne haber)(?:\s+(?:sen|siz|yakut|nasılsın(?:ız)?))*$/.test(command);
 let localAnswer=greetingOnly?'İyiyim, teşekkür ederim. Siz nasılsınız?':projectQuestion
  ? 'Projelerimiz sayfasında tamamlanan projelerin, devam eden kaba inşaatların ve mimari proje örneklerinin fotoğraflarını inceleyebilirsiniz. Belirli bir projeyi mi merak ediyorsunuz?'
  : yakutContactRequest(q);
 const siteQuestion=/(?:firmamız|firmanız|şirketiniz|hizmetleriniz|bu site|siteniz|kumtaş)/.test(command);
 const match=siteAnswer(q);
 if(!weather&&!localAnswer&&(match?.exact||siteQuestion)){
  const localMatch=match||await yakutFindAnswer(q);
  if(generation!==yakutVoiceGeneration)return;
  localAnswer=localMatch?.text||'Sitemizde bu konuda doğrulayabildiğim bir bilgi bulamadım. Hangi hizmeti veya projeyi merak ediyorsunuz?';
 }
 if(!weather&&localAnswer){
  rememberYakutTurn(q,localAnswer);
  processingSpeech=false;
  react('agree',localAnswer,'center');return;
 }
 if(generation!==yakutVoiceGeneration)return;
 answer='Şu anda sohbet bağlantısı yanıt vermedi. Tekrar sorabilir misiniz?';
 const endpoint=document.querySelector('meta[name="yakut-chat-endpoint"]')?.content || "https://kumtas-yakut-api.bloomyvanilla256.chatgpt.site/chat";
 const explicitResearch=Boolean(weather&&!weather.city)||/(?:araştır|internetten|kaynaklarına? bak|webde ara|güncel|bugün|son dakika|en son)/i.test(q);
 if(q.length<=500){
  let requestGeneration=generation;
  try{
   const url=new URL(endpoint);
   if(url.protocol==='https:'){
    const ask=async research=>{
     const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({question:q,reference:'',history:yakutChatHistory,research,weather:weather?.city?weather:undefined}),
      signal:AbortSignal.timeout(research||weather?18000:7500)});
     return response.ok?response.json():null;
    };
    let result=explicitResearch&&!weather?.city?null:await ask(false);
    if(requestGeneration!==yakutVoiceGeneration)return;
    if((explicitResearch&&!weather?.city)||result?.answer?.trim()==='WEB_ARAMASI_GEREKLI'){
     answer='Şu anda web kaynaklarından doğrulayamadım. Biraz sonra tekrar deneyebilir misiniz?';
     speak('Tamam, araştırıp size bilgi vereceğim. Biraz bekletebilirim.');
     requestGeneration=yakutVoiceGeneration;
     result=await ask(true);
     if(requestGeneration!==yakutVoiceGeneration)return;
     if(!Array.isArray(result?.sources)||result.sources.length===0)result=null;
    }
    if(typeof result?.answer==='string'&&result.answer.trim()&&result.answer.length<=1200){
     answer=result.answer.trim().replace(/\*\*/g,'');
     rememberYakutTurn(q,answer);
     if(result.sources?.length)console.info('Yakut araştırma kaynakları:',result.sources);
    }
   }
  }catch(_){/* Keep the local answer when the chat service is unavailable. */}
  if(requestGeneration!==yakutVoiceGeneration)return;
 }
processingSpeech=false;
react('agree',answer,'center');
}
function queueListen(delay=600){
 clearTimeout(listenRetry);
 if(!listenEnabled||hidden||processingSpeech||speaking||recognition||micStarting)return;
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
 rec.lang='tr-TR';rec.interimResults=true;rec.continuous=true;rec.maxAlternatives=1;
 rec.onstart=()=>{micStarting=false;talk.textContent='🟢 Dinliyorum'};
 let finalText='';
 let timer;
 const submit=()=>{
  clearTimeout(timer);
  if(recognition!==rec||!finalText||speaking||!listenEnabled||hidden)return;
  const spoken=finalText;
  finalText='';
  handle(spoken);
 };
 rec.onresult=e=>{
  if(recognition!==rec||speaking||!listenEnabled)return;
  micFailureCount=0;
  clearTimeout(timer);
  finalText=Array.from(e.results).filter(result=>result.isFinal)
   .map(result=>result[0].transcript.trim()).join(' ');
  const stillSpeaking=Array.from(e.results).some(result=>!result.isFinal);
  if(finalText&&!stillSpeaking)timer=setTimeout(submit,550);
 };
 rec.onerror=e=>{if(recognition!==rec)return;micStarting=false;micLastError=e.error||'unknown';speechProblem(micLastError)};
 rec.onend=()=>{
  if(recognition!==rec)return;
  submit();
  micStarting=false;recognition=null;
  if(listenEnabled&&!hidden&&!speaking&&!processingSpeech){talk.textContent='🟢 Dinliyorum';queueListen(350)}
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
 listenEnabled=true;micFailureCount=0;micRestartAt=0;visitorInteracted=true;talk.hidden=getYakutCurrentPage()==='index.html';talk.textContent='🟢 Dinliyorum';
 if(!openingSpoken)beginYakutVisit();
 queueListen(250);
 if(!window.speechSynthesis)queueListen(250);
};

close.onclick=()=>{
hidden=!hidden;stage.style.display=hidden?'none':'block';caption.classList.remove('shown');
if(hidden){enableAudio.hidden=true;stopListening();cancelYakutSpeech();window.speechSynthesis?.cancel()}
close.textContent=hidden?'Göster':'✕';talk.style.display=hidden?'none':'';voiceButton.style.display=hidden?'none':'';if(!hidden){positionStage();listenEnabled=true;queueListen(400);show('YAKUT dinlemeye devam ediyor.',3500)}
};
window.addEventListener('resize',()=>{posX=Math.max(-stage.offsetWidth,Math.min(posX,innerWidth-stage.offsetWidth));targetX=Math.max(0,Math.min(targetX,innerWidth-stage.offsetWidth));positionStage()});
function addYakutChestLogo() {
 const chest = model.getObjectByName('mixamorigSpine2');
 if (!chest) return;

 const artwork = document.createElement('canvas');
 artwork.width = 400;
 artwork.height = 350;
 const paint = artwork.getContext('2d', {willReadFrequently: true});
 if (!paint) return;

 const texture = new THREE.CanvasTexture(artwork);
 texture.colorSpace = THREE.SRGBColorSpace;
 texture.anisotropy = 4;
 // Depth at the center and sides of each row on the GLB's chest plate.
 const centerDepth = [0.0788, 0.0916, 0.0998, 0.1051, 0.1085, 0.1109, 0.1118, 0.1114, 0.1087];
 const sideDepth = [0.0696, 0.0850, 0.0930, 0.0991, 0.1028, 0.1036, 0.1024, 0.1001, 0.0958];
 const geometry = new THREE.PlaneGeometry(0.105, 0.092, 12, centerDepth.length - 1);
 const vertices = geometry.attributes.position;
 for (let i = 0; i < vertices.count; i++) {
  const x = vertices.getX(i);
  const y = vertices.getY(i);
  const row = Math.floor(i / 13);
  const edgeWeight = (x / 0.0525) ** 2;
  const depth = THREE.MathUtils.lerp(centerDepth[row], sideDepth[row], edgeWeight);
  vertices.setXYZ(i, x, 0.648 + y, depth + 0.0035);
 }
 const material = new THREE.MeshBasicMaterial({
  map: texture,
  alphaTest: 0.35,
  toneMapped: false
 });
 const logo = new THREE.Mesh(geometry, material);
 logo.frustumCulled = false;
 model.add(logo);
 chest.attach(logo);

 const source = new Image();
 source.onload = () => {
  paint.drawImage(source, 942, 86, 133, 183, 162, 16, 76, 105);
  const pixels = paint.getImageData(0, 0, artwork.width, artwork.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
   pixels.data[i + 3] *= 1 - pixels.data[i] / 255;
   pixels.data[i] = 0;
   pixels.data[i + 1] = 75;
   pixels.data[i + 2] = 194;
  }
  paint.putImageData(pixels, 0, 0);
  paint.fillStyle = '#0045b6';
  paint.font = '400 96px Arial, sans-serif';
  paint.textAlign = 'center';
  paint.textBaseline = 'alphabetic';
  paint.fillText('KUMTAŞ', 200, 201, 382);
  paint.fillText('İNŞAAT', 200, 309, 382);
  texture.needsUpdate = true;
 };
 source.src = chestLogoUrl;
}
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
addYakutChestLogo();
const size=bbox.getSize(new THREE.Vector3()),center=bbox.getCenter(new THREE.Vector3());
normalScale=1.55/Math.max(size.y,0.01);
model.scale.setScalar(normalScale);model.position.set(-center.x*normalScale,-center.y*normalScale,-center.z*normalScale);
basePosition=model.position.clone();
model.traverse(o=>{if(o.isSkinnedMesh){o.frustumCulled=false;if(o.morphTargetDictionary)face=o}});
scene.add(model);mixer=new THREE.AnimationMixer(model);
gltf.animations.forEach(c=>clips[c.name]=mixer.clipAction(c));
mixer.addEventListener('finished',()=>{if(yakutOpeningBow){completeYakutOpening();return}if(phase==='reacting'||phase==='greeting'){phase='idle';play('wait');walkTimer=0}});
ready=true;loadSiteKnowledge().catch(console.warn);posX=leftGreetingX();targetX=leftGreetingX();
 try{
  if(sessionStorage.getItem('yakutGreeted')==='1' && getYakutCurrentPage()!=='index.html'){
   openingSpoken=true;openingGreeted=true;yakutFirstGreetingDone=true;
  }
  if(sessionStorage.getItem('yakutAudioApproved')==='1')audioUnlocked=true;
 }catch(e){console.warn('YAKUT oturumu:',e)}
listenEnabled=getYakutCurrentPage()!=='index.html';voiceButton.hidden=true;if(listenEnabled){talk.hidden=false;queueListen(450);}
model.rotation.y=0; // Face the visitor when waiting; turn sideways only during actual steps.
posX=targetX;phase='idle';play('wait');
 // Home: render YAKUT in the lower-left immediately after the GLB is ready.
 // A genuine pointer/key interaction, not microphone permission, starts walking.
 // Retain the real walk animation; never translate an idle model across the page.
 if(getYakutCurrentPage()==='index.html'){
  posX=leftGreetingX();targetX=posX;phase='idle';play('wait');
 }
 if(yakutFirstInteraction||yakutWelcomeRequested||getYakutCurrentPage()==='kentsel-donusum.html')queueMicrotask(beginYakutVisit);
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
 if(yakutGestureClock>3.5){
  yakutGestureClock=0;
  if(clips.agree){phase='reacting';play('agree',true)}
 }
}
if(phase==='walking'){
const step=(innerWidth<650?105:175)*dt;
if(Math.abs(targetX-posX)<=step){posX=targetX;phase='idle';model.rotation.y=0;play('wait');walkTimer=0;
 // Finish walking with actual footstep motion before any response gesture.
 if(pendingSpeechGesture&&yakutAudioPlaying){const gesture=pendingSpeechGesture;pendingSpeechGesture=null;play(gesture,true);phase='reacting'}
 if(yakutIsGreetingWalking)finishYakutGreetingWalk()
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
startYakutAhenk(); // Warm up voice model in parallel with 3D loading.
init();
})();