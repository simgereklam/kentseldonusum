(() => {
'use strict';
if(location.protocol==='http:'&&/^(?:www\.)?xn--kentseldnm-lcb7ea99k\.com\.tr$/i.test(location.hostname)){
 const secureUrl=new URL(location.href);
 secureUrl.protocol='https:';
 location.replace(secureUrl.href);
 return;
}
if(window.__yakutV9)return;window.__yakutV9=true;
const url=new URL('yakut_v10.glb?v=39b508a',document.currentScript.src).href;
const yakutFreshReload=performance.getEntriesByType('navigation')?.[0]?.type==='reload';
// Start downloading the model while Three.js loads.
const yakutModelData=fetch(url,{priority:'high'}).then(response=>{
 if(!response.ok)throw new Error('YAKUT_MODEL_HTTP_'+response.status);
 return response.arrayBuffer();
}).catch(error=>error);
const chestLogoUrl=new URL('yakut-mavi-amblem.jpg',url).href;
const welcome='Merhaba, hoş geldiniz. Ben Kumtaş İnşaat dijital asistanınız Yakut. Sizin için ne yapabilirim?';
// Discard the old assistant's stale greeting flag once after migrating to Gemini-only audio.
try{
 if(sessionStorage.getItem('yakutGeminiOnlyMigration')!=='2'){
  sessionStorage.removeItem('yakutGreeted');
  sessionStorage.setItem('yakutGeminiOnlyMigration','2');
 }
}catch(_){}

const yakutVoiceReady=new Promise(resolve=>{
 const script=document.createElement('script');
 script.src=new URL('yakut-gemini-voice.js?v=emel-continuous-20261126',document.currentScript.src).href;
 script.onload=()=>resolve(window.YakutGeminiVoice?new window.YakutGeminiVoice({
  endpoint:document.querySelector('meta[name="yakut-chat-endpoint"]')?.content||
  'https://kumtas-yakut-chat.simgereklam.workers.dev/chat',
  onStart:()=>beginYakutAudioPlayback(),
  onError:error=>{
   console.warn('Yakut Gemini ses:',error);
   talk.hidden=false;
   talk.textContent=String(error?.message).endsWith('_429')
    ? '🔊 Ses kullanım sınırı · Sonra dene'
    : '🔊 Ses hatası · Tekrar dene';
   talk.title=String(error?.message||error||'Ses servisi hatası').slice(0,140);
  }
 }):null);
 script.onerror=()=>resolve(null);
 document.head.appendChild(script);
});
let yakutVoice=null;
yakutVoiceReady.then(engine=>{yakutVoice=engine;});

const css=document.createElement('style');
css.textContent=`
#yakut-v9{position:fixed;left:0;bottom:52px;width:clamp(255px,28vw,370px);height:min(73dvh,clamp(380px,53vw,580px));z-index:110;pointer-events:none;will-change:transform;filter:drop-shadow(0 6px 12px #001c3273)}
#yakut-v9 canvas{display:block;width:100%;height:100%}
#yakut-map-link{position:fixed;right:14px;bottom:74px;z-index:135;background:#09638c;color:white;padding:10px 14px;border-radius:20px;font:700 14px Arial,sans-serif;text-decoration:none}
#yakut-map-link[hidden]{display:none}
#yakut-v9-ui[hidden]{display:none!important}
#yakut-v9-ui{position:fixed;bottom:14px;left:3px;z-index:130;display:flex;gap:6px;align-items:center;max-width:calc(100vw - 24px);font:600 13px Arial,sans-serif}
#yakut-v9-ui button{border:1px solid #4fb3e9;background:#095983;color:#fff;border-radius:18px;padding:9px 12px;cursor:pointer;box-shadow:0 3px 10px #0003}
#yakut-v9-ui button:hover{background:#137aaa}
#yakut-v9-ui input{display:none;width:min(320px,45vw);padding:9px;border:1px solid #71c8fa;border-radius:14px;background:#fff;color:#122f44;font:13px Arial,sans-serif}
#yakut-v9-ui.open input{display:block}
@media(max-width:650px){#yakut-v9{width:clamp(225px,65vw,325px);height:min(62dvh,clamp(355px,101vw,500px));bottom:45px;left:0}#yakut-v9-ui{bottom:8px;left:3px;gap:4px}#yakut-v9-ui button{padding:8px;font-size:12px}#yakut-v9-ui input{width:min(180px,41vw)}}
@media(prefers-reduced-motion:reduce){#yakut-v9{transition:none!important}}
`;
document.head.appendChild(css);
const stage=document.createElement('div');stage.id='yakut-v9';stage.setAttribute('aria-label','Hareketli 3D YAKUT asistanı');
stage.appendChild(document.createElement('canvas'));
const ui=document.createElement('div');ui.id='yakut-v9-ui';
ui.innerHTML='<button id="yakut-talk" type="button" aria-label="Yakut sesini etkinleştir">🔊 Sesi Aç</button><button id="yakut-close" type="button" aria-label="YAKUT’u gizle">✕</button>';
document.body.append(stage,ui);
const talk=ui.querySelector('#yakut-talk'),close=ui.querySelector('#yakut-close');
let THREE,model,mixer,face,clips={},current=null,ready=false,hidden=false,speaking=false,recognition=null,listenEnabled=true,micStarting=false,listenRetry=null;
let openingGreeted=false,openingSpoken=false,characterRendered=false;
let micFailureCount=0,micLastError='',micRestartAt=0;
let emptyRecognitionCount=0;
let processingSpeech=false;
let micStartTimer;
let lastUserUtterance='',lastUserUtteranceAt=0;
let yakutTurnInFlight=false;
let yakutGreetingRequested=false;
let yakutFirstGreetingDone=false,yakutPageOfferPending=false,yakutOfferSpoken=false,yakutIsGreetingWalking=false,yakutPendingPageSpeech=false;
let yakutGreetingInProgress=false,yakutGreetingEndAt=0;
let yakutCurrentPrompt='',yakutLastOfferAt=0,yakutLastInputAt=0,yakutOpeningBow=false,yakutSpeechEndedAt=0;
let phase='loading',posX=-280,targetX=0,walkTimer=0,phaseTime=0,turnRight=true,dialogTimer=0,normalScale=1,basePosition=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function show(text,ms=7000){}
function play(name,once=false,speed=1){if(!THREE||!clips[name])return false;
const next=clips[name];if(current===next&&next.isRunning()&&!once)return true;
if(current&&current!==next)current.fadeOut(.18);
next.reset().setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity).setEffectiveTimeScale(speed).setEffectiveWeight(1).fadeIn(.22).play();
next.clampWhenFinished=!!once;current=next;return true;
}
let audioUnlocked=false,yakutAudioPlaying=false,yakutVoiceGeneration=0,yakutGestureClock=0;
let yakutDeferredSpeech=null;
let yakutAddressPending=false;
let yakutVoiceRetryAt=0;
let yakutStartTimer;
function resumeYakutSound(){
 // Unlock in the original trusted click whenever the engine has loaded.
 const engine=yakutVoice;
 if(!engine){
  yakutVoiceReady.then(v=>{
   if(v&&!hidden){
    v.unlock().then(ok=>{if(ok)onYakutSoundReady();else{talk.hidden=false;talk.textContent='🔊 Sesi Aç';}});
   }
  });
  return;
 }
 engine.unlock().then(ok=>{
  if(ok)onYakutSoundReady();
  else{talk.hidden=false;talk.textContent='🔊 Sesi Aç';}
 });
}
function onYakutSoundReady(){
 audioUnlocked=true;
 if(!ready||hidden)return;
 talk.hidden=false;
 if(yakutDeferredSpeech){
  const answer=yakutDeferredSpeech;yakutDeferredSpeech=null;
  speaking=false;yakutIsGreetingWalking=false;
  speak(...answer);return;
 }
 if(characterRendered&&getYakutCurrentPage()==='index.html'&&!yakutGreetingRequested&&!speaking&&!processingSpeech){
  yakutGreetingRequested=true;
  if(model&&Math.abs(posX-leftGreetingX())>12)moveTo(leftGreetingX());
  yakutGreetingInProgress=true;
  pendingSpeechGesture=findYakutGesture('greet_01');
  speak(welcome);return;
 }
 if(yakutAddressPending&&!speaking){
  yakutAddressPending=false;
  react('agree',yakutContact.address,'center');return;
 }
 if(yakutPendingPageSpeech&&!speaking){offerYakutPage();return;}
 if(!speaking&&!processingSpeech&&!yakutIsGreetingWalking)queueListen(0);
}
function beginYakutVisit(){
 if(!ready||hidden||!model)return;
 if(getYakutCurrentPage()==='kentsel-donusum.html'&&audioUnlocked){
  try{if(sessionStorage.getItem('yakutExplainMalik')==='1'){yakutExplainMalik();return}}catch(_){}
 }
 let alreadyGreeted=false;
 try{alreadyGreeted=!yakutFreshReload&&sessionStorage.getItem('yakutGreeted')==='1'}catch(_){}
 // No automatic welcome animation: microphone has priority on every visit.
 if(getYakutCurrentPage()==='index.html'&&!alreadyGreeted)queueListen(0);
 if(yakutPageOfferPending&&audioUnlocked&&!yakutOfferSpoken){offerYakutPage();return}
 if(!speaking&&!processingSpeech)queueListen(50);
}
function rememberYakutActivation(){try{sessionStorage.setItem('yakutActivated','1')}catch(_){}}
function restoreYakutActivation(){try{return sessionStorage.getItem('yakutActivated')==='1'}catch(_){return false}}
function handleYakutActivation(event){
 if(!event.isTrusted||navigator.userActivation?.isActive===false||hidden||talk.contains(event.target))return;
 rememberYakutActivation();
 micFailureCount=0;emptyRecognitionCount=0;micRestartAt=0;
 listenEnabled=true;
 startSpeech();
 resumeYakutSound();
}
document.addEventListener('click',handleYakutActivation,true);
document.addEventListener('keydown',handleYakutActivation,true);
function finishYakutSpeech(restartAfterGreeting=false){
 yakutAudioPlaying=false;
 speaking=false;processingSpeech=false;yakutSpeechEndedAt=Date.now();
 releaseYakutMic();micRestartAt=0;
 if(yakutGreetingInProgress){
  yakutGreetingInProgress=false;yakutGreetingEndAt=Date.now();
  moveTo(yakutRightX());
 }
 // Do not automatically offer another narrated answer after finishing one reply.
 if(listenEnabled&&!hidden){
  if(restartAfterGreeting){
   releaseYakutMic();
   micRestartAt=0;
   talk.textContent='🎤 Mikrofon açılıyor';
  }else if(recognition&&!micStarting)talk.textContent='🟢 Dinliyorum';
  queueListen(0);
 }
}
async function speak(text,deferPlayback=true,isHoldNotice=false,walkingIntro=false){
 const prompt=prepareYakutSpokenText(String(text||'').trim());
 if(!prompt)return;
 if(!isHoldNotice)stopYakutAudioOutput();
 yakutCurrentPrompt=prompt;speaking=true;yakutAudioPlaying=false;
 const turn=++yakutVoiceGeneration;
 const greeting=prompt===prepareYakutSpokenText(welcome);
 let playbackAttempted=false;
 try{
  const voice=await yakutVoiceReady;
  if(turn!==yakutVoiceGeneration||hidden)return;
  if(!voice){console.warn('Yakut: Gemini ses motoru yüklenemedi.');return;}
  if(!voice.ready){
   if(deferPlayback){
    yakutDeferredSpeech=[prompt,true,isHoldNotice];
    talk.hidden=false;talk.textContent='🔊 Sesi Aç';
   }
   return;
  }
  queueListen(0);
  playbackAttempted=true;
  if(walkingIntro&&phase==='walking'){
   const intro='Tabii, size hemen bilgi vereyim.';
   yakutCurrentPrompt=intro;
   await voice.speak(intro);
   if(turn!==yakutVoiceGeneration||hidden)return;
   yakutCurrentPrompt=prompt;
  }
  const ok=await voice.speak(prompt,{
   chunkSize:2000,
   beforePlayback:!greeting&&model?()=>new Promise(resolve=>{
    const check=()=>{
     if(turn!==yakutVoiceGeneration||hidden||phase!=='walking'){
      if(turn===yakutVoiceGeneration&&!hidden&&model)model.rotation.y=0;
      resolve();return;
     }
     setTimeout(check,10);
    };check();
   }):undefined
  });
  if(ok&&greeting){
   try{sessionStorage.setItem('yakutGreeted','1')}catch(_){}
  }else if(!ok&&greeting){yakutGreetingRequested=false;}
 }catch(error){console.warn('Yakut Gemini Aoede:',error);}
 finally{if(turn===yakutVoiceGeneration)finishYakutSpeech(greeting&&playbackAttempted);}
}

function yakutChatEndpoint(){
 const endpoint=document.querySelector('meta[name="yakut-chat-endpoint"]')?.content;
 return endpoint||window.yakutChatServiceUrl||'https://kumtas-yakut-chat.simgereklam.workers.dev/chat';
}
async function ensureYakutAudio(){return Boolean(yakutVoice?.ready);}
function positionStage(){stage.style.transform='translate3d('+Math.round(posX)+'px,0,0)'}
function leftGreetingX(){return 0}
function yakutRightX(){return Math.max(0,innerWidth-stage.offsetWidth)}
function centerAnswerX(){return Math.max(0,(innerWidth-stage.offsetWidth)/2)}
function finishYakutGreetingWalk(){
 yakutIsGreetingWalking=false;yakutGreetingInProgress=true;phase='greeting';if(model)model.rotation.y=0;
 const bow=findYakutGesture('bow');
 if(bow&&clips[bow]){yakutOpeningBow=true;play(bow,true)}
 else completeYakutOpening();
}
function completeYakutOpening(){
 yakutOpeningBow=false;
 try{sessionStorage.setItem('yakutGreeted','1');sessionStorage.setItem('yakutVisited','1')}catch(_){}
 phase='idle';play('wait');
 speak(welcome);
}
function moveTo(x){if(!model)return;targetX=Math.max(0,Math.min(x,innerWidth-stage.offsetWidth));if(!reduced&&Math.abs(targetX-posX)>1){phase='walking';turnRight=targetX>posX;model.rotation.y=turnRight?Math.PI/2:-Math.PI/2;const gait=Object.keys(clips).find(n=>/^(walk|walk_\d+|walking)$/i.test(n))||Object.keys(clips).find(n=>/walk|yürü/i.test(n));if(gait)play(gait,false,1);else{targetX=posX;phase='idle';play('wait')}}else{posX=targetX;positionStage();phase='idle';play('wait')}}
let pendingSpeechGesture=null;
function findYakutGesture(preferred){
 if(preferred==='bow')return Object.keys(clips).find(n=>/^(to[ _-]?bow|bow|bow_\d+|bowing|respect|selam_eğil)$/i.test(n))||Object.keys(clips).find(n=>/bow|eğil|saygı/i.test(n))||null;
 return clips[preferred]?preferred:(clips.agree?'agree':'wait');
}
function react(clip,text,placement='left',pageNarration=false){
 if(!ready)return;
 if(model){
  const longAnswer=String(text||'').trim().split(/\s+/).length>=35;
  if(longAnswer){
   if(phase!=='walking'||Math.abs(targetX-centerAnswerX())>1)moveTo(centerAnswerX());
  }else if(phase==='walking'){
   targetX=posX;phase='idle';model.rotation.y=0;play('wait');walkTimer=0;
  }
 }
 phaseTime=0;
 pendingSpeechGesture=null;
 speak(text,true,false,pageNarration&&phase==='walking');
}
const yakutDistrictPages={'bağcılar':'bagcilar','bahçelievler':'bahcelievler','bakırköy':'bakirkoy','güngören':'gungoren','avcılar':'avcilar','esenler':'esenler','küçükçekmece':'kucukcekmece','zeytinburnu':'zeytinburnu','yenibosna':'yenibosna'};
const yakutPages={
 'index.html':['Ana Sayfa','anasayfa','eve dön'],
 'kurumsal.html':['Kurumsal','hakkımızda','şirket bilgileri'],
 'kentsel-donusum.html':['Kentsel Dönüşüm'],
 'hizmetlerimiz.html':['Hizmetlerimiz','hizmetler'],
 'projelerimiz.html':['Projelerimiz','projeler','referanslar'],
 'bolgeler.html':['Bölgeler'],
 'bolgelerimiz.html':['Bölgelerimiz','hizmet bölgeleri'],
 'sss.html':['Sık Sorulan Sorular','sss','s s s','sorular','sıkça sorulan sorular'],
 'iletisim.html':['İletişim','ücretsiz keşif al','ücretsiz keşif'],
 'basvuru.html':['Başvuru','ücretsiz başvuru'],
 ...Object.fromEntries(Object.entries(yakutDistrictPages).map(([name,slug])=>[
  slug+'-kentsel-donusum.html',[name+' Kentsel Dönüşüm',name]
 ]))
};
function yakutPageName(path){
 return yakutPages[path]?.[0]||document.querySelector('h1')?.textContent.trim()||'açık';
}
function yakutPageCommand(command){
 const raw=normalizeYakutCommand(command);
 const hasAction=/(?:^| )(?:aç|açar|açabilir|göster|git|gidelim|geç|götür|yönlendir|sayfa|sayfaya|sayfasına|sayfasını|sayfayı)(?: |$)/.test(raw);
 const removeWords=['sayfasını','sayfasına','sayfası','sayfayı','sayfaya','sayfa','sayfalarına','sayfalara','sayfalar','açar mısınız','açar mısın','açabilir misiniz','açabilir misin','açar','aç','gösterir misin','göster','gidelim','git','geç','götür','yönlendir','lütfen','istiyorum'];
 let words=' '+raw.replace(/^(?:(?:yakut|asistan|lütfen|hadi|hemen|beni|bizi|bana|bize) )+/,'')+' ';
 for(const phrase of removeWords)words=words.split(' '+phrase+' ').join(' ');
 words=words.replace(/\s+/g,' ').trim();
 if(!words)return null;
 // Exact page names also work, but incidental business questions never navigate.
 if(!hasAction&&!Object.values(yakutPages).some(names=>names.some(n=>normalizeYakutCommand(n)===words)))return null;
 const entries=Object.entries(yakutPages).sort((a,b)=>Math.max(...b[1].map(n=>n.length))-Math.max(...a[1].map(n=>n.length)));
 for(const [path,names] of entries){
  for(const name of names){
   const label=normalizeYakutCommand(name);
   if(words===label||['a','e','ya','ye','ı','i','yı','yi'].some(suffix=>words===label+suffix||words===label+' '+suffix))return path;
  }
 }
 return null;
}
function navigateFromRecognition(transcript){
 const command=normalizeYakutCommand(transcript);
 const destination=isYakutHomeCommand(command)?'index.html':yakutPageCommand(command);
 if(!destination)return false;
 releaseYakutMic();
 openYakutPage(destination);
 return true;
}
function normalizeYakutCommand(message){
 return String(message||'').toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü0-9\s]/gi,' ').replace(/\s+/g,' ').trim();
}
function isYakutOwnVoice(text){
 const heard=normalizeYakutCommand(text);
 const own=normalizeYakutCommand(yakutCurrentPrompt);
 if(!heard||!own)return false;
 if(own.includes(heard)||heard.includes(own))return true;
 const words=heard.split(' ').filter(word=>word.length>2);
 if(words.length<3)return false;
 const ownWords=new Set(own.split(' '));
 return words.filter(word=>ownWords.has(word)).length/words.length>=0.75;
}
function isYakutStopCommand(command){
 return /^(?:(?:yakut|asistan|lütfen) )*(?:dur(?:un)?|sus(?:un)?|konuşma|kes|yeter|bekle|bir saniye|bi saniye)(?: (?:lütfen|yakut|artık))*$/.test(command);
}
function getYakutCurrentPage(){
 const path=location.pathname.split('/').filter(Boolean).pop()||'index.html';
 try{return decodeURIComponent(path).toLowerCase()}catch(_){return path.toLowerCase()}
}
function isYakutHomeCommand(message){
 const t=normalizeYakutCommand(message);
 return /^(?:(?:yakut|asistan|lütfen|beni|bizi|hemen|hadi)\s+)*(?:ana\s*sayfa(?:ya|yı)?|anasayfa(?:ya|yı)?|ana\s*sayfayı\s*aç|ana\s*sayfaya\s*(?:git|dön|geç)|eve\s*dön)(?:\s+(?:aç|git|dön|geç|götür|lütfen|istiyorum))?$/.test(t);
}
function yakutWantsCompanyInfo(command){
 const topic=command.replace(/^(?:(?:yakut|asistan|lütfen) )+/, '');
 if(/(?:sayfasını|sayfasına|sayfayı|sayfaya) (?:aç|göster|git|geç)/.test(topic))return false;
 if(/(?:kumtaş|şirket|firmamız|firmanız|hakkımızda)/.test(topic)&&
    /(?:hakkında|bilgi|anlat|tanıt|ne iş|neler yap|kimdir|nedir)/.test(topic))return true;
 return /^(?:hakkımızda|şirket bilgileri(?:ni)?|firma bilgileri(?:ni)?)(?: (?:ver|anlat|istiyorum|verir misin|verebilir misin|almak istiyorum|lütfen))*$/.test(topic);
}
function stopYakutAudioOutput(){yakutVoice?.stop();}
function cancelYakutSpeech(){
 stopYakutAudioOutput();
 yakutChatController?.abort();
 ++yakutVoiceGeneration;yakutAudioPlaying=false;yakutDeferredSpeech=null;
 pendingSpeechGesture=null;speaking=false;processingSpeech=false;
}
function stopYakutAnswer(){
 yakutAddressPending=false;
 if(!speaking&&!processingSpeech){
  yakutScenario=null;yakutWeatherPending='';
 }
 yakutPageOfferPending=false;
 cancelYakutSpeech();
 if(phase==='reacting'){phase='idle';play('wait')}
 finishYakutSpeech();
}
function collectYakutPageSpeech(){
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
  if(length+sentence.length>1450)continue;
  summary.push(sentence);length+=sentence.length+1;
  if(summary.length===10)break;
 }
 return summary.join(' ');
}
function yakutPageIntro(path){
 return path==='index.html'?'Ana sayfadayız. ':yakutPageName(path)+' sayfasındayız. ';
}
function prepareYakutPageOffer(){
 if(!Object.hasOwn(yakutPages,getYakutCurrentPage()))return;
 yakutPageOfferPending=true;yakutOfferSpoken=false;
 if(ready&&audioUnlocked&&!speaking)offerYakutPage();
}
function offerYakutPage(){
 if(!ready||!yakutPageOfferPending||yakutOfferSpoken||speaking||yakutIsGreetingWalking||!audioUnlocked)return;
 yakutOfferSpoken=true;
 const page=getYakutCurrentPage();
 if(yakutPendingPageSpeech){
  yakutPendingPageSpeech=false;
  yakutPageOfferPending=false;
  yakutSpeakCurrentPage();
  return;
 }
 const offer=yakutPageIntro(page)+'Bu sayfa hakkında bilgi ister misiniz?';
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
const yakutApprovedPageSpeech=Object.freeze({"kurumsal":"2004 yılında kurulan Kumtaş İnşaat Ltd. Şti., 21 yılı aşkın köklü geçmişiyle Türkiye’nin farklı bölgelerinde inşaat, taahhüt, madencilik, hafriyat ve konut üretimi alanlarında faaliyet göstermektedir. Faaliyet alanlarımız: İnşaat taahhüt projeleri, madencilik ve hafriyat hizmetleri, konut ve ticari yapılar, sanayi yapıları, soğuk hava depoları ve antrepolar. Öne çıkan referanslarımız: Bursa Şişecam Fabrikası. 2004 yılından bu yana aralıksız iş ortaklığı. Kumtaş İnşaat, Bursa Şişecam tesislerinde sürekli taahhüt işleri yürütmekte olup, aynı sahada yerleşik şube ofisi ve makine parkuru bulundurmaktadır. Konut projeleri: 50 konut ve ticari alan projeleri başarıyla tamamlanmış ve sahiplerine teslim edilmiştir.","kentsel-donusum":"Binanızı yıkmadan önce haklarınızı netleştirin. Süreç sade, anlaşılır ve maliklerin karar verebileceği şekilde ilerler. Birinci aşama, ön görüşme. İlçe, mahalle, ada parsel, daire metrekare ve bina bilgileri alınır. İkinci aşama, imar ve fizibilite. Arsa alanı, mevcut ruhsat, kat adedi ve yapılabilir proje modeli incelenir. Üçüncü aşama, malik bilgilendirme. Kat karşılığı model, metrekare dengesi ve teslim şartları anlatılır. Dördüncü aşama, sözleşme ve teminat. Noter onaylı sözleşme, teminat ve malzeme standardı netleştirilir. Beşinci aşama, yıkım ve ruhsat. Yasal süreçler, ruhsat hazırlığı ve kontrollü yıkım planlanır. Altıncı aşama, yeni bina teslimi. Kaba inşaat, ince işler, dış cephe ve anahtar teslim süreci tamamlanır."});
function yakutPageSpeech(page){
 return yakutApprovedPageSpeech[page]||window.yakutSiteVoice?.[page]||'';
}
function yakutSpeakCurrentPage(){
 const page=getYakutCurrentPage().replace(/\.html$/,'');
 const localText=yakutPageSpeech(page);
 if(localText)react('agree',localText,'center',true);
}
const yakutPhoneNumbers={office:'02129555599',whatsapp:'05431813485'};
const yakutSpokenDigits=['sıfır','bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz'];
function speakYakutPhone(number){
 const tens=['','on','yirmi','otuz','kırk','elli','altmış','yetmiş','seksen','doksan'];
 const digits=String(number).replace(/\D/g,'');
 function groupWords(group){
  const leading=group.match(/^0+/)?.[0].length||0;
  const n=Number(group),h=Math.floor(n/100),t=Math.floor(n%100/10),u=n%10;
  return [...Array(leading).fill('sıfır'),h===1?'yüz':h>1?yakutSpokenDigits[h]+' yüz':'',tens[t],u?yakutSpokenDigits[u]:''].filter(Boolean).join(' ');
 }
 return [digits.slice(0,4),digits.slice(4,7),digits.slice(7,9),digits.slice(9)].filter(Boolean).map(groupWords).join(', ');
}
function prepareYakutSpokenText(text){
 text=text.replace(/\b245\s*\/\s*a\b/gi,'iki yüz kırk beş bölü A');
 for(const number of Object.values(yakutPhoneNumbers)){
  const separator='[ .()\\-]*';
  const digits=number.slice(1).split('').join(separator);
  const phone=new RegExp('(?<!\\d)(?:(?:\\+?9)?0'+separator+')?'+digits+'(?!\\d)','g');
  text=text.replace(phone,()=>speakYakutPhone(number));
 }
 return text;
}
const yakutContact={
 address:'Merkez adresimiz Kocasinan Merkez Mahallesi, Mahmutbey Caddesi, numara iki yüz kırk beş bölü A, Bahçelievler, İstanbul.',
 landline:'Ofis sabit telefon numaramız '+yakutPhoneNumbers.office+'.',
 mobile:'WhatsApp cep telefonu numaramız '+yakutPhoneNumbers.whatsapp+'.',
 email:'E-posta adresimiz: info, et işareti, kumtas, nokta, com, nokta, tr.'
};
function readYakutContactPhones(root){
 const links=Array.from(root.querySelectorAll('a[href^="tel:"]'));
 for(const link of links){
  let number=link.getAttribute('href').slice(4).replace(/\D/g,'');
  if(number.length===12&&number.startsWith('90'))number='0'+number.slice(2);
  if(!/^0\d{10}$/.test(number))continue;
  if(number.startsWith('05'))yakutPhoneNumbers.whatsapp=number;
  else yakutPhoneNumbers.office=number;
 }
 yakutContact.landline='Ofis sabit telefon numaramız: '+yakutPhoneNumbers.office+'.';
 yakutContact.mobile='WhatsApp cep telefonu numaramız: '+yakutPhoneNumbers.whatsapp+'.';
}
let yakutContactRead=null;
function refreshYakutContactPhones(){
 if(getYakutCurrentPage()==='iletisim.html'){readYakutContactPhones(document);return Promise.resolve();}
 if(!yakutContactRead)yakutContactRead=fetch(new URL('iletisim.html',location.origin+'/'),{signal:AbortSignal.timeout(2500)})
  .then(response=>{if(!response.ok)throw Error('contact page');return response.text()})
  .then(html=>readYakutContactPhones(new DOMParser().parseFromString(html,'text/html')))
  .catch(()=>{yakutContactRead=null;});
 return yakutContactRead;
}
function yakutIsAddressCommand(command){
 const t=normalizeYakutCommand(command);
 if(/(?:mail|e posta|eposta|ip adres|parsel|başka adres|yol tarifi|nasıl gider|nasıl gel|nasıl ulaş|metrobüs|taksi|telefon|whatsapp)/.test(t))return false;
 return /(?:^| )(?:adres|adresi|adresini|adresiniz|adresinizi|adresinizin|adresimiz|adresimizi|adresin|adresine|adresinize)(?: |$)/.test(t)
 || /^(?:(?:yakut|lütfen|merkez|ofis|şirket) )*(?:neredesiniz|nerede bulunuyorsunuz)$/.test(t);
}
function yakutWantsLocation(command){
 return /(?:^| )(?:konum(?:u|unuz|unuzu|unu)?|lokasyon(?:u|unuz|unuzu)?|harita)(?: |$)/.test(command)&&
  /^(?:(?:yakut|lütfen) )*(?:konum(?:u|unuz|unuzu)?|harita)$|(?:^| )(?:nerede|at(?:ar)?|gönder(?:ir)?|paylaş(?:ır)?|ver(?:ir)?|göster(?:ir)?|istiyorum|şirket(?:in|inizin|imizin)?|firma(?:nın|nızın|mızın)?|ofis(?:in|inizin|imizin)?|kumtaş|yol tarifi)(?: |$)/.test(command)&&
  !/(?:parsel|arsa|binam|benim konum|proje konum)/.test(command);
}
function yakutShareLocation(){
 let link=document.getElementById('yakut-map-link');
 if(!link){
  link=document.createElement('a');
  link.id='yakut-map-link';
  const map=new URL('https://www.google.com/maps/search/');
  map.searchParams.set('api','1');
  map.searchParams.set('query','Kocasinan Merkez Mahallesi Mahmutbey Caddesi No 245/A Bahçelievler İstanbul');
  link.href=map.href;
  link.target='_blank';
  link.rel='noopener noreferrer';
  link.textContent='Kumtaş konumunu haritada aç';
  document.body.appendChild(link);
 }
 link.hidden=false;
 react('agree','Şirketimizin konum bağlantısını ekrana ekledim. Dokunarak haritada açabilirsiniz.','left');
}
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
function yakutPhoneAnswer(command){
 const request=command
  .replace(/^(?:(?:yakut|lütfen|bana|bize|sizin|kumtaş(?: inşaat)?(?: ın|ın)?|şirket(?:in|inizin|imizin)|firma(?:nın|nızın|mızın)) )+/,'')
  .replace(/ (?:kaç|ne|nedir|hangisi|söyle(?:r misin(?:iz)?|yebilir misin(?:iz)?)?|ver(?:ir misin(?:iz)?|ebilir misin(?:iz)?)?|istiyorum|alabilir miyim|lazım|lütfen)(?: lütfen)?$/,'');
 const office='(?:ofis(?:in|iniz(?:in)?|imiz(?:in)?)?|sabit)';
 const mobile='(?:whats ?app(?: ın|ın)?|cep|mobil)';
 const phone='(?:telefon(?:u|unu|unuz|unuzu|umuz|umuzu|lar|ları|larını|larınız|larınızı|larımız|larımızı)?|numara(?:sı|sını|nız|nızı|mız|mızı|lar|ları|larınız|larınızı|larını)?|hat(?:tı|tını|tınız)?)';
 const channel='(?:'+office+'|'+mobile+')';
 const line=new RegExp('^(?:'+channel+' |iletişim )*(?:'+phone+' )*'+phone+'$');
 const parts=request.split(/ (?:ve|ile) /);
 const bareChannel=new RegExp('^'+channel+'$');
 if(!parts.every(part=>line.test(part)||bareChannel.test(part)))return null;
 const asksOffice=new RegExp('(?:^| )'+office+'(?: |$)').test(request);
 const asksMobile=new RegExp('(?:^| )'+mobile+'(?: |$)').test(request);
 if(asksOffice&&!asksMobile)return yakutContact.landline;
 if(asksMobile&&!asksOffice)return yakutContact.mobile;
 return yakutContact.landline+' '+yakutContact.mobile;
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
function openYakutPage(path,narrate=false){
 const current=getYakutCurrentPage();
 yakutPageOfferPending=false;
 cancelYakutSpeech();
 if(current===path){if(narrate)yakutSpeakCurrentPage();queueListen(0);return true}
 try{
  sessionStorage.setItem('yakutVisited','1');
  if(narrate&&path!=='index.html')sessionStorage.setItem('yakutPageOffer','anlat:'+path);
  else sessionStorage.removeItem('yakutPageOffer');
 }catch(e){console.warn('YAKUT sayfa geçişi:',e)}
 location.assign(new URL(path,location.origin+'/').href);
 return true;
}
let yakutScenario = null;
const yakutAreaUnit = '(?:m²|m2|metre\\s*kare|metrekare)';
function yakutScenarioRequest(message) {
 const t = normalizeYakutCommand(message.replace(/â/gi, 'a'));
 if (/(?:^| )(?:aç|git|götür|sayfasına|sayfasını)(?: |$)/.test(t)) return false;
 return /(?:ön hesap|senaryo hesabı|arsa alanım|kaç daire|kaç konut|kaç dükk[aâ]n|taban oturumu|inşaat alanı|(?:arsa|daire|dükk[aâ]n).{0,35}hesap)/.test(t) ||
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
  '. Bu senaryolar varsayımsaldır. Ortak alanlar ve resmî imar koşulları sonucu değiştirebilir.';
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
 const weather=/hava durumu|hava (?:(?:şu an|şu anda|bugün|yarın) )?(?:nasıl|ne durumda|kaç derece)|hava soğuk|hava sıcak|yağmur (?:var mı|yağacak mı|yağar mı)|kar (?:var mı|yağacak mı|yağar mı)|şemsiye (?:alayım|gerek)/.test(command);
 const dayFollowup=/^(?:peki )?(?:yarın|bugün)(?: nasıl| ne olacak| nasıl olacak| peki)?$/.test(command);
 const rainFollowup=/^(?:peki )?(?:yarın |bugün )?(?:yağmur|kar) (?:var mı|yağacak mı|yağar mı)$/.test(command);
 const city=yakutWeatherCities.find(name=>{
  const word=name.toLocaleLowerCase('tr-TR');
  return new RegExp('(?:^| )'+word+'(?: ?(?:da|de|ta|te|nın|nin)| için)?(?: |$)').test(command);
 });
 const cityReply=city&&new RegExp('^(?:peki )?'+city.toLocaleLowerCase('tr-TR')+'(?: ?(?:da|de|ta|te)| için)?(?: (?:lütfen|bak|bugün|yarın))*$').test(command);
 if(!weather&&!(yakutWeatherPending&&cityReply)&&!(yakutWeatherCity&&dayFollowup))return null;
 const period=/\byarın\b/.test(command)?'tomorrow':/\bbugün\b/.test(command)?'today':yakutWeatherPending||'now';
 if(city)return {city,period};
 if(yakutWeatherCity&&(dayFollowup||rainFollowup))return {city:yakutWeatherCity,period};
 if(/(?:[a-zçğıöşü]+ (?:da|de|ta|te) (?:hava|yağmur|kar)|[a-zçğıöşü]+(?:da|de|ta|te) (?:hava|yağmur|kar))/.test(command))return {city:'',period};
 return {ask:true,period};
}
function rememberYakutTurn(question,answer){
 yakutChatHistory=[...yakutChatHistory,{role:'user',text:question.slice(0,420)},
  {role:'assistant',text:answer.slice(0,420)}].slice(-4);
 try{sessionStorage.setItem('yakutChatHistory',JSON.stringify(yakutChatHistory))}catch(_){}
}
let yakutChatController=null;
function beginYakutAudioPlayback(){
 yakutGestureClock=0;
 if(pendingSpeechGesture&&phase!=='walking'&&play(pendingSpeechGesture,true)){
  pendingSpeechGesture=null;phase='reacting';
 }
 yakutAudioPlaying=true;
}
let yakutSocialLast={};
function yakutSocialReply(command){
 const t=command.replace(/^yakut\s+/,'').replace(/\s+yakut$/,'').trim();
 const rules=[
 [/^(?:merhaba(?:lar)?|selam(?:lar)?)(?:\s+(?:yakut|merhaba|selam|hoş bulduk))*$/,['Merhaba, sizi dinliyorum.']],
 [/^(?:(?:çok|çok çok) )?(?:teşekkür(?:ler| ederim| ediyoruz)?|sağ ?ol(?:un)?|çok sağ ?ol(?:un)?|eyvallah)$/,['Rica ederim, ne demek.','Her zaman yardımcı olmaktan mutluluk duyarım.','Rica ederim, her zaman buradayım.']],
 [/^(?:nasılsın|nasılsınız|ne haber|naber)$/,['İyiyim, teşekkür ederim. Siz nasılsınız?']],
 [/^(?:günaydın|hayırlı sabahlar)$/,['Günaydın, güzel bir gün geçirmenizi dilerim.']],
 [/^(?:iyi akşamlar|hayırlı akşamlar)$/,['İyi akşamlar, hoş geldiniz.']],
 [/^(?:aferin(?: sana)?|bravo|harikasın|çok iyisin)$/,['Çok teşekkür ederim.','Teşekkür ederim, çok naziksiniz.']],
 [/^(?:beni duyuyor musun|sesimi duyuyor musun|beni dinliyor musun)$/,['Evet, sizi dinliyorum.']],
 [/^(?:bir dakika bekle|biraz bekle|bir saniye bekle)$/,['Tabii, bekliyorum.']],
 [/^(?:anlamadım|anlayamadım|daha anlaşılır anlat)$/,['Tabii, hangi kısmı daha anlaşılır anlatmamı istersiniz?']],
 [/^(?:görüşürüz|hoşça kal(?:ın)?|iyi geceler|kendine iyi bak)$/,['Görüşmek üzere, kendinize iyi bakın.']],
 [/^(?:yardım istemiyorum|bir şey istemiyorum|gerek yok)(?: teşekkürler)?$/,['Peki, ihtiyacınız olduğunda buradayım.']]
 ];
 for(let i=0;i<rules.length;i++){
  const [pattern,replies]=rules[i];if(!pattern.test(t))continue;
  const next=((yakutSocialLast[i]??-1)+1)%replies.length;
  yakutSocialLast[i]=next;return replies[next];
 }
 return '';
}
async function handle(message){
const q=String(message||'').trim();if(!q||!ready)return;
const command=normalizeYakutCommand(q);
if(isYakutStopCommand(command)){stopYakutAnswer();return}
// Browser speech recognition may resend the same phrase when restarted.
// Do not generate a second reply for a single utterance.
const now=Date.now();
if(command===lastUserUtterance &&
 (now-lastUserUtteranceAt<7000||now-yakutSpeechEndedAt<2500))return;
lastUserUtterance=command;lastUserUtteranceAt=now;
 yakutAddressPending=false;
 try{sessionStorage.removeItem('yakutAddressPending')}catch(_){}
const motionCommand=command.replace(/^yakut\s+/,'').replace(/\s+lütfen$/,'');
const motionMap={'dans et':'dance_01','alkışla':'clap','gül':'laugh_02','üzül':'frustrated_01','selam ver':'greet_01','el salla':'greet_02','eğil':'bow','veda et':'wave_goodbye_02','onayla':'agree','beklemede kal':'wait','tüm hareketleri göster':'YAKUT_Tam_Canli_Akis','yüz hareketlerini göster':'YAKUT_Yuz_Goz_Dudak'};
if(model&&/^(?:yürü|sağa yürü|sola yürü|ortaya gel)$/.test(motionCommand)){moveTo(motionCommand==='ortaya gel'?centerAnswerX():motionCommand==='sola yürü'?leftGreetingX():motionCommand==='sağa yürü'?yakutRightX():posX>centerAnswerX()?leftGreetingX():yakutRightX());return;}
if(model&&Object.hasOwn(motionMap,motionCommand)&&clips[motionMap[motionCommand]]){phase=motionMap[motionCommand]==='wait'?'idle':'reacting';play(motionMap[motionCommand],phase==='reacting');return;}
const spokenCommand=command.replace(/^(?:(?:merhaba|selam|hey|alo)\s+)?yakut(?:\s+|$)/,'').trim()||command;
const socialReply=yakutSocialReply(spokenCommand);
if(socialReply){
 if(/^(?:yardım istemiyorum|bir şey istemiyorum|gerek yok)/.test(spokenCommand)){
  yakutScenario=null;cancelYakutSpeech();yakutPageOfferPending=false;
 }
 react('agree',socialReply);return;
}
if(yakutIsAddressCommand(spokenCommand)){
 rememberYakutTurn(q,yakutContact.address);
 react('agree',yakutContact.address);return;
}
if(/^(?:yakut\s+)?(?:hayır|istemiyorum|bir şey istemiyorum|yardım istemiyorum|gerek yok|şimdilik gerek yok|sonra|şimdi değil)(?:\s+teşekkürler)?$/.test(command)){yakutScenario=null;cancelYakutSpeech();yakutPageOfferPending=false;return}
if(/^(?:yakut|yakut dinle)$/.test(command)) {react('agree','Dinliyorum, size nasıl yardımcı olabilirim?');return;}
if(isYakutHomeCommand(command)||isYakutHomeCommand(spokenCommand))return openYakutPage('index.html');
if(/(?:hangi sayfadayız|hangi sayfadasın|hangi sayfadayım|bu sayfanın adı|şu an neredeyiz)/.test(command)){
 react('agree',yakutPageIntro(getYakutCurrentPage()).trim());return;
}
if(yakutScenario?.waiting==='district'&&Object.hasOwn(yakutDistrictPages,command)){react('agree',yakutScenarioAnswer(q));return;}
if(yakutWantsCompanyInfo(command)){
 const about=yakutPageSpeech('kurumsal')||'Kumtaş İnşaat, inşaat, taahhüt ve kentsel dönüşüm alanlarında çalışmalar yürütmektedir.';
 react('agree',about.replace(/^Kurumsal sayfasındayız\.\s*/i,''),'center',true);return;
}
if(/başvuru (?:yapmak istiyorum|yapacağım|yapabilir miyim|yapmak isterim|yapmak için)|(?:ücretsiz )?keşif (?:al|istiyorum|talep etmek istiyorum)/.test(command))return openYakutPage('iletisim.html');
if(yakutWantsLocation(command)){yakutShareLocation();return;}

if(/telefon|numara|whats ?app|cep|mobil|sabit|iletişim bilgi/.test(command)){
  const generation=yakutVoiceGeneration;
  processingSpeech=true;
  queueListen(0);
  
  await refreshYakutContactPhones();
  if(generation!==yakutVoiceGeneration||hidden)return;
  processingSpeech=false;
 }
 const phoneAnswer=yakutPhoneAnswer(command);
if(phoneAnswer){
 rememberYakutTurn(q,phoneAnswer);react('agree',phoneAnswer,'center');return;
}
const destination=yakutPageCommand(command)||yakutPageCommand(spokenCommand);
if(destination){yakutScenario=null;return openYakutPage(destination);}
if(handleYakutOfferAnswer(command))return;
const localPage=yakutPageCommand(spokenCommand.replace(/(?: sayfası(?:nı)?)? (?:hakkında bilgi ver|hakkında bilgi|anlat|özetle)$/, ''));
const recording=localPage?.replace(/\.html$/,'');
if(recording&&yakutPageSpeech(recording)){
 react('agree',yakutPageSpeech(recording),'center',true);return;
}
const localContact=yakutContactRequest(command);
if(localContact){
 react('agree',localContact,'center');return;
}
if(/^(?:(?:yakut|lütfen) )*(?:bu )?sayfa(?:yı|daki bilgileri| hakkında)? (?:anlat|özetle|bilgi ver(?:ir misin|ebilir misin)?)(?: lütfen)?$/.test(command)){
 yakutPageOfferPending=false;yakutSpeakCurrentPage();return;
}
const weather=yakutWeatherRequest(command);
const webRequest=/(?:araştır|internet|kaynak|webde ara|güncel|bugün|yarın|son dakika|en son|maç|skor|kaç kaç|kim kazandı|kim yendi|fikstür|puan durumu|haber|döviz|dolar|euro|altın|ne yenir|nerede yenir|gezilecek)/.test(command);
const officialResearch=/(?:yasal|kanun|mevzuat|güncel destek|kira yardımı)/.test(command);
if(/^(?:riskli yapı nedir|riskli yapı hakkında bilgi ver|malik hakları nelerdir|malik hakları hakkında bilgi ver)$/.test(spokenCommand)){
 const key=spokenCommand.startsWith('riskli')?'riskli-yapi':'malik-haklari';
 const text=window.yakutSiteVoice?.[key];
 if(text){react('agree',text,'center');return;}
}
if(!weather&&!webRequest&&yakutScenarioRequest(q)){react('agree',yakutScenarioAnswer(q),'center');return}
if(yakutTurnInFlight)return;
yakutTurnInFlight=true;
processingSpeech=true;
 if(!weather){yakutWeatherPending='';yakutWeatherCity='';}
 if(weather?.ask){
  yakutWeatherPending=weather.period;
  const reply='Hangi şehir için hava durumuna bakayım?';
  rememberYakutTurn(q,reply);
  processingSpeech=false;yakutTurnInFlight=false;react('agree',reply,'center');return;
 }
 if(weather){yakutWeatherPending='';yakutWeatherCity=weather.city;}
 let answer='Şu anda yanıt alamadım. Lütfen tekrar sorun.';
 const generation=yakutVoiceGeneration;
 const url=new URL(yakutChatEndpoint());
 const research=Boolean(weather||webRequest||officialResearch);
 const contact=yakutContactRequest(q);
 const reference=('Açık sayfa: '+yakutPageName(getYakutCurrentPage())+'. '+(contact?contact+' ':'')+yakutPageSpeech(getYakutCurrentPage().replace(/\.html$/,''))).slice(0,1500);
 const payload={question:q.slice(0,500),reference,history:yakutChatHistory};
 const controller=new AbortController();
 yakutChatController=controller;
 queueListen(100);
  try{
  const ask=async search=>{
   const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...payload,research:search,weather:weather?.city?weather:undefined}),
    signal:AbortSignal.any([controller.signal,AbortSignal.timeout(search?45000:25000)])});
   let result=null;
   try{result=await response.json()}catch(_){}
   if(response.ok)return result;
   const reason=typeof result?.answer==='string'&&result.answer.trim()
    ?result.answer.trim():(response.status===429?'Yakut yoğun kullanım nedeniyle kısa süre bekliyor. Lütfen yeniden deneyin.':
    response.status===403?'Yakut bağlantısı site yetkilendirmesi nedeniyle reddedildi.':
    response.status===503?'Gemini veya internet araması geçici olarak yanıt vermiyor.':
    'Yakut sunucusu HTTP '+response.status+' hatası verdi.');
   return {answer:reason,serverError:true};
  };
  // Outside-site questions use Gemini chat, with research through the three configured providers.
  let result=await ask(research);
  const needsSearch=research||result?.answer?.trim()==='WEB_ARAMASI_GEREKLI';
  if(!research&&needsSearch)result=await ask(true);
  if(generation!==yakutVoiceGeneration||hidden)return;
  if(typeof result?.answer==='string'&&result.answer.trim()&&result.answer.trim()!=='WEB_ARAMASI_GEREKLI'){
   answer=result.answer.trim().replace(/\*\*/g,'');
   rememberYakutTurn(q,answer);
  }else if(needsSearch)answer='Güncel bilgiye şu anda ulaşamadım. Lütfen tekrar sorun.';
 }catch(error){
  if(!controller.signal.aborted){
   console.warn('Yakut sohbet isteği:',error);
   answer=error?.name==='TimeoutError'?'Gemini yanıtı zaman aşımına uğradı. Lütfen yeniden deneyin.':
    'Yakut sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.';
  }
 }finally{
  if(yakutChatController===controller)yakutChatController=null;
  yakutTurnInFlight=false;
 }
 if(generation!==yakutVoiceGeneration||hidden)return;
 processingSpeech=false;
react('agree',answer,'center');
}
function queueListen(delay=50){
 clearTimeout(listenRetry);
 if(!ready||!listenEnabled||hidden||recognition)return;
 const ms=Math.max(delay,micRestartAt-Date.now(),0);
 listenRetry=setTimeout(startSpeech,ms);
}
function releaseYakutMic(){
 clearTimeout(micStartTimer);
 const rec=recognition;
 recognition=null;micStarting=false;
 try{rec?.abort()}catch(_){}
}
function stopListening(){
 listenEnabled=false;clearTimeout(listenRetry);releaseYakutMic();
 talk.hidden=false;
 talk.textContent='🎤 Mikrofonu Aç';
}
function speechProblem(err){
 if(!listenEnabled||hidden)return;
 if(err==='not-allowed'||err==='service-not-allowed'){
  stopListening();talk.hidden=false;talk.textContent='🎤 Mikrofon İzni';return;
 }
 if(err==='audio-capture'){
  stopListening();talk.hidden=false;talk.textContent='🎤 Mikrofonu Aç';return;
 }
 if(err==='aborted')return;
  if(err==='no-speech'){
   emptyRecognitionCount++;
   micRestartAt=Date.now()+Math.min(850,180*emptyRecognitionCount);
   return;
  }
 micFailureCount++;
 if(err==='network'){
    if(micFailureCount>=4){stopListening();talk.textContent='🎤 Tekrar dene';return;}
    micRestartAt=Date.now()+Math.min(15000,1500*micFailureCount);
 }else if(err==='language-not-supported'||err==='language-unavailable'){
  stopListening();return;
 }else{
  if(micFailureCount>=5){stopListening();talk.textContent='🎤 Mikrofonu Aç';return;}
  micRestartAt=Date.now()+Math.min(5000,1000*micFailureCount);
 }
}
function startSpeech(){
 if(!ready||!listenEnabled||hidden||recognition||document.hidden)return;
 const API=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!API){stopListening();talk.hidden=false;talk.textContent='🎤 Tarayıcı Mikrofonu';return}
 const rec=new API();recognition=rec;micStarting=true;
 rec.lang='tr-TR';rec.interimResults=true;rec.continuous=true;rec.maxAlternatives=1;
 rec.onstart=()=>{if(recognition!==rec)return;clearTimeout(micStartTimer);micStarting=false;if(!speaking&&!processingSpeech)talk.textContent='🟢 Dinliyorum'};
 let finalText='';
 let interimText='';
 let hasInterim=false;
 let ignoredResults=0;
 let acceptedInput=false;
 let utteranceEnded=false;
 let timer;
 const submit=()=>{
  clearTimeout(timer);
  // Web Speech may finalize only part of a sentence; keep the interim tail.
  const candidate=[finalText,interimText].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
  finalText='';
  interimText='';
  hasInterim=false;
  if(recognition!==rec||!candidate||!listenEnabled||hidden)return false;
  if(!isYakutOwnVoice(candidate)&&navigateFromRecognition(candidate))return true;
  if(speaking||processingSpeech)return false;
  if(Date.now()-yakutSpeechEndedAt<3500&&isYakutOwnVoice(candidate))return false;
  acceptedInput=true;
  releaseYakutMic();
  Promise.resolve(handle(candidate)).catch(error=>{
   console.warn('Yakut komut hatası:',error);
   processingSpeech=false;
  }).finally(()=>{
   if(!speaking&&!processingSpeech)queueListen(0);
  });
  return true;
 };
 const waitForSentenceEnd=()=>{
  clearTimeout(timer);
  if(utteranceEnded&&(finalText||interimText))timer=setTimeout(submit,10);
  else if(finalText&&!hasInterim)timer=setTimeout(submit,10);
 };
 rec.onspeechstart=()=>{utteranceEnded=false;clearTimeout(timer);};
 rec.onspeechend=()=>{utteranceEnded=true;waitForSentenceEnd();};
 rec.onresult=e=>{
  if(recognition!==rec||!listenEnabled||hidden)return;
  micFailureCount=0;emptyRecognitionCount=0;
  clearTimeout(timer);
  const results=Array.from(e.results);
  if(speaking||processingSpeech){
   finalText='';interimText='';hasInterim=false;
   // Accept real interruptions while speaking; ignore text recognized from
   // Yakut's own Aoede speaker output to avoid a voice feedback loop.
   for(const result of results.slice(e.resultIndex)){
    const raw=result[0]?.transcript||'';
    const heard=normalizeYakutCommand(raw);
    if(isYakutStopCommand(heard)||(/(?:^|\s)(?:sus|dur)(?:\s|$)/.test(heard)&&!isYakutOwnVoice(raw))){
     releaseYakutMic();stopYakutAnswer();queueListen(100);return;
    }
    if(!result.isFinal||!heard||isYakutOwnVoice(raw))continue;
    if(navigateFromRecognition(raw))return;
   }
   ignoredResults=results.filter(result=>result.isFinal).length;
   return;
  }
  const freshResults=results.slice(Math.max(e.resultIndex,ignoredResults));
  const latestFinal=freshResults.filter(result=>result.isFinal)
   .map(result=>result[0]?.transcript||'').join(' ').trim();
  if(latestFinal&&navigateFromRecognition(latestFinal))return;
  finalText=results.slice(ignoredResults).filter(result=>result.isFinal)
   .map(result=>result[0].transcript.trim()).join(' ').trim();
  interimText=results.slice(ignoredResults).filter(result=>!result.isFinal)
   .map(result=>result[0].transcript.trim()).join(' ').trim();
  hasInterim=Boolean(interimText);
  // Some browsers end recognition with only an interim result.
  // Preserve the heard question instead of silently discarding it.
  waitForSentenceEnd();
 };
 rec.onerror=e=>{if(recognition!==rec)return;clearTimeout(timer);releaseYakutMic();micLastError=e.error||'unknown';if((speaking||processingSpeech)&&micLastError==='no-speech'){micRestartAt=0;queueListen(0);return;}speechProblem(micLastError);if(listenEnabled&&!hidden)queueListen(180)};
 rec.onend=()=>{
  if(recognition!==rec)return;
  clearTimeout(timer);
  if((finalText.trim()||interimText.trim())&&submit())return;
  if(recognition===rec){clearTimeout(micStartTimer);micStarting=false;recognition=null}
  if(listenEnabled&&!hidden){
    if(speaking||processingSpeech){micRestartAt=0;queueListen(0);return;}
    if(!acceptedInput){
     emptyRecognitionCount++;
     micRestartAt=Date.now()+Math.min(850,180*emptyRecognitionCount);
    }
    talk.textContent='🎤 Yeniden dinliyorum';queueListen(180);
   }
  else if(!listenEnabled)talk.textContent='🎤 YAKUT';
 };
 micStartTimer=setTimeout(()=>{
  if(recognition!==rec||!micStarting)return;
  releaseYakutMic();speechProblem('start-failed');queueListen(150);
 },4500);
 try{rec.start()}catch(e){
  clearTimeout(micStartTimer);
  micStarting=false;if(recognition===rec)recognition=null;
  speechProblem('start-failed');if(listenEnabled)queueListen(500);
 }
}
talk.onclick=()=>{
 rememberYakutActivation();
 // A real click is required by some browsers to unlock Web Audio playback.
 listenEnabled=true;micFailureCount=0;emptyRecognitionCount=0;micRestartAt=0;
 startSpeech();
 resumeYakutSound();
};
close.onclick=()=>{
hidden=!hidden;stage.style.display=hidden?'none':'block';
if(hidden){stopListening();cancelYakutSpeech()}
close.textContent=hidden?'Göster':'✕';talk.style.display=hidden?'none':'';if(!hidden){positionStage();resumeYakutSound()}
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

function startYakutSession(){
 if(ready)return;
 clearTimeout(yakutStartTimer);
 ready=true;
 refreshYakutContactPhones();
 listenEnabled=true;
 yakutPageOfferPending=false;
 try{
  if(!yakutFreshReload&&sessionStorage.getItem('yakutGreeted')==='1'){
   openingSpoken=true;openingGreeted=true;yakutFirstGreetingDone=true;
  }
  const page=getYakutCurrentPage();
  yakutAddressPending=page==='iletisim.html'&&sessionStorage.getItem('yakutAddressPending')==='1';
  sessionStorage.removeItem('yakutAddressPending');
  const pageOffer=sessionStorage.getItem('yakutPageOffer');
  sessionStorage.removeItem('yakutPageOffer');
  yakutPendingPageSpeech=pageOffer==='anlat:'+page;
  yakutPageOfferPending=yakutPendingPageSpeech;
 }catch(e){}
 // Start Aoede as early as the browser allows, without pausing recognition.
 resumeYakutSound();
 if(audioUnlocked||restoreYakutActivation())queueListen(0);
}
window.addEventListener('pagehide',()=>{
 stopListening();
 cancelYakutSpeech();
 audioUnlocked=false;
});
window.addEventListener('pageshow',event=>{
 if(!event.persisted)return;
 listenEnabled=true;
 if(yakutGreetingInProgress){
  yakutGreetingInProgress=false;yakutOpeningBow=false;moveTo(yakutRightX());
 }
 resumeYakutSound();
 queueListen(120);
});
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
const modelData=await yakutModelData;
if(modelData instanceof Error)throw modelData;
const gltf=await new GLTFLoader().parseAsync(modelData,new URL('.',url).href);model=gltf.scene;
const bbox=new THREE.Box3().setFromObject(model);
addYakutChestLogo();
const size=bbox.getSize(new THREE.Vector3()),center=bbox.getCenter(new THREE.Vector3());
normalScale=1.55/Math.max(size.y,0.01);
model.scale.setScalar(normalScale);model.position.set(-center.x*normalScale,-center.y*normalScale,-center.z*normalScale);
basePosition=model.position.clone();
model.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false;
 if(o.morphTargetDictionary&&!face&&Object.keys(o.morphTargetDictionary).some(n=>/jawOpen|viseme|blink/i.test(n)))face=o;
});
scene.add(model);mixer=new THREE.AnimationMixer(model);
gltf.animations.forEach(c=>clips[c.name]=mixer.clipAction(c));
mixer.addEventListener('finished',event=>{if(event.action!==current)return;if(yakutOpeningBow){completeYakutOpening();return}if(phase==='reacting'||phase==='greeting'){phase='idle';play('wait');walkTimer=0}});
let greetedBefore=false;
try{greetedBefore=sessionStorage.getItem('yakutGreeted')==='1'}catch(_){}
// Every full load starts from the same left-hand position, including refresh.
// Walk to the center/right only after the initial greeting when requested.
posX=leftGreetingX();
targetX=posX;model.rotation.y=0;phase='idle';play('wait');
positionStage();
startYakutSession();
if(audioUnlocked)queueListen(0);
const clock=new THREE.Clock();
let lastCanvasWidth=0,lastCanvasHeight=0;
let blinkTime=0,blinkAt=2.5,blinkPhase=0;
const speakingArms=[];
model.traverse(bone=>{
 if(bone.isBone&&/(?:Left|Right)(?:ForeArm|Hand)$/.test(bone.name))
  speakingArms.push({bone,pose:bone.quaternion.clone(),side:bone.name.includes('Left')?1:-1});
});
const gestureAxis=new THREE.Vector3(0,0,1),gestureTurn=new THREE.Quaternion();
let gestureTime=0,gestureLevel=0;
function frame(){
if(!stage.isConnected)return;requestAnimationFrame(frame);
const dt=Math.min(clock.getDelta(),.06),rect=stage.getBoundingClientRect();
const canvasW=Math.max(Math.round(rect.width),1),canvasH=Math.max(Math.round(rect.height),1);
if(canvasW!==lastCanvasWidth||canvasH!==lastCanvasHeight){
 lastCanvasWidth=canvasW;lastCanvasHeight=canvasH;
 renderer.setSize(canvasW,canvasH,false);
 camera.aspect=canvasW/canvasH;camera.updateProjectionMatrix();
}
if(!hidden){
mixer.update(dt);
gestureTime+=dt;
gestureLevel=0;
for(const {bone,pose,side} of speakingArms){
 pose.copy(bone.quaternion);
 const angle=side*gestureLevel*.11*Math.sin(gestureTime*3+side);
 bone.quaternion.multiply(gestureTurn.setFromAxisAngle(gestureAxis,angle));
}
// Keep the authored wait pose during speech; opening greeting remains explicit.
if(phase==='walking'){
const step=(innerWidth<650?65:105)*dt;
if(Math.abs(targetX-posX)<=step){posX=targetX;phase='idle';model.rotation.y=0;play('wait');walkTimer=0;
 if(pendingSpeechGesture&&yakutAudioPlaying){const gesture=pendingSpeechGesture;pendingSpeechGesture=null;play(gesture,true);phase='reacting'}
 if(yakutIsGreetingWalking)finishYakutGreetingWalk();
}else{posX+=Math.sign(targetX-posX)*step;}
positionStage();
}else if(phase==='idle'&&!reduced){
walkTimer+=dt;
if(walkTimer>=22&&!speaking&&!processingSpeech&&(getYakutCurrentPage()!=='index.html'||yakutGreetingRequested)){
 walkTimer=0;
 moveTo(posX>centerAnswerX()?leftGreetingX():yakutRightX());
}
}
if(face&&current!==clips.YAKUT_Yuz_Goz_Dudak&&current!==clips.YAKUT_Tam_Canli_Akis){
blinkTime+=dt;
if(blinkTime>=blinkAt){blinkTime=0;blinkAt=2.6+Math.random()*3.9;blinkPhase=.17;}
const blink=blinkPhase>0?Math.sin(Math.PI*(1-Math.max(0,blinkPhase)/.17)):0;
blinkPhase=Math.max(0,blinkPhase-dt);
let amp=yakutAudioPlaying?.35:0;
if(yakutAudioPlaying&&yakutVoice)amp=yakutVoice.getLevel();
for(const [name,i] of Object.entries(face.morphTargetDictionary)){
const isMouth=/jawOpen|viseme_/i.test(name);
const isBlink=/eyeBlink|blinkLeft|blinkRight|eyesClosed|blink/i.test(name);
if(!isMouth&&!isBlink)continue; // Keep authored facial expressions intact.
const vowel=['A','O','U','E','MBP'][Math.floor(gestureTime*9)%5];
 const influence=isBlink?blink:/jawOpen/i.test(name)?amp*.65:name.toUpperCase()===('VISEME_'+vowel)?amp*.48:0;
face.morphTargetInfluences[i]=THREE.MathUtils.damp(face.morphTargetInfluences[i],influence,48,dt)}
}
}
renderer.render(scene,camera);
if(!characterRendered&&!hidden){
 characterRendered=true;
 requestAnimationFrame(()=>{if(audioUnlocked)onYakutSoundReady();});
}
if(!hidden)for(const {bone,pose} of speakingArms)bone.quaternion.copy(pose);
}frame();
}catch(err){
console.error('YAKUT V9 modeli yüklenemedi:',err);stage.remove();
model=null;
if(yakutIsGreetingWalking)finishYakutGreetingWalk();
else if(yakutOpeningBow)completeYakutOpening();
startYakutSession();
}}
yakutStartTimer=setTimeout(startYakutSession,0);
init();
})();
