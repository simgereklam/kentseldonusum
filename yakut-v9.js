(() => {
'use strict';
if(location.protocol==='http:'&&/^(?:www\.)?xn--kentseldnm-lcb7ea99k\.com\.tr$/i.test(location.hostname)){
 const secureUrl=new URL(location.href);
 secureUrl.protocol='https:';
 location.replace(secureUrl.href);
 return;
}
if(window.__yakutV9)return;window.__yakutV9=true;
const url=new URL('YAKUT_V9.glb',document.currentScript.src).href;
const chestLogoUrl=new URL('yakut-mavi-amblem.jpg',url).href;
const welcome='Merhaba, hoş geldiniz. Ben KUMTAŞ İnşaat dijital asistanınız YAKUT. Sizin için ne yapabilirim?';
const css=document.createElement('style');
css.textContent=`
#yakut-v9{position:fixed;left:0;bottom:52px;width:clamp(255px,28vw,370px);height:min(73dvh,clamp(380px,53vw,580px));z-index:110;pointer-events:none;will-change:transform;filter:drop-shadow(0 6px 12px #001c3273)}
#yakut-v9 canvas{display:block;width:100%;height:100%}
#yakut-map-link{position:fixed;right:14px;bottom:74px;z-index:135;background:#09638c;color:white;padding:10px 14px;border-radius:20px;font:700 14px Arial,sans-serif;text-decoration:none}
#yakut-map-link[hidden]{display:none}
#yakut-v9-ui{display:none!important}
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
ui.innerHTML='<button id="yakut-talk" type="button" aria-label="Mikrofon izni ver" hidden>🎤 İzin Ver</button><button id="yakut-close" type="button" aria-label="YAKUT’u gizle">✕</button>';
document.body.append(stage,ui);
const talk=ui.querySelector('#yakut-talk'),close=ui.querySelector('#yakut-close');
let THREE,model,mixer,face,clips={},current=null,ready=false,hidden=false,speaking=false,recognition=null,listenEnabled=true,micStarting=false,listenRetry=null;
let openingGreeted=false,openingSpoken=false;
let micFailureCount=0,micLastError='',micRestartAt=0;
let processingSpeech=false;
let micStartTimer;
let micStopOnly=false;
let yakutFirstGreetingDone=false,yakutPageOfferPending=false,yakutOfferSpoken=false,yakutIsGreetingWalking=false,yakutPendingPageSpeech=false;
let yakutGreetingInProgress=false,yakutGreetingEndAt=0;
let yakutCurrentPrompt='',yakutLastOfferAt=0,yakutLastInputAt=0,yakutOpeningBow=false,yakutSpeechEndedAt=0;
let phase='loading',posX=-280,targetX=0,walkTimer=0,phaseTime=0,turnRight=true,dialogTimer=0,normalScale=1,basePosition=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function show(text,ms=7000){}
function play(name,once=false,speed=1){if(!THREE||!clips[name])return false;
const next=clips[name];if(current&&current!==next)current.fadeOut(.22);
next.reset().setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity).setEffectiveTimeScale(speed).setEffectiveWeight(1).fadeIn(.22).play();
next.clampWhenFinished=!!once;current=next;return true;
}
let audioUnlocked=false,yakutTtsContext=null,yakutAnalyser=null,yakutAnalyserData=null,yakutAudioPlaying=false,yakutVoiceGeneration=0,yakutGestureClock=0;
function getYakutAudioDest(){
 if(!yakutTtsContext)return null;
 if(!yakutAnalyser){
  yakutAnalyser=yakutTtsContext.createAnalyser();
  yakutAnalyser.fftSize=256;
  yakutAnalyserData=new Uint8Array(yakutAnalyser.frequencyBinCount);
  yakutAnalyser.connect(yakutTtsContext.destination);
 }
 return yakutAnalyser;
}
let yakutDeferredSpeech=null;
let yakutVoiceRetryAt=0;
let yakutStartTimer;
function resumeYakutSound(){
 if(!yakutTtsContext){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(Audio){try{yakutTtsContext=new Audio()}catch(_){}}
 }
 if(!yakutTtsContext){
  audioUnlocked=true;
  listenEnabled=true;
  if(!speaking&&!processingSpeech&&!yakutIsGreetingWalking&&!yakutGreetingInProgress)beginYakutVisit();
  queueListen(50);
  return;
 }
 if(yakutTtsContext.state==='running')onYakutSoundReady();
 else yakutTtsContext.resume().then(onYakutSoundReady).catch(()=>{
  audioUnlocked=true;
  listenEnabled=true;
  queueListen(50);
 });
}
function onYakutSoundReady(){
 if(!ready||hidden)return;
 audioUnlocked=true;
 listenEnabled=true;
 if(yakutDeferredSpeech){
  const answer=yakutDeferredSpeech;
  yakutDeferredSpeech=null;
  speaking=false;
  yakutIsGreetingWalking=false;
  speak(...answer);
  return;
 }
 if(speaking||processingSpeech||yakutIsGreetingWalking)return;
 if(!yakutGreetingInProgress)beginYakutVisit();
 else queueListen(50);
}
function beginYakutVisit(){
 if(!ready||hidden)return;
 if(getYakutCurrentPage()==='yakut-eimar.html'){
  let question;
  try{
   question=sessionStorage.getItem('yakutImarQuestion');
   sessionStorage.removeItem('yakutImarQuestion');
  }catch(_){}
  if(question){yakutPageOfferPending=false;handle(question);return}
 }
 if(getYakutCurrentPage()==='kentsel-donusum.html'&&audioUnlocked){
  try{if(sessionStorage.getItem('yakutExplainMalik')==='1'){yakutExplainMalik();return}}catch(_){}
 }
 let alreadyGreeted=false;
 try{alreadyGreeted=sessionStorage.getItem('yakutGreeted')==='1'}catch(_){}
 if(getYakutCurrentPage()==='index.html' && !yakutFirstGreetingDone && !alreadyGreeted){
  yakutFirstGreetingDone=true;openingSpoken=true;openingGreeted=true;
  try{sessionStorage.setItem('yakutGreeted','1');sessionStorage.setItem('yakutVisited','1')}catch(_){}
  yakutIsGreetingWalking=true;
  if(phase==='walking')return;
  moveTo(centerAnswerX());
  if(phase!=='walking')finishYakutGreetingWalk();
  return;
 }
 if(yakutPageOfferPending&&audioUnlocked&&!yakutOfferSpoken){offerYakutPage();return}
 if(!speaking&&!processingSpeech)queueListen(50);
}
function handleYakutActivation(event){
 if(!event.isTrusted||navigator.userActivation?.isActive===false||hidden)return;
 micFailureCount=0;micRestartAt=0;
 listenEnabled=true;
 resumeYakutSound();
}
document.addEventListener('click',handleYakutActivation,true);
document.addEventListener('keydown',handleYakutActivation,true);
function finishYakutSpeech(){
 yakutAudioPlaying=false;
 speaking=false;processingSpeech=false;yakutSpeechEndedAt=Date.now();
 if(yakutGreetingInProgress){
  yakutGreetingInProgress=false;yakutGreetingEndAt=Date.now();
  moveTo(yakutRightX());
 }
 if(yakutPageOfferPending && !yakutOfferSpoken && !yakutIsGreetingWalking)offerYakutPage();
 if(listenEnabled&&!hidden)queueListen(50);
}
async function speak(text,_recordings=[],deferPlayback=true,isHoldNotice=false){
 const prompt=prepareYakutSpokenText(String(text||'').trim());
 if(!prompt){speaking=false;processingSpeech=false;queueListen(50);return}
 if(!isHoldNotice)stopYakutAudioOutput();
 yakutCurrentPrompt=prompt;
 speaking=true;
 yakutAudioPlaying=false;
 const turn=++yakutVoiceGeneration;
 const endpoint=yakutChatEndpoint();
 let audioReady=false;
 try{
  audioReady=await ensureYakutAudio();
  if(!audioReady&&deferPlayback&&!hidden){
   speaking=false;
   yakutDeferredSpeech=[prompt,[],deferPlayback,isHoldNotice];
   queueListen(50);
   return;
  }
  if(turn!==yakutVoiceGeneration||hidden)return;
  queueListen(0);
  if(navigator.onLine!==false){
   const sentences=prompt.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(s=>s.trim()).filter(Boolean)||[prompt];
   for(const sentence of sentences){
    if(turn!==yakutVoiceGeneration||hidden)break;
    yakutAudioPlaying=false;
    let ok=await askYakutLive(endpoint,{readAloud:sentence},turn);
    if(!ok&&turn===yakutVoiceGeneration&&!hidden){
     if(!isHoldNotice&&sentence!=='Biraz bekleteceğim.'){
      await askYakutLive(endpoint,{readAloud:'Biraz bekleteceğim.'},turn);
     }
     await new Promise(resolve=>setTimeout(resolve,350));
     if(turn===yakutVoiceGeneration&&!hidden){
      ok=await askYakutLive(endpoint,{readAloud:sentence},turn);
     }
    }
    yakutAudioPlaying=false;
    if(!ok)break;
   }
  }
 }catch(error){
  console.warn('Yakut ses isteği:',error);
 }finally{
  if(turn===yakutVoiceGeneration){
   finishYakutSpeech();
  }
 }
}
function yakutChatEndpoint(){
 const endpoint=document.querySelector('meta[name="yakut-chat-endpoint"]')?.content;
 return endpoint||window.yakutChatServiceUrl||'https://kumtas-yakut-chat.simgereklam.workers.dev/chat';
}
async function ensureYakutAudio(){
 if(!audioUnlocked)return false;
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio)return true;
 yakutTtsContext??=new Audio();
 if(yakutTtsContext.state!=='running'){
  await Promise.race([yakutTtsContext.resume().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,800))]);
 }
 return yakutTtsContext.state==='running';
}
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
function moveTo(x){if(!model)return;targetX=Math.max(0,Math.min(x,innerWidth-stage.offsetWidth));if(!reduced&&Math.abs(targetX-posX)>12){phase='walking';turnRight=targetX>posX;model.rotation.y=turnRight?Math.PI/2:-Math.PI/2;const gait=Object.keys(clips).find(n=>/^(walk|walk_\d+|walking)$/i.test(n))||Object.keys(clips).find(n=>/walk|yürü/i.test(n));if(gait)play(gait,false,1.12);else{targetX=posX;phase='idle';play('wait')}}else{posX=targetX;positionStage();phase='idle';play('wait')}}
let pendingSpeechGesture=null;
function findYakutGesture(preferred){
 if(preferred==='bow')return Object.keys(clips).find(n=>/^(to[ _-]?bow|bow|bow_\d+|bowing|respect|selam_eğil)$/i.test(n))||Object.keys(clips).find(n=>/bow|eğil|saygı/i.test(n))||null;
 return clips[preferred]?preferred:(clips.agree?'agree':'wait');
}
function react(clip,text,placement='left',recordings=[]){
 if(!ready)return;
 if(model&&phase!=='walking')model.rotation.y=0;
 phaseTime=0;
 pendingSpeechGesture=findYakutGesture(clip);
 speak(text,recordings);
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
 'yakut-eimar.html':['E-İmar ve Ön Proje','e imar','eimar','imar hesaplama','imar durumu','imar sorgulama','ön proje','ada parsel'],
 ...Object.fromEntries(Object.entries(yakutDistrictPages).map(([name,slug])=>[
  slug+'-kentsel-donusum.html',[name+' Kentsel Dönüşüm',name]
 ]))
};
function yakutPageName(path){
 return yakutPages[path]?.[0]||document.querySelector('h1')?.textContent.trim()||'açık';
}
function yakutPageCommand(command){
 const words=command
  .replace(/^(?:(?:yakut|asistan|lütfen|hadi|hemen|beni|bizi|aç|göster) )+/,'')
  .replace(/(?: (?:lütfen|aç(?:ar mısın(?:ız)?)?|git|geç|götür|göster|dön|yönlendir|girmek istiyorum))+$/,'');
 const withoutPage=words.replace(/ sayfa(?:sı(?:na|nı)?|ya|yı)?$/,'');
 return Object.entries(yakutPages).find(([path,names])=>names.some(name=>{
  const label=normalizeYakutCommand(name);
  return words===label||withoutPage===label||['a','e','ya','ye','ı','i','u','ü','yı','yi','yu','yü'].some(suffix=>words===label+suffix||words===label+' '+suffix);
 }))?.[0]||null;
}
function normalizeYakutCommand(message){
 return String(message||'').toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü0-9\s]/gi,' ').replace(/\s+/g,' ').trim();
}
function isYakutStopCommand(command){
 return /(?:^| )(?:dur|durun|sus|susun|konuşma|kes|yeter|tamam|bekle|bi saniye|bir saniye|kapat)(?: |$)/.test(command) && command.split(' ').length <= 5;
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
 return /^(?:hakkımızda|şirket bilgileri(?:ni)?|firma bilgileri(?:ni)?|(?:şirket|firma)(?:imiz|iniz) hakkında bilgi)(?: (?:ver|anlat|istiyorum|verir misin|verebilir misin|almak istiyorum|lütfen))*$/.test(topic);
}
function stopYakutAudioOutput(){
 yakutLiveController?.abort();
 for(const source of yakutLiveSources){try{source.stop()}catch(_){}}
 yakutLiveSources.clear();
}
function cancelYakutSpeech(){
 stopYakutAudioOutput();
 yakutChatController?.abort();
 ++yakutVoiceGeneration;yakutAudioPlaying=false;yakutDeferredSpeech=null;
 pendingSpeechGesture=null;speaking=false;processingSpeech=false;
}
function stopYakutAnswer(){
 if(!speaking&&!processingSpeech){
  yakutScenario=null;yakutParcelStep='';yakutWeatherPending='';
 }
 yakutPageOfferPending=false;
 cancelYakutSpeech();
 window.yakutImar?.cancelLookup();
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
 const offer=page==='yakut-eimar.html'
  ? 'E-İmar ve Ön Proje sayfasındayız. Resmî kaynak için parsel sorgula, varsayımlı alan hesabı için ön hesap yap diyebilirsiniz.'
  : yakutPageIntro(page)+'Bu sayfa hakkında bilgi ister misiniz?';
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
 handle('Şu an bulunduğumuz ' + yakutPageName(getYakutCurrentPage()) + ' sayfasındaki bilgileri bana akıcı ve doğal şekilde özetleyip anlat.');
}
const yakutPhoneNumbers={office:'02129555599',whatsapp:'05431813485'};
const yakutSpokenDigits=['sıfır','bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz'];
function speakYakutPhone(number){
 return [number.slice(0,1),number.slice(1,4),number.slice(4,7),number.slice(7,9),number.slice(9)]
  .map(group=>Array.from(group,digit=>yakutSpokenDigits[Number(digit)]).join(', '))
  .join('. ');
}
function prepareYakutSpokenText(text){
 for(const number of Object.values(yakutPhoneNumbers)){
  const separator='[ .()\\-]*';
  const digits=number.slice(1).split('').join(separator);
  const phone=new RegExp('(?<!\\d)(?:(?:\\+?9)?0'+separator+')?'+digits+'(?!\\d)','g');
  text=text.replace(phone,()=>speakYakutPhone(number));
 }
 return text;
}
const yakutContact={
 address:'Kocasinan Merkez Mahallesi, Mahmutbey Caddesi, bina numarası iki yüz kırk beş, A harfi, Bahçelievler, İstanbul.',
 landline:'Ofis sabit telefon numaramız. '+yakutPhoneNumbers.office+'.',
 mobile:'WhatsApp cep telefonu numaramız. '+yakutPhoneNumbers.whatsapp+'.',
 email:'E-posta adresimiz: info, et işareti, kumtas, nokta, com, nokta, tr.'
};
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
 const phone='(?:telefon(?:u|unu|unuz|unuzu|umuz|umuzu)?|numara(?:sı|sını|nız|nızı|mız|mızı|larınız|larını)?|hat(?:tı|tını|tınız)?)';
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
 cancelYakutSpeech();
 if(current===path){yakutPendingPageSpeech=narrate;prepareYakutPageOffer();queueListen(250);return true}
 try{
  sessionStorage.setItem('yakutVisited','1');
  if(path!=='index.html')sessionStorage.setItem('yakutPageOffer',narrate?'anlat:'+path:path);
  else sessionStorage.removeItem('yakutPageOffer');
 }catch(e){console.warn('YAKUT sayfa geçişi:',e)}
 location.assign(new URL(path,location.origin+'/').href);
 return true;
}
let yakutParcelStep='';
function handleYakutParcel(command){
 const onPage=getYakutCurrentPage()==='yakut-eimar.html';
 const imar=window.yakutImar;
 if(!onPage||!imar)return false;
 const say=text=>{react('agree',text);return true};
 const lookup=()=>{
  if(imar.canLookUp())say('Belediyenin imar verilerine bakıyorum.');
  imar.lookup();
  return true;
 };
 if(/(?:resmi|resmî|belediye) (?:sorgu(?:yu)?|e imar)(?: sayfasını)? aç/.test(command)){
  const source=document.getElementById('source');
  source?.focus();source?.scrollIntoView({block:'center'});
  return say('Resmî e-İmar sayfasını aç düğmesine dokunun. Açılan sayfada ada parsel sorgusunu seçip mahalle, ada ve parseli girin.');
 }
 if(/(?:^| )(?:imar sorgusu(?:na başla)?|imar sorgula|parsel sorgula|ada parsel sorgula|ada parsel sorgusu|imar durumunu sorgula)(?: |$)/.test(command)||
    /imar/.test(command)&&/(?:^| )ada(?: |$)/.test(command)&&/(?:^| )parsel(?: |$)/.test(command)){
  const district=Object.keys(yakutDistrictPages).find(name=>command.includes(name));
  let neighborhood=command.match(/(?:^| )([a-zçğıöşü0-9]+(?: [a-zçğıöşü0-9]+)?) mahallesi(?: |$)/)?.[1];
  if(neighborhood&&district)neighborhood=neighborhood.replace(district+' ','');
  const identifiers=command.match(/(?:^| )ada (\d{1,9}) parsel (\d{1,9})(?: |$)/)||
   command.match(/(?:^| )(\d{1,9}) ada (\d{1,9}) parsel(?: |$)/);
  imar.setParcel({district:district==='yenibosna'?'bahcelievler':yakutDistrictPages[district],
   mahalle:neighborhood,ada:identifiers?.[1],parsel:identifiers?.[2]});
  if(['mahalle','ada','parsel'].every(id=>document.getElementById(id)?.value)){
   yakutParcelStep='';return lookup();
  }
  if(district){
   yakutParcelStep=['mahalle','ada','parsel'].find(id=>!document.getElementById(id).value);
   return say({mahalle:'Mahalle adı nedir?',ada:'Ada numarası kaç?',parsel:'Parsel numarası kaç?'}[yakutParcelStep]);
  }
  yakutParcelStep='ilçe';
  return say('Önce ilçe adını söyleyin.');
 }
 if(!yakutParcelStep)return false;
 if(yakutParcelStep==='ilçe'){
  const district=Object.keys(yakutDistrictPages).find(name=>command===name||command===name+' ilçesi');
  if(!district)return false;
  imar.setParcel({district:district==='yenibosna'?'bahcelievler':yakutDistrictPages[district]});
  yakutParcelStep='mahalle';
  return say('Mahalle adı nedir?');
 }
 if(yakutParcelStep==='mahalle'){
 if(command.split(' ').length>5||/\b(?:nasıl|nedir|araştır)\b/.test(command))return false;
  imar.setParcel({mahalle:command.replace(/ mahallesi$/,'')});
  yakutParcelStep='ada';
  return say('Ada numarası kaç?');
 }
 const number=command.match(/^(?:ada |parsel )?(\d{1,9})(?: ada| parsel)?$/)?.[1];
 if(!number)return false;
 imar.setParcel({[yakutParcelStep]:number});
 if(yakutParcelStep==='ada'){
  yakutParcelStep='parsel';
  return say('Parsel numarası kaç?');
 }
 yakutParcelStep='';
 return lookup();
}
let yakutScenario = null;
function yakutOfficialImarRequest(command){
 return !/(?:ön hesap|senaryo|varsay|yüzde 30|yüzde 40|yüzde 50)/.test(command)&&
  /(?:imar.{0,25}hesap|parsel sorgula|ada parsel sorgusu|imar sorgula|imar sorgusu|imar durumunu sorgula|kaç daire|kaç konut|kaç dükk[aâ]n|emsale esas alan|taban oturumu|inşaat alanı hesap)/.test(command);
}
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
 const state = yakutScenario ??= {district:getYakutCurrentPage()==='yakut-eimar.html'&&document.getElementById('district')?.value==='bagcilar'?'bağcılar':null, area:null, floors:null, flat:null, shop:0, waiting:null};
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
 const weather=/hava durumu|hava (?:nasıl|ne durumda|kaç derece)|hava soğuk|hava sıcak|yağmur (?:var mı|yağacak mı|yağar mı)|kar (?:var mı|yağacak mı|yağar mı)|şemsiye (?:alayım|gerek)/.test(command);
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
const yakutLiveSources=new Set();
let yakutLiveController=null;
let yakutChatController=null;
function beginYakutAudioPlayback(){
 yakutGestureClock=0;
 if(pendingSpeechGesture&&phase!=='walking'&&play(pendingSpeechGesture,true)){
  pendingSpeechGesture=null;phase='reacting';
 }
 yakutAudioPlaying=true;
}
async function askYakutLive(url,payload,generation){
 const context=yakutTtsContext;
 if(!audioUnlocked)return false;
 const controller=new AbortController();
 yakutLiveController=controller;
 let timer=setTimeout(()=>controller.abort(),25000);
 let nextStart=0;
 let played=false;
 let completed=false;
 let playbackEnded;
 let reader;
 try{
  const response=await fetch(new URL('/live',url),{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify(payload),signal:controller.signal});
  if(!response.ok&&generation===yakutVoiceGeneration){
   const delay=Number(response.headers.get('Retry-After'))*1000;
   yakutVoiceRetryAt=Date.now()+Math.min(2500,Math.max(800,delay||0));
  }
  if(!response.ok||!response.body||!response.headers.get('Content-Type')?.includes('application/x-ndjson'))return false;
  reader=response.body.getReader();
  const decoder=new TextDecoder();
  let pending='';
  for(;;){
   const {value,done}=await reader.read();
   if(done)break;
   pending+=decoder.decode(value,{stream:true});
   const lines=pending.split('\n');
   pending=lines.pop();
   for(const line of lines){
    if(!line)continue;
    const frame=JSON.parse(line);
    if(frame.error)throw new Error(frame.error);
    if(frame.done)completed=true;
    if(!frame.audio)continue;
    if(controller.signal.aborted||generation!==yakutVoiceGeneration)return false;
    clearTimeout(timer);
    timer=setTimeout(()=>controller.abort(),20000);
    const pcm=atob(frame.audio);
    const length=Math.floor(pcm.length/2);
    if(!length)continue;
    if(context){
     const buffer=context.createBuffer(1,length,24000);
     const samples=buffer.getChannelData(0);
     for(let index=0;index<length;index++){
      const value=pcm.charCodeAt(index*2)|(pcm.charCodeAt(index*2+1)<<8);
      samples[index]=(value<<16>>16)/32768;
     }
     const source=context.createBufferSource();
     source.buffer=buffer;source.connect(getYakutAudioDest()||context.destination);
     const startAt=Math.max(nextStart,context.currentTime);
     nextStart=startAt+buffer.duration;
     source.start(startAt);
     yakutLiveSources.add(source);
     playbackEnded=new Promise(resolve=>{
      source.onended=()=>{yakutLiveSources.delete(source);resolve();};
     });
    }
    if(!played){
     beginYakutAudioPlayback();
    }
    played=true;
   }
  }
 }catch(error){
  if(!played&&generation===yakutVoiceGeneration){
   yakutVoiceRetryAt=Date.now()+1000;
   console.info('Yakut Live geçişi:',error.message);
  }
 }finally{
  clearTimeout(timer);
  if(reader)reader.cancel().catch(()=>{});
  if(yakutLiveController===controller)yakutLiveController=null;
 }
 if(!played||generation!==yakutVoiceGeneration)return false;
 if(playbackEnded)await playbackEnded;
 if(generation!==yakutVoiceGeneration)return false;
 return completed;
}
async function handle(message){
const q=String(message||'').trim();if(!q||!ready)return;
const command=normalizeYakutCommand(q);
if(isYakutStopCommand(command)){stopYakutAnswer();return}
if(/^(?:yakut\s+)?(?:hayır|istemiyorum|bir şey istemiyorum|yardım istemiyorum|gerek yok|şimdilik gerek yok|sonra|şimdi değil)(?:\s+teşekkürler)?$/.test(command)){yakutScenario=null;cancelYakutSpeech();yakutPageOfferPending=false;return}
if(/^(?:yakut|yakut dinle|merhaba|merhaba yakut|selam|selam yakut|alo|alo yakut)$/.test(command)){
 cancelYakutSpeech();
 if(phase!=='walking'&&model)moveTo(centerAnswerX());
 react('greet_02','Efendim, sizi dinliyorum.','center');
 return;
}
if(isYakutHomeCommand(command))return openYakutPage('index.html');
if(/(?:hangi sayfadayız|hangi sayfadasın|hangi sayfadayım|bu sayfanın adı|şu an neredeyiz)/.test(command)){
 react('agree',yakutPageIntro(getYakutCurrentPage()),'left');return;
}
if(yakutParcelStep==='ilçe'&&handleYakutParcel(command))return;
if(yakutScenario?.waiting==='district'&&Object.hasOwn(yakutDistrictPages,command)){react('agree',yakutScenarioAnswer(q));return;}
if(yakutWantsCompanyInfo(command))return openYakutPage('kurumsal.html',true);
if(/başvuru (?:yapmak istiyorum|yapacağım|yapabilir miyim|yapmak isterim|yapmak için)|(?:ücretsiz )?keşif (?:al|istiyorum|talep etmek istiyorum)/.test(command))return openYakutPage('iletisim.html');
if(yakutWantsLocation(command)){yakutShareLocation();return;}
const phoneAnswer=yakutPhoneAnswer(command);
if(phoneAnswer){
 rememberYakutTurn(q,phoneAnswer);react('agree',phoneAnswer,'left');return;
}
if(getYakutCurrentPage()==='yakut-eimar.html'){
 if(handleYakutParcel(command))return;
 const imarAnswer=window.yakutImar?.answer(q,command);
 if(imarAnswer){react('agree',imarAnswer);return}
}else if(yakutOfficialImarRequest(command)){
 try{sessionStorage.setItem('yakutImarQuestion',q.slice(0,500))}catch(_){}
 return openYakutPage('yakut-eimar.html');
}
const destination=yakutPageCommand(command);
if(destination){yakutParcelStep='';yakutScenario=null;return openYakutPage(destination);}
if(handleYakutParcel(command))return;
if(handleYakutOfferAnswer(command))return;
if(/^(?:(?:yakut|lütfen) )*(?:bu )?sayfa(?:yı|daki bilgileri| hakkında)? (?:anlat|özetle|bilgi ver(?:ir misin|ebilir misin)?)(?: lütfen)?$/.test(command)){
 yakutPageOfferPending=false;yakutSpeakCurrentPage();return;
}
const weather=yakutWeatherRequest(command);
const webRequest=/(?:araştır|internet|kaynak|webde ara|güncel|bugün|yarın|son dakika|en son|maç|skor|kaç kaç|kim kazandı|kim yendi|fikstür|puan durumu|haber|döviz|dolar|euro|altın|ne yenir|nerede yenir|gezilecek)/.test(command);
const officialResearch=/(?:yasal|kanun|mevzuat|güncel destek|kira yardımı)/.test(command);
if(!weather&&!webRequest&&yakutScenarioRequest(q)){react('agree',yakutScenarioAnswer(q),'center');return}
processingSpeech=true;
 if(!weather){yakutWeatherPending='';yakutWeatherCity='';}
 if(weather?.ask){
  yakutWeatherPending=weather.period;
  const reply='Hangi şehir için hava durumuna bakayım?';
  rememberYakutTurn(q,reply);
  processingSpeech=false;react('agree',reply,'center');return;
 }
 if(weather){yakutWeatherPending='';yakutWeatherCity=weather.city;}
 let answer='Biraz bekleteceğim.';
 let generation=yakutVoiceGeneration;
 const url=new URL(yakutChatEndpoint());
 const research=Boolean(weather||webRequest||officialResearch);
 const contact=yakutContactRequest(q);
 const reference=('Açık sayfa: '+yakutPageName(getYakutCurrentPage())+'. '+(contact?contact+' ':'')+collectYakutPageSpeech()).slice(0,1500);
 const payload={question:q.slice(0,500),reference,history:yakutChatHistory};
 const controller=new AbortController();
 yakutChatController=controller;
 queueListen(0);
 let researchNotice;
 let noticeTimer;
 try{
  const ask=async search=>{
   if(search&&audioUnlocked){
    noticeTimer=setTimeout(()=>{
     if(generation!==yakutVoiceGeneration||hidden)return;
     researchNotice=speak('Biraz bekleteceğim.',[],false,true);
     generation=yakutVoiceGeneration;
    },350);
   }
   const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...payload,research:search,weather:weather?.city?weather:undefined}),
    signal:AbortSignal.any([controller.signal,AbortSignal.timeout(search?23500:10000)])});
   return response.ok?response.json():null;
  };
  let result=await ask(research);
  const needsSearch=research||result?.answer?.trim()==='WEB_ARAMASI_GEREKLI';
  if(!research&&needsSearch)result=await ask(true);
  if(generation!==yakutVoiceGeneration)return;
  if(typeof result?.answer==='string'&&result.answer.trim()){
   answer=result.answer.trim().replace(/\*\*/g,'');
   rememberYakutTurn(q,answer);
  }else if(needsSearch)answer='Biraz bekleteceğim.';
 }catch(error){
  if(!controller.signal.aborted)console.warn('Yakut sohbet isteği:',error);
 }finally{
  clearTimeout(noticeTimer);
  if(yakutChatController===controller)yakutChatController=null;
 }
 if(researchNotice&&generation===yakutVoiceGeneration){
  if(yakutAudioPlaying)await researchNotice;
  else yakutLiveController?.abort();
 }
 if(generation!==yakutVoiceGeneration)return;
processingSpeech=false;
react('agree',answer,'center');
}
function queueListen(delay=50){
 clearTimeout(listenRetry);
 if(!ready||!listenEnabled||hidden)return;
 const stopOnly=speaking||processingSpeech;
 if(recognition){
  micStopOnly=stopOnly;
  if(!stopOnly)return;
 }
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
 talk.textContent='🎤 YAKUT';
}
function speechProblem(err){
 if(!listenEnabled||hidden)return;
 if(err==='not-allowed'||err==='service-not-allowed'){
  stopListening();return;
 }
 if(err==='audio-capture'){
  stopListening();return;
 }
 if(err==='no-speech'||err==='aborted'){return}
 micFailureCount++;
 if(err==='network'||err==='language-not-supported'||err==='language-unavailable'){
  if(micFailureCount>=4){stopListening();return;}
  micRestartAt=Date.now()+Math.min(6000,1200*micFailureCount);
 }else{
  if(micFailureCount>=5){stopListening();return;}
  micRestartAt=Date.now()+Math.min(5000,1000*micFailureCount);
 }
}
function startSpeech(){
 if(!ready||!listenEnabled||hidden||recognition)return;
 const API=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!API){stopListening();return}
 const rec=new API();recognition=rec;micStarting=true;
 micStopOnly=speaking||processingSpeech;
 rec.lang='tr-TR';rec.interimResults=true;rec.continuous=true;rec.maxAlternatives=1;
 rec.onstart=()=>{if(recognition!==rec)return;clearTimeout(micStartTimer);micStarting=false;talk.textContent='🟢 Dinliyorum'};
 let finalText='';
 let hasInterim=false;
 let timer;
 const submit=()=>{
  clearTimeout(timer);
  const candidate=finalText.trim();
  finalText='';
  hasInterim=false;
  if(recognition!==rec||!candidate||!listenEnabled||hidden)return false;
  releaseYakutMic();
  speaking=false;
  processingSpeech=false;
  Promise.resolve(handle(candidate)).catch(error=>{
   console.warn('Yakut komut hatası:',error);
   processingSpeech=false;
  }).finally(()=>{
   if(!speaking&&!processingSpeech)queueListen(80);
  });
  return true;
 };
 const waitForSentenceEnd=()=>{
  clearTimeout(timer);
  if(finalText&&!hasInterim)timer=setTimeout(submit,450);
 };
 if(!micStopOnly){
  rec.onspeechstart=()=>clearTimeout(timer);
  rec.onspeechend=waitForSentenceEnd;
 }
 rec.onresult=e=>{
  if(recognition!==rec||!listenEnabled||hidden)return;
  micFailureCount=0;
  clearTimeout(timer);
  const results=Array.from(e.results);
  if(speaking||processingSpeech||micStopOnly){
   for(const result of results.slice(e.resultIndex)){
    const heard=normalizeYakutCommand(result[0].transcript);
    if(isYakutStopCommand(heard)){
     releaseYakutMic();
     stopYakutAnswer();
     return;
    }
   }
   return;
  }
  const latestTranscript=results.slice(e.resultIndex).map(r=>r[0]?.transcript||'').join(' ').trim();
  if(/^(?:yakut|merhaba|selam|alo)$/i.test(normalizeYakutCommand(latestTranscript))){
   finalText=latestTranscript;
   submit();
   return;
  }
  finalText=results.filter(result=>result.isFinal)
   .map(result=>result[0].transcript.trim()).join(' ');
  hasInterim=results.some(result=>!result.isFinal&&result[0].transcript.trim());
  waitForSentenceEnd();
 };
 rec.onerror=e=>{if(recognition!==rec)return;clearTimeout(timer);releaseYakutMic();micLastError=e.error||'unknown';speechProblem(micLastError);if(listenEnabled&&!hidden)queueListen(150)};
 rec.onend=()=>{
  if(recognition!==rec)return;
  clearTimeout(timer);
  if(!micStopOnly&&finalText.trim()&&submit())return;
  if(recognition===rec){clearTimeout(micStartTimer);micStarting=false;recognition=null}
  if(listenEnabled&&!hidden){talk.textContent='🟢 Dinliyorum';queueListen(120)}
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
 if(!ready)return;
 talk.hidden=false;
 if(listenEnabled&&recognition){stopListening();return}
 listenEnabled=true;micFailureCount=0;micRestartAt=0;talk.hidden=getYakutCurrentPage()==='index.html';talk.textContent='🟢 Dinliyorum';
 if(!openingSpoken)beginYakutVisit();
 queueListen(50);
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
 listenEnabled=true;
 const page=getYakutCurrentPage();
 yakutPageOfferPending=page!=='index.html'&&Object.hasOwn(yakutPages,page);
 try{
  if(sessionStorage.getItem('yakutGreeted')==='1'){
   openingSpoken=true;openingGreeted=true;yakutFirstGreetingDone=true;
  }
  const pageOffer=sessionStorage.getItem('yakutPageOffer');
  sessionStorage.removeItem('yakutPageOffer');
  yakutPendingPageSpeech=yakutPageOfferPending&&pageOffer==='anlat:'+page;
 }catch(e){}
 resumeYakutSound();
 queueListen(120);
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
 if(getYakutCurrentPage()!=='index.html'||yakutFirstGreetingDone)prepareYakutPageOffer();
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
let greetedBefore=false;
try{greetedBefore=sessionStorage.getItem('yakutGreeted')==='1'}catch(_){}
if(yakutGreetingInProgress)posX=centerAnswerX();
else if(getYakutCurrentPage()==='index.html'&&!openingGreeted&&!greetedBefore)posX=leftGreetingX();
else posX=yakutRightX();
targetX=posX;model.rotation.y=0;phase='idle';play('wait');
positionStage();
startYakutSession();
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
 if(pendingSpeechGesture&&yakutAudioPlaying){const gesture=pendingSpeechGesture;pendingSpeechGesture=null;play(gesture,true);phase='reacting'}
 if(yakutIsGreetingWalking)finishYakutGreetingWalk();
}else{posX+=Math.sign(targetX-posX)*step;}
positionStage();
}else if(phase==='idle'&&!reduced){
walkTimer+=dt;
}
if(face){
let amp=0;
if(yakutAudioPlaying&&yakutLiveSources.size>0&&yakutAnalyser&&yakutAnalyserData){
 yakutAnalyser.getByteTimeDomainData(yakutAnalyserData);
 let sum=0;
 for(let k=0;k<yakutAnalyserData.length;k++){const d=(yakutAnalyserData[k]-128)/128;sum+=d*d;}
 amp=Math.min(1,Math.sqrt(sum/yakutAnalyserData.length)*5.5);
}
for(const [name,i] of Object.entries(face.morphTargetDictionary)){
const influence=/jawOpen|viseme_A/i.test(name)?amp*.75:/viseme_O/i.test(name)?amp*.22:0;
face.morphTargetInfluences[i]=THREE.MathUtils.damp(face.morphTargetInfluences[i],influence,48,dt)}
}
}
renderer.render(scene,camera);
}frame();
}catch(err){
console.error('YAKUT V9 modeli yüklenemedi:',err);stage.remove();
model=null;
if(yakutIsGreetingWalking)finishYakutGreetingWalk();
else if(yakutOpeningBow)completeYakutOpening();
startYakutSession();
}}
document.addEventListener('yakut:eimar-result',event=>{
 if(ready&&typeof event.detail==='string'){
  if(!audioUnlocked)yakutDeferredSpeech=[event.detail];
  else react('agree',event.detail,'left');
 }
});
yakutStartTimer=setTimeout(startYakutSession,1200);
init();
})();
