/* KUMTAS YAKUT V9: genuine GLB animated visitor companion.
 * Runs on the homepage only. No opening video or edits to existing HTML layout. */
(() => {
'use strict';
if(window.__yakutV9)return;window.__yakutV9=true;
const url=new URL('YAKUT_V9.glb',document.currentScript.src).href;
const welcome='Hoş geldiniz! Ben KUMTAŞ İnşaat yapay zekâ asistanınız YAKUT. Size yardımcı olmak için buradayım.';
const css=document.createElement('style');
css.textContent=`
#yakut-v9{position:fixed;left:0;bottom:70px;width:clamp(195px,22vw,290px);height:clamp(315px,40vw,445px);z-index:110;pointer-events:none;will-change:transform;filter:drop-shadow(0 6px 12px #001c3273)}
#yakut-v9 canvas{display:block;width:100%;height:100%}
#yakut-v9-ui{position:fixed;bottom:14px;left:12px;z-index:130;display:flex;gap:6px;align-items:center;max-width:calc(100vw - 24px);font:600 13px Arial,sans-serif}
#yakut-v9-ui button{border:1px solid #4fb3e9;background:#095983;color:#fff;border-radius:18px;padding:9px 12px;cursor:pointer;box-shadow:0 3px 10px #0003}
#yakut-v9-ui button:hover{background:#137aaa}
#yakut-v9-ui input{display:none;width:min(320px,45vw);padding:9px;border:1px solid #71c8fa;border-radius:14px;background:#fff;color:#122f44;font:13px Arial,sans-serif}
#yakut-v9-ui.open input{display:block}
#yakut-v9-caption{position:fixed;bottom:64px;left:12px;max-width:min(350px,85vw);z-index:131;display:none;background:#073b5cf2;color:#fff;padding:11px 13px;border:1px solid #6dccff;border-radius:13px;font:13px/1.5 Arial,sans-serif;box-shadow:0 5px 15px #0004}
#yakut-v9-caption.shown{display:block}
@media(max-width:650px){#yakut-v9{width:175px;height:282px;bottom:62px}#yakut-v9-ui{bottom:8px;left:7px;gap:4px}#yakut-v9-ui button{padding:8px;font-size:12px}#yakut-v9-ui input{width:min(180px,41vw)}#yakut-v9-caption{bottom:52px;left:7px;max-width:80vw}}
@media(prefers-reduced-motion:reduce){#yakut-v9{transition:none!important}}
`;
document.head.appendChild(css);
const stage=document.createElement('div');stage.id='yakut-v9';stage.setAttribute('aria-label','Hareketli 3D YAKUT asistanı');
stage.appendChild(document.createElement('canvas'));
const ui=document.createElement('div');ui.id='yakut-v9-ui';
ui.innerHTML='<button id="yakut-talk" type="button" aria-label="YAKUT ile konuş">🎤 YAKUT</button><input id="yakut-text" aria-label="YAKUT’a bir şey yazın" placeholder="YAKUT’a bir şey söyle..." autocomplete="off"><button id="yakut-send" type="button" aria-label="Mesajı gönder" hidden>Gönder</button><button id="yakut-close" type="button" aria-label="YAKUT’u gizle">✕</button>';
const caption=document.createElement('div');caption.id='yakut-v9-caption';
document.body.append(stage,caption,ui);
const talk=ui.querySelector('#yakut-talk'),inp=ui.querySelector('#yakut-text'),send=ui.querySelector('#yakut-send'),close=ui.querySelector('#yakut-close');
let THREE,model,mixer,face,clips={},current=null,ready=false,hidden=false,speaking=false,recognition=null,listenEnabled=false,micStarting=false,listenRetry=null,visitorInteracted=false;
let phase='loading',posX=-280,targetX=0,walkTimer=0,phaseTime=0,turnRight=true,dialogTimer=0,normalScale=1,basePosition=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function show(text,ms=7000){caption.textContent=text;caption.classList.add('shown');clearTimeout(dialogTimer);if(ms)dialogTimer=setTimeout(()=>caption.classList.remove('shown'),ms)}
function play(name,once=false,speed=1){if(!THREE||!clips[name])return false;
const next=clips[name];if(current&&current!==next)current.fadeOut(.22);
next.reset().setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity).setEffectiveTimeScale(speed).setEffectiveWeight(1).fadeIn(.22).play();
next.clampWhenFinished=!!once;current=next;return true;
}
function speak(text){show(text,Math.max(7000,text.length*85));
if(!window.speechSynthesis)return;
// Do not let YAKUT hear its own spoken response.
speaking=true;if(recognition){try{recognition.abort()}catch(e){}}
speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);
u.lang='tr-TR';u.rate=.92;u.pitch=1.09;
const voices=speechSynthesis.getVoices().filter(v=>/^tr/i.test(v.lang));
u.voice=voices.find(v=>/emel|selin|zeynep|ayla|female|kadın/i.test(v.name))||voices[0]||null;
u.onstart=()=>{speaking=true};u.onend=u.onerror=()=>{speaking=false;if(listenEnabled&&!hidden)queueListen(550)};
speechSynthesis.speak(u);
}
function positionStage(){stage.style.transform='translate3d('+Math.round(posX)+'px,0,0)'}
function moveTo(x){targetX=Math.max(0,Math.min(x,innerWidth-stage.offsetWidth));if(!reduced&&Math.abs(targetX-posX)>12){phase='walking';turnRight=targetX>posX;model.rotation.y=0;play('walk',false,.95)}else{posX=targetX;positionStage();phase='idle';play('wait')}}
function react(clip,text){if(!ready)return;phase='reacting';phaseTime=0;play(clip,true,1);speak(text)}
function handle(message){
const q=String(message||'').trim();if(!q||!ready)return;
inp.value='';const t=q.toLocaleLowerCase('tr-TR');
let clip='agree',answer='';
if(/(komik|şaka|espri|gül|haha|ahah|🤣|😂|fıkra)/i.test(t)){
 clip='laugh_02';answer='Hahaha! Çok güldüm! Seninle sohbet etmek çok eğlenceli.';
}else if(/(harika|mükemmel|süper|çok güzel|başarılı|tebrik|aferin|sevindim|mutlu|muhteşem|bravo)/i.test(t)){
 clip='dance_01';answer='Çok sevindim! Böyle güzel sözler duymak harika!';
}else if(/(teşekkür|sağ ol|eyvallah|eline sağlık)/i.test(t)){
 clip='bow';answer='Ne demek! Yardımcı olabildiysem ne mutlu bana.';
}else if(/(kızgın|sinirli|berbat|kötü|üzgün|saçma|yapamadın)/i.test(t)){
 clip='frustrated_01';answer='Seni anlıyorum. Ne olduğunu anlatırsan birlikte çözmeye çalışabiliriz.';
}else if(/(merhaba|selam|günaydın|nasılsın|kimsin|adın ne)/i.test(t)){
 clip='greet_02';answer='Merhaba! Ben YAKUT. KUMTAŞ İnşaat için buradayım. Nasıl yardımcı olabilirim?';
}else if(/(emsal|imar|arsa|metrekare|m2|m²|daire|dükkan|inşaat alanı|kat karşılığı|kentsel dönüşüm)/i.test(t)){
 clip='agree';answer='Kentsel dönüşüm konusunda yardımcı olabilirim. Arsa alanını, ilçeyi ve biliyorsan geçerli imar koşullarını yaz. Kesin yapılaşma hakkı için belediyenin güncel imar durumunu kontrol etmek gerekir.';
}else if(/(el salla|selam ver|selamla)/i.test(t)){
 clip='greet_02';answer='Merhaba! Seni görmek güzel!';
}else if(/(dans et|oyna)/i.test(t)){
 clip='dance_01';answer='Hadi biraz neşelenelim!';
}else if(/(alkış|alkışla)/i.test(t)){
 clip='clap';answer='Bravo! Seni alkışlıyorum!';
}else if(/(yürü|gez|dolaş|sola git|sağa git)/i.test(t)){
 const x=/sola/.test(t)?innerWidth*.07:/sağa/.test(t)?innerWidth*.72:innerWidth*(.15+Math.random()*.6);
 moveTo(x);speak('Tamam! Biraz yürüyüş yapıyorum.');return;
}else{clip='agree';answer='Seni duydum. İnşaat ve kentsel dönüşümle ilgili sorularında yardımcı olabilirim. Sorunu biraz daha ayrıntılı anlatır mısın?'}
react(clip,answer);
}
function queueListen(delay=250){
clearTimeout(listenRetry);if(!listenEnabled||hidden||speaking||recognition||micStarting)return;
listenRetry=setTimeout(()=>{if(listenEnabled&&!hidden&&!speaking&&!recognition)startSpeech()},delay)
}
function stopListening(){
listenEnabled=false;clearTimeout(listenRetry);
if(recognition){try{recognition.abort()}catch(e){}}
talk.textContent='🎤 YAKUT';
}
function startSpeech(){
const API=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!API){stopListening();ui.classList.add('open');send.hidden=false;show('Bu tarayıcıda ses algılama desteklenmiyor. Mesajınızı yazarak iletebilirsiniz.');return}
if(!ready||!listenEnabled||hidden||speaking||recognition||micStarting)return;
let rec=new API();recognition=rec;micStarting=true;
rec.lang='tr-TR';rec.interimResults=false;rec.continuous=false;rec.maxAlternatives=1;
rec.onstart=()=>{micStarting=false;talk.textContent='🟢 Dinliyorum'};
rec.onresult=e=>{
 const spoken=e.results?.[0]?.[0]?.transcript;
 if(!spoken)return;
 show('Siz: '+spoken,2600);
 handle(spoken);
};
rec.onerror=e=>{
 micStarting=false;
 if(e.error==='not-allowed'||e.error==='service-not-allowed'||e.error==='audio-capture'){
  stopListening();show('Mikrofon izni gerekli. Adres çubuğundan mikrofon erişimine izin verin. Yazılı mesaj da gönderebilirsiniz.',9000);
  ui.classList.add('open');send.hidden=false;return;
 }
 if(e.error==='no-speech')return;
 show('Ses algılama geçici olarak durdu; bağlantıyı yeniden deniyorum.',3000)
};
rec.onend=()=>{
 micStarting=false;if(recognition===rec)recognition=null;
 if(listenEnabled&&!hidden&&!speaking){talk.textContent='🟢 Dinliyorum';queueListen(450)}
 else if(!listenEnabled)talk.textContent='🎤 YAKUT';
};
try{rec.start()}catch(e){micStarting=false;if(recognition===rec)recognition=null;queueListen(1000)}
}
talk.onclick=()=>{
 if(!ready)return;
 ui.classList.add('open');send.hidden=false;
 if(listenEnabled){stopListening();show('Mikrofon kapatıldı. İsterseniz yazarak devam edebilirsiniz.',4000);return}
 listenEnabled=true;visitorInteracted=true;talk.textContent='🟢 Dinliyorum';
 speak('Merhaba! Ben YAKUT. Seni dinlemeye hazırım. Bana bir şey sorabilirsin.');
 if(!window.speechSynthesis)queueListen(250);
};
send.onclick=()=>handle(inp.value);
inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();handle(inp.value)}});
close.onclick=()=>{
hidden=!hidden;stage.style.display=hidden?'none':'block';caption.classList.remove('shown');
if(hidden){stopListening();speechSynthesis?.cancel();speaking=false}
close.textContent=hidden?'Göster':'✕';talk.style.display=hidden?'none':'';inp.style.display=hidden?'none':'';send.style.display=hidden?'none':'';if(!hidden){positionStage();show('YAKUT tekrar burada! Konuşmak için mikrofona bir kez dokun.',4500)}
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
ready=true;posX=-stage.offsetWidth;targetX=Math.min(innerWidth*.25,innerWidth-stage.offsetWidth);
model.rotation.y=0; // Keep YAKUT facing visitors while walking either direction.
if(reduced){posX=targetX;phase='idle';play('wait')}else{phase='walking';play('walk',false,.95)}
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
 if(phaseTime===0){phase='greeting';play('greet_02',true);show(welcome+' Sesli konuşmak için 🎤 YAKUT düğmesine bir kez bas.',8500);phaseTime=1}
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