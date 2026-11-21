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
ui.innerHTML='<button id="yakut-voice" type="button" aria-label="Karşılama sesini aç" hidden>🔊 Sesi Aç</button><button id="yakut-talk" type="button" aria-label="Mikrofon izni ver" hidden>🎤 İzin Ver</button><button id="yakut-close" type="button" aria-label="YAKUT’u gizle">✕</button>';
document.body.append(stage,ui);
const enableAudio=document.createElement('button');enableAudio.id='yakut-enable-audio';enableAudio.type='button';enableAudio.textContent='🔊 YAKUT’u Dinle';enableAudio.hidden=false;document.body.appendChild(enableAudio);
const voiceButton=ui.querySelector('#yakut-voice'),talk=ui.querySelector('#yakut-talk'),close=ui.querySelector('#yakut-close');
let THREE,model,mixer,face,clips={},current=null,ready=false,hidden=false,speaking=false,recognition=null,listenEnabled=false,micStarting=false,listenRetry=null,visitorInteracted=false;
let openingGreeted=false,openingSpoken=false,voiceEnabled=false;
let micFailureCount=0,micLastError='',micRestartAt=0;
let processingSpeech=false;
let micStartTimer;
let yakutFirstInteraction=false,yakutWelcomeRequested=false,yakutFirstGreetingDone=false,yakutPageOfferPending=false,yakutOfferSpoken=false,yakutIsGreetingWalking=false,yakutPendingPageSpeech=false;
let yakutGreetingInProgress=false,yakutGreetingEndAt=0;
let yakutCurrentPrompt='',yakutLastOfferAt=0,yakutLastInputAt=0,yakutOpeningBow=false,yakutSpeechEndedAt=0;
let phase='loading',posX=-280,targetX=0,walkTimer=0,phaseTime=0,turnRight=true,dialogTimer=0,normalScale=1,basePosition=null;
let yakutGreetingIdleTimer=null;
let yakutWelcomeWaitingForSound=false;
function cancelGreetingRetreat(){clearTimeout(yakutGreetingIdleTimer);yakutGreetingIdleTimer=null}
function scheduleGreetingRetreat(delay=14000){cancelGreetingRetreat();yakutGreetingIdleTimer=setTimeout(()=>{if(!hidden&&ready&&!speaking&&!processingSpeech&&phase!=='walking'&&getYakutCurrentPage()==='index.html'){moveTo(leftGreetingX())}},delay)}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function show(text,ms=7000){/* No on-screen text by design. Keep speech and diagnostic logs separate. */}
function play(name,once=false,speed=1){if(!THREE||!clips[name])return false;
const next=clips[name];if(current&&current!==next)current.fadeOut(.22);
next.reset().setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity).setEffectiveTimeScale(speed).setEffectiveWeight(1).fadeIn(.22).play();
next.clampWhenFinished=!!once;current=next;return true;
}

let audioUnlocked=false,yakutTtsContext=null,yakutAudioPlaying=false,yakutVoiceGeneration=0,yakutGestureClock=0;
let yakutDeferredSpeech='';
let yakutStartTimer;
function unlockYakutSound(){
 yakutFirstInteraction=true;
 audioUnlocked=true;
 try{sessionStorage.setItem('yakutAudioApproved','1')}catch(_){}
 visitorInteracted=true;
 listenEnabled=true;
 if(!yakutTtsContext){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(Audio){try{yakutTtsContext=new Audio()}catch(_){}}
 }
 if(yakutTtsContext&&yakutTtsContext.state!=='running')yakutTtsContext.resume().catch(()=>{});
 micFailureCount=0;micRestartAt=0;enableAudio.hidden=true;
 if(!ready){yakutWelcomeRequested=true;return}
 if(yakutWelcomeWaitingForSound){
  yakutWelcomeWaitingForSound=false;enableAudio.hidden=true;cancelGreetingRetreat();
  speak(welcome);return;
 }
 if(yakutDeferredSpeech){const text=yakutDeferredSpeech;yakutDeferredSpeech='';speak(text);return}
 if(!speaking&&!processingSpeech)beginYakutVisit();
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
  moveTo(centerAnswerX());
  if(phase!=='walking')finishYakutGreetingWalk();
  return;
 }
 if(yakutPageOfferPending&&audioUnlocked&&!yakutOfferSpoken){offerYakutPage();return}
 if(!speaking)queueListen(450);
}
function handleYakutActivation(event){
 if(!event.isTrusted||navigator.userActivation?.isActive===false)return;
 if(!yakutFirstInteraction||event.target===enableAudio)unlockYakutSound();
}
// On touch devices pointerdown can precede activation and hide the button before click.
document.addEventListener('click',handleYakutActivation,true);
document.addEventListener('keydown',handleYakutActivation,true);
function finishYakutSpeech(){
 yakutAudioPlaying=false;
 speaking=false;yakutSpeechEndedAt=Date.now();
 if(yakutGreetingInProgress){
  yakutGreetingInProgress=false;yakutGreetingEndAt=Date.now();
  moveTo(yakutRightX());
 }
 if(yakutPageOfferPending && !yakutOfferSpoken && !yakutIsGreetingWalking)offerYakutPage();
 if(listenEnabled&&!hidden)queueListen(300);
}
async function speak(text,retryOnFailure=true){
 clearTimeout(listenRetry);
 releaseYakutMic();
 const prompt=String(text||'').trim();
 if(!prompt){queueListen(300);return}
 yakutCurrentPrompt=prompt;
 speaking=true;
 yakutAudioPlaying=false;
 const turn=++yakutVoiceGeneration;
 const endpoint=yakutChatEndpoint();
 let finished=false;
 try{
  if(!await ensureYakutAudio())return;
  if(turn!==yakutVoiceGeneration||hidden)return;
  const payload={readAloud:prompt};
  finished=await askYakutLive(endpoint,payload,turn);
  if(!finished&&turn===yakutVoiceGeneration&&!hidden){
   finished=await askYakutLive(endpoint,payload,turn);
  }
 }catch(error){
  console.warn('Yakut ses isteği:',error);
 }finally{
  if(turn===yakutVoiceGeneration&&!finished){
   if(retryOnFailure&&!hidden){
    speaking=false;
    yakutDeferredSpeech=prompt;
    enableAudio.textContent='🔊 Yakut’u dinle';
    enableAudio.hidden=false;
   }else finishYakutSpeech();
  }
 }
}
function yakutChatEndpoint(){
 const endpoint=document.querySelector('meta[name="yakut-chat-endpoint"]')?.content;
 return endpoint||'https://kumtas-yakut-api.bloomyvanilla256.chatgpt.site/chat';
}
async function ensureYakutAudio(){
 if(!audioUnlocked)return false;
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio)return false;
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
function openingGreeting(){
 if(!ready||hidden||openingGreeted)return;
 // Do not greet before the visitor interacts; never greet again on another page.
 if(!yakutFirstInteraction)return;
 beginYakutVisit();
}
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
 if(audioUnlocked){
  enableAudio.hidden=true;
  speak(welcome);
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
function moveTo(x){if(!model)return;targetX=Math.max(0,Math.min(x,innerWidth-stage.offsetWidth));if(!reduced&&Math.abs(targetX-posX)>12){phase='walking';turnRight=targetX>posX;model.rotation.y=turnRight?Math.PI/2:-Math.PI/2;const gait=Object.keys(clips).find(n=>/^(walk|walk_\d+|walking)$/i.test(n))||Object.keys(clips).find(n=>/walk|yürü/i.test(n));if(gait)play(gait,false,1.12);else{console.warn('YAKUT: yürüme animasyonu bulunamadı, kayma yerine sabit kalıyor');targetX=posX;phase='idle';play('wait')}}else{posX=targetX;positionStage();phase='idle';play('wait')}}
let pendingSpeechGesture=null;
function findYakutGesture(preferred){
 if(preferred==='bow')return Object.keys(clips).find(n=>/^(to[ _-]?bow|bow|bow_\d+|bowing|respect|selam_eğil)$/i.test(n))||Object.keys(clips).find(n=>/bow|eğil|saygı/i.test(n))||null;
 return clips[preferred]?preferred:(clips.agree?'agree':'wait');
}
function react(clip,text,placement='left'){
 if(!ready)return;
 if(model&&phase!=='walking')model.rotation.y=0;
 phaseTime=0;
 pendingSpeechGesture=findYakutGesture(clip);
 speak(text);
}
// A single conversation/session for all published pages: greetings are once per visit.
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
  .replace(/^(?:(?:yakut|asistan|lütfen|hadi|hemen|beni|bizi) )+/,'')
  .replace(/(?: (?:lütfen|aç(?:ar mısın)?|git|geç|götür|göster|dön|yönlendir|girmek istiyorum))+$/,'');
 const withoutPage=words.replace(/ sayfa(?:sı(?:na|nı)?|ya|yı)?$/,'');
 return Object.entries(yakutPages).find(([path,names])=>names.some(name=>{
  const label=normalizeYakutCommand(name);
  return words===label||withoutPage===label||['a','e','ya','ye','ı','i','u','ü','yı','yi','yu','yü'].some(suffix=>words===label+suffix||words===label+' '+suffix);
 }))?.[0]||null;
}
function normalizeYakutCommand(message){
 return String(message||'').toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü0-9\s]/gi,' ').replace(/\s+/g,' ').trim();
}
function getYakutCurrentPage(){return decodeURIComponent(location.pathname.split('/').pop()||'index.html').toLowerCase()}
function isYakutHomeCommand(message){
 const t=normalizeYakutCommand(message);
 return /^(?:(?:yakut|asistan|lütfen|beni|bizi|hemen|hadi)\s+)*(?:ana\s*sayfa(?:ya|yı)?|anasayfa(?:ya|yı)?|ana\s*sayfayı\s*aç|ana\s*sayfaya\s*(?:git|dön|geç)|eve\s*dön)(?:\s+(?:aç|git|dön|geç|götür|lütfen|istiyorum))?$/.test(t);
}
function yakutWantsCompanyInfo(command){
 const topic=command.replace(/^(?:(?:yakut|asistan|lütfen) )+/, '');
 return /^(?:hakkımızda|şirket bilgileri(?:ni)?|firma bilgileri(?:ni)?|(?:şirket|firma)(?:imiz|iniz) hakkında bilgi)(?: (?:ver|anlat|istiyorum|verir misin|verebilir misin|almak istiyorum|lütfen))*$/.test(topic);
}
function cancelYakutSpeech(){
 yakutLiveController?.abort();
 for(const source of yakutLiveSources){try{source.stop()}catch(_){}}
 yakutLiveSources.clear();
 ++yakutVoiceGeneration;yakutAudioPlaying=false;yakutDeferredSpeech='';
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
 return yakutPageName(path)+' sayfasındayız. ';
}
function prepareYakutPageOffer(){
 if(getYakutCurrentPage()==='index.html')return;
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
 const page=getYakutCurrentPage();
 const content=collectYakutPageSpeech();
 const intro=page==='kurumsal.html'?'Kurumsal sayfasındayız. Size şirketimiz hakkında bilgi vereyim. ':yakutPageIntro(page);
 const text=intro+(content||'Bu sayfada ayrıntılı açıklama bulunamadı. Size hangi konuda yardımcı olabilirim?');
 react('agree',text,'left');
}
// Verified site contact details. Speak slash as 'A harfi', not a mathematical fraction.
const yakutContact={
 address:'Kocasinan Merkez Mahallesi, Mahmutbey Caddesi, bina numarası iki yüz kırk beş, A harfi, Bahçelievler, İstanbul.',
 landline:'Sabit telefon numaramız: sıfır, iki yüz on iki, dokuz yüz elli beş, elli beş, doksan dokuz.',
 mobile:'Cep telefonu ve WhatsApp numaramız: sıfır, beş yüz kırk üç, yüz seksen bir, otuz dört, seksen beş.',
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
 react('agree','Şirketimizin konum bağlantısını ekrana ekledim. Dokunarak haritada açabilirsiniz.');
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
  if(audioUnlocked)sessionStorage.setItem('yakutAudioApproved','1');
 }catch(e){console.warn('YAKUT sayfa geçişi:',e)}
 location.assign(new URL(path,location.origin+'/').href);
 return true;
}
let yakutParcelStep='';
function handleYakutParcel(command){
 const onPage=getYakutCurrentPage()==='yakut-eimar.html';
 if(!onPage)return false;
 const say=text=>{react('agree',text);return true};
 if(/(?:resmi|resmî|belediye) (?:sorgu(?:yu)?|e imar)(?: sayfasını)? aç/.test(command)){
  const source=document.getElementById('source');
  source?.focus();source?.scrollIntoView({block:'center'});
  return say('Resmî e-İmar sayfasını aç düğmesine dokunun. Açılan sayfada ada parsel sorgusunu seçip mahalle, ada ve parseli girin.');
 }
 if(/(?:^| )(?:imar sorgusu(?:na başla)?|parsel sorgula|ada parsel sorgula|ada parsel sorgusu)(?: |$)/.test(command)){
  yakutParcelStep='ilçe';
  return say('Önce ilçe adını söyleyin. Bağcılar için doğrudan resmî sorgu bağlantısı var.');
 }
 if(!yakutParcelStep)return false;
 if(yakutParcelStep==='ilçe'){
  const district=Object.keys(yakutDistrictPages).find(name=>command===name||command===name+' ilçesi');
  if(!district)return false;
  if(district!=='bağcılar'){
   yakutParcelStep='';
   const source=document.getElementById('yakut-official-directory');
   source.href='https://www.turkiye.gov.tr/arama?aranan='+encodeURIComponent(district+' belediyesi imar durum bilgisi sorgulama');
   source.hidden=false;
   return say(district+' için e-Devlet arama bağlantısını açabilirsiniz. Belediyenin hizmetini seçin. İsterseniz burada varsayımlı alan hesabı yapabiliriz.');
  }
  const field=document.getElementById('district');
  if(field)field.value='bagcilar';
  yakutParcelStep='mahalle';
  return say('Bağcılar. Mahalle adı nedir?');
 }
 if(yakutParcelStep==='mahalle'){
  if(command.split(' ').length>5||/\d|\b(?:nasıl|nedir|araştır)\b/.test(command))return false;
  const field=document.getElementById('mahalle');
  if(field)field.value=command.replace(/ mahallesi$/,'');
  yakutParcelStep='ada';
  return say('Ada numarası kaç?');
 }
 const number=command.match(/^(?:ada |parsel )?(\d{1,10})$/)?.[1];
 if(!number)return false;
 const field=document.getElementById(yakutParcelStep);
 if(field)field.value=number;
 if(yakutParcelStep==='ada'){
  yakutParcelStep='parsel';
  return say('Parsel numarası kaç?');
 }
 yakutParcelStep='';
 const source=document.getElementById('source');
 source?.focus();source?.scrollIntoView({block:'center'});
 return say('Bağcılar e-İmar sorgusu için bilgiler hazır. Resmî e-İmar sayfasını aç düğmesine dokunun ve bilgileri oradaki forma girin. Ön hesap için arsa alanınızı söyleyebilirsiniz.');
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
async function askYakutLive(url,payload,generation){
 const context=yakutTtsContext;
 if(!audioUnlocked||context?.state!=='running')return false;
 const controller=new AbortController();
 yakutLiveController=controller;
 let timer=setTimeout(()=>controller.abort(),13000);
 let nextStart=0;
 let played=false;
 let completed=false;
 let playbackEnded;
 let reader;
 try{
  const response=await fetch(new URL('/live',url),{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify(payload),signal:controller.signal});
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
    timer=setTimeout(()=>controller.abort(),27000);
    const pcm=atob(frame.audio);
    const length=Math.floor(pcm.length/2);
    if(!length)continue;
    const buffer=context.createBuffer(1,length,24000);
    const samples=buffer.getChannelData(0);
    for(let index=0;index<length;index++){
     const value=pcm.charCodeAt(index*2)|(pcm.charCodeAt(index*2+1)<<8);
     samples[index]=(value<<16>>16)/32768;
    }
    const source=context.createBufferSource();
    source.buffer=buffer;source.connect(context.destination);
    nextStart=Math.max(nextStart,context.currentTime+(played?0.015:0.09));
    source.start(nextStart);nextStart+=buffer.duration;
    yakutLiveSources.add(source);
    playbackEnded=new Promise(resolve=>{
     source.onended=()=>{yakutLiveSources.delete(source);resolve();};
    });
    if(!played){
     yakutGestureClock=0;
     if(pendingSpeechGesture&&phase!=='walking'&&play(pendingSpeechGesture,true)){
      pendingSpeechGesture=null;phase='reacting';
     }
    }
    speaking=true;yakutAudioPlaying=true;played=true;
   }
  }
 }catch(error){
  if(!played&&generation===yakutVoiceGeneration)console.info('Yakut Live bağlantısı:',error.message);
 }finally{
  clearTimeout(timer);
  if(reader)reader.cancel().catch(()=>{});
  if(yakutLiveController===controller)yakutLiveController=null;
 }
 if(!played||generation!==yakutVoiceGeneration)return false;
 await playbackEnded;
 if(generation!==yakutVoiceGeneration)return false;
 if(!completed)console.warn('Yakut ses akışı tamamlanmadan bağlantı kesildi.');
 finishYakutSpeech();
 return true;
}

async function handle(message){
const q=String(message||'').trim();if(!q||!ready)return;
cancelGreetingRetreat();
const command=normalizeYakutCommand(q);
if(/^(?:yakut\s+)?(?:dur|sus|konuşma|kes|yeter)$/.test(command)){yakutScenario=null;yakutParcelStep='';yakutWeatherPending='';cancelYakutSpeech();yakutPageOfferPending=false;return}
if(/^(?:yakut\s+)?(?:hayır|istemiyorum|bir şey istemiyorum|yardım istemiyorum|gerek yok|şimdilik gerek yok|sonra|şimdi değil)(?:\s+teşekkürler)?$/.test(command)){yakutScenario=null;cancelYakutSpeech();yakutPageOfferPending=false;return}
if(command==='yakut'||command==='yakut dinle'){cancelYakutSpeech();react('greet_02','Efendim, dinliyorum.','left');return}
if(isYakutHomeCommand(command))return openYakutPage('index.html');
if(/(?:hangi sayfadayız|hangi sayfadasın|hangi sayfadayım|bu sayfanın adı|şu an neredeyiz)/.test(command)){
 react('agree',yakutPageIntro(getYakutCurrentPage()));return;
}
if(yakutParcelStep==='ilçe'&&handleYakutParcel(command))return;
if(yakutScenario?.waiting==='district'&&Object.hasOwn(yakutDistrictPages,command)){react('agree',yakutScenarioAnswer(q));return;}
if(yakutWantsCompanyInfo(command))return openYakutPage('kurumsal.html',true);
if(/başvuru (?:yapmak istiyorum|yapacağım|yapabilir miyim|yapmak isterim|yapmak için)|(?:ücretsiz )?keşif (?:al|istiyorum|talep etmek istiyorum)/.test(command))return openYakutPage('iletisim.html');
if(yakutWantsLocation(command)){yakutShareLocation();return;}
const destination=yakutPageCommand(command);
if(destination){yakutParcelStep='';yakutScenario=null;return openYakutPage(destination);}
if(handleYakutParcel(command))return;
if(handleYakutOfferAnswer(command))return;
if(/^(?:(?:yakut|lütfen) )*(?:bu )?sayfa(?:yı|daki bilgileri| hakkında)? (?:anlat|özetle|bilgi ver(?:ir misin|ebilir misin)?)(?: lütfen)?$/.test(command)){
 yakutPageOfferPending=false;yakutSpeakCurrentPage();return;
}
const weather=yakutWeatherRequest(command);
const webRequest=/(?:araştır|internet|kaynak|webde ara|güncel|bugün|yarın|son dakika|en son|maçı|maç var|fikstür|ne yenir|nerede yenir|gezilecek)/.test(command);
if(!weather&&!webRequest){
 if(yakutScenarioRequest(q)){react('agree',yakutScenarioAnswer(q),'center');return}
}
processingSpeech=true;
releaseYakutMic();
 if(!weather){yakutWeatherPending='';yakutWeatherCity='';}
 if(weather?.ask){
  yakutWeatherPending=weather.period;
  const reply='Hangi şehir için hava durumuna bakayım?';
  rememberYakutTurn(q,reply);
  processingSpeech=false;react('agree',reply,'center');return;
 }
 if(weather){yakutWeatherPending='';yakutWeatherCity=weather.city;}
 let answer='Sohbet sunucusuna şu anda ulaşamadım. Sorunuzu tekrar söyleyebilirsiniz.';
 let generation=yakutVoiceGeneration;
 const url=new URL(yakutChatEndpoint());
 const research=Boolean(weather||webRequest||/(?:yasal|kanun|mevzuat|güncel destek|kira yardımı)/.test(command));
 const contact=yakutContactRequest(q);
 const reference=('Açık sayfa: '+yakutPageName(getYakutCurrentPage())+'. '+(contact?contact+' ':'')+collectYakutPageSpeech()).slice(0,1500);
 const payload={question:q.slice(0,500),reference,history:yakutChatHistory};
 let researchNotice;
 let noticeTimer;
 try{
  const ask=async search=>{
   if(search&&audioUnlocked){
    noticeTimer=setTimeout(()=>{
     if(generation!==yakutVoiceGeneration||hidden)return;
     researchNotice=speak('Bakıp size haber vereceğim. Lütfen biraz bekleyin.',false);
     generation=yakutVoiceGeneration;
    },350);
   }
   const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...payload,research:search,weather:weather?.city?weather:undefined}),
    signal:AbortSignal.timeout(search?23500:10000)});
   return response.ok?response.json():null;
  };
  let result=await ask(research);
  const needsSearch=research||result?.answer?.trim()==='WEB_ARAMASI_GEREKLI';
  if(!research&&needsSearch)result=await ask(true);
  if(generation!==yakutVoiceGeneration)return;
  if(typeof result?.answer==='string'&&result.answer.trim()){
   answer=result.answer.trim().replace(/\*\*/g,'');
   rememberYakutTurn(q,answer);
  }else if(needsSearch)answer='Bu soru için doğrulanmış bir sonuç alamadım. İsterseniz başka bir kaynak veya daha belirli bir soru deneyelim.';
 }catch(error){
  console.warn('Yakut sohbet isteği:',error);
 }finally{
  clearTimeout(noticeTimer);
 }
 if(researchNotice&&generation===yakutVoiceGeneration){
  if(yakutAudioPlaying)await researchNotice;
  else yakutLiveController?.abort();
 }
 if(generation!==yakutVoiceGeneration)return;
processingSpeech=false;
react('agree',answer,'center');
}
function queueListen(delay=600){
 clearTimeout(listenRetry);
 if(!listenEnabled||hidden||processingSpeech||speaking||recognition||micStarting||yakutDeferredSpeech)return;
 const ms=Math.max(delay,micRestartAt-Date.now(),0);
 listenRetry=setTimeout(()=>{if(listenEnabled&&!hidden&&!speaking&&!processingSpeech&&!recognition)startSpeech()},ms)
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
function showYakutMicRetry(){
 enableAudio.textContent='🎤 Yakut’u dinlemeye al';
 enableAudio.hidden=false;
}
function speechProblem(err){
 if(!listenEnabled||hidden)return;
 if(err==='not-allowed'||err==='service-not-allowed'){
  stopListening();show('Mikrofon erişimi engellendi. Tarayıcı adres çubuğundaki kilit simgesinden bu site için mikrofon izni verin.',10000);
  showYakutMicRetry();return;
 }
 if(err==='audio-capture'){
  stopListening();show('Mikrofon bulunamadı veya başka bir uygulama tarafından kullanılıyor. Mikrofonu kontrol edin; isterseniz yazarak devam edin.',11000);
  showYakutMicRetry();return;
 }
 if(err==='no-speech'||err==='aborted'){return}
 // SpeechRecognition may rely on a browser speech server and cannot always run offline.
 micFailureCount++;
 if(err==='network'||err==='language-not-supported'||err==='language-unavailable'){
  if(micFailureCount>=3){
   stopListening();show('Tarayıcının ses tanıma bağlantısı çalışmıyor. İnternet bağlantısını kontrol edin veya mesajı yazın. Tekrar denemek için 🎤 YAKUT düğmesine basın.',11000);
   showYakutMicRetry();return;
  }
  micRestartAt=Date.now()+Math.min(12000,2000*micFailureCount);
  show('Ses bağlantısı kontrol ediliyor. Sorun devam ederse yazılı mesaj kullanabilirsiniz.',4000);
 }else{
  if(micFailureCount>=4){
   stopListening();show('Ses algılama başlatılamadı. Mikrofon iznini ve tarayıcı ayarlarını kontrol edin. Yazılı mesaj gönderebilirsiniz.',10000);showYakutMicRetry();return;
  }
  micRestartAt=Date.now()+Math.min(8000,1500*micFailureCount);
 }
}
function startSpeech(){
 const API=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!API){stopListening();showYakutMicRetry();show('Bu tarayıcı ses tanımayı desteklemiyor. Chrome veya Edge kullanın.',9000);return}
 if(!ready||!listenEnabled||hidden||speaking||processingSpeech||recognition||micStarting)return;
 const rec=new API();recognition=rec;micStarting=true;
 rec.lang='tr-TR';rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=1;
 rec.onstart=()=>{if(recognition!==rec)return;clearTimeout(micStartTimer);micStarting=false;enableAudio.hidden=true;talk.textContent='🟢 Dinliyorum'};
 let finalText='';
 let timer;
 const submit=()=>{
  clearTimeout(timer);
  if(recognition!==rec||!finalText||speaking||!listenEnabled||hidden)return;
  const spoken=finalText;
  finalText='';
  releaseYakutMic();
  Promise.resolve(handle(spoken)).catch(error=>{
   console.warn('Yakut komut hatası:',error);
   processingSpeech=false;
  }).finally(()=>queueListen(300));
 };
 rec.onresult=e=>{
  if(recognition!==rec||speaking||!listenEnabled)return;
  micFailureCount=0;
  clearTimeout(timer);
  finalText=Array.from(e.results).filter(result=>result.isFinal)
   .map(result=>result[0].transcript.trim()).join(' ');
  const stillSpeaking=Array.from(e.results).some(result=>!result.isFinal);
  if(finalText&&!stillSpeaking)timer=setTimeout(submit,300);
 };
 rec.onerror=e=>{if(recognition!==rec)return;releaseYakutMic();micLastError=e.error||'unknown';speechProblem(micLastError);queueListen(350)};
 rec.onend=()=>{
  if(recognition!==rec)return;
  submit();
  if(recognition===rec){clearTimeout(micStartTimer);micStarting=false;recognition=null}
  if(listenEnabled&&!hidden&&!speaking&&!processingSpeech){talk.textContent='🟢 Dinliyorum';queueListen(350)}
  else if(!listenEnabled)talk.textContent='🎤 YAKUT';
 };
 micStartTimer=setTimeout(()=>{
  if(recognition!==rec||!micStarting)return;
  releaseYakutMic();speechProblem('start-failed');queueListen(350);
 },4500);
 try{rec.start()}catch(e){
  clearTimeout(micStartTimer);
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
 
};

close.onclick=()=>{
hidden=!hidden;stage.style.display=hidden?'none':'block';
if(hidden){enableAudio.hidden=true;stopListening();cancelYakutSpeech()}
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
function startYakutSession(){
 if(ready)return;
 clearTimeout(yakutStartTimer);
 ready=true;
 try{
  if(sessionStorage.getItem('yakutGreeted')==='1'&&getYakutCurrentPage()!=='index.html'){
   openingSpoken=true;openingGreeted=true;yakutFirstGreetingDone=true;
  }
  if(sessionStorage.getItem('yakutAudioApproved')==='1')audioUnlocked=true;
  const pageOffer=sessionStorage.getItem('yakutPageOffer');
  const page=getYakutCurrentPage();
  if(page!=='index.html'&&(pageOffer===page||pageOffer==='anlat:'+page)){
   sessionStorage.removeItem('yakutPageOffer');
   yakutPendingPageSpeech=pageOffer==='anlat:'+page;
   yakutPageOfferPending=true;
  }
 }catch(e){console.warn('YAKUT oturumu:',e)}
 listenEnabled=audioUnlocked||yakutFirstInteraction;
 if(yakutFirstInteraction||yakutWelcomeRequested||(audioUnlocked&&yakutPageOfferPending))beginYakutVisit();
 else if(listenEnabled)queueListen(450);
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
if(yakutGreetingInProgress)posX=centerAnswerX();
else if(getYakutCurrentPage()==='index.html'&&!openingGreeted)posX=leftGreetingX();
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
 // Finish walking with actual footstep motion before any response gesture.
 if(pendingSpeechGesture&&yakutAudioPlaying){const gesture=pendingSpeechGesture;pendingSpeechGesture=null;play(gesture,true);phase='reacting'}
 if(yakutIsGreetingWalking)finishYakutGreetingWalk();
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
console.error('YAKUT V9 modeli yüklenemedi:',err);stage.remove();
model=null;
if(yakutIsGreetingWalking)finishYakutGreetingWalk();
else if(yakutOpeningBow)completeYakutOpening();
startYakutSession();
}}
document.addEventListener('yakut:eimar-result',event=>{
 if(ready&&typeof event.detail==='string'){
  if(!audioUnlocked){yakutDeferredSpeech=event.detail;unlockYakutSound()}
  else react('agree',event.detail);
 }
});
// Give the character a moment to load without making speech depend on WebGL.
yakutStartTimer=setTimeout(startYakutSession,1200);
init();
})();
