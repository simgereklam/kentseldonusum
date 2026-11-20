/* KUMTAŞ YAKUT V9 - only 3D character, no chatbot, no opening video.
   Additive: does not change original site markup or layout. */
(() => {
'use strict';
if (window.__yakutV9) return;
window.__yakutV9 = true;
const src = new URL('../YAKUT_V9.glb', document.currentScript.src).href;
const greeting = 'Hoş geldiniz! Ben KUMTAŞ İnşaat yapay zekâ asistanınız YAKUT. Size yardımcı olmak için buradayım.';
const style = document.createElement('style');
style.textContent = [
'#yakut-v9{position:fixed;right:10px;bottom:77px;z-index:110;width:clamp(155px,19vw,260px);height:clamp(245px,37vw,390px);pointer-events:none;contain:layout style;filter:drop-shadow(0 8px 15px rgba(1,24,45,.28))}',
'#yakut-v9 canvas{display:block;width:100%;height:100%;pointer-events:none}',
'#yakut-v9-controls{position:fixed;right:17px;bottom:54px;z-index:121;display:flex;gap:6px;font:600 12px Arial,sans-serif}',
'#yakut-v9-controls button{background:#0b567e;border:1px solid #3da5d6;border-radius:18px;color:white;cursor:pointer;padding:8px 11px;box-shadow:0 5px 16px #0005}',
'#yakut-v9-controls button:hover{background:#1477a9}',
'#yakut-v9-caption{position:fixed;right:18px;bottom:calc(77px + clamp(245px,37vw,390px));z-index:111;max-width:270px;background:#063354e6;border:1px solid #3b9ed3;border-radius:12px;padding:9px 12px;color:white;font:600 12px/1.45 Arial,sans-serif;display:none;pointer-events:none}',
'#yakut-v9-caption.y-visible{display:block}',
'@media(max-width:650px){#yakut-v9{width:150px;height:232px;right:0;bottom:81px}#yakut-v9-controls{right:5px;bottom:53px}#yakut-v9-caption{max-width:220px;bottom:322px;right:8px}}'
].join('\n');
document.head.appendChild(style);
const stage=document.createElement('div');
stage.id='yakut-v9';
stage.setAttribute('aria-label','YAKUT üç boyutlu asistan');
const canvas=document.createElement('canvas');
stage.appendChild(canvas);
const controls=document.createElement('div');
controls.id='yakut-v9-controls';
controls.innerHTML='<button id="yakut-v9-greet" type="button" aria-label="YAKUT selamlasın">👋 YAKUT</button><button id="yakut-v9-hide" type="button" aria-label="YAKUT’u gizle">✕</button>';
const caption=document.createElement('div');
caption.id='yakut-v9-caption';
document.body.append(stage,controls,caption);
let clips={}, active=null, mixer=null, face=null, THREE=null, root=null;
let speaking=false, hidden=false, ready=false, phase='loading';
let introTimer=null, captionTimer=null, baseZ=0, baseScale=1, approach=0;
function status(text,ms){caption.textContent=text;caption.classList.add('y-visible');clearTimeout(captionTimer);if(ms)captionTimer=setTimeout(()=>caption.classList.remove('y-visible'),ms);}
function action(name,once=false,speed=1){if(!THREE||!clips[name])return;
const next=clips[name];if(active&&active!==next)active.fadeOut(.22);
next.reset().setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity)
 .setEffectiveTimeScale(speed).setEffectiveWeight(1).fadeIn(.22).play();
next.clampWhenFinished=once;active=next;
}
function say(text){if(!window.speechSynthesis){status(text,5000);return}
window.speechSynthesis.cancel();
const u=new SpeechSynthesisUtterance(text);
u.lang='tr-TR';u.rate=.90;u.pitch=1.1;
const voices=speechSynthesis.getVoices().filter(v=>/^tr/i.test(v.lang));
u.voice=voices.find(v=>/emel|selin|zeynep|ayla|female/i.test(v.name))||voices[0]||null;
u.onstart=()=>{speaking=true;status(text)};
u.onend=u.onerror=()=>{speaking=false;status('YAKUT burada. Konuşmak için 👋 YAKUT düğmesine basabilirsiniz.',3500)};
speechSynthesis.speak(u);
}
function greet(withVoice=false){if(!ready)return;
phase='greeting';if(root){root.position.z=baseZ;root.scale.setScalar(baseScale)}
action('greet_02',true,1);status(greeting,6500);
if(withVoice)say(greeting);
}
controls.querySelector('#yakut-v9-greet').onclick=()=>greet(true);
controls.querySelector('#yakut-v9-hide').onclick=()=>{
hidden=!hidden;stage.style.display=hidden?'none':'block';
controls.querySelector('#yakut-v9-hide').textContent=hidden?'Göster':'✕';
if(hidden){window.speechSynthesis?.cancel();speaking=false;caption.classList.remove('y-visible')}
};
async function load(){
try{
 const threeModule=await import('https://esm.sh/three@0.164.1');
 const loaderModule=await import('https://esm.sh/three@0.164.1/examples/jsm/loaders/GLTFLoader.js');
 THREE=threeModule;
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,50);
 camera.position.set(0,.5,2.7);camera.lookAt(0,.35,0);
 scene.add(new THREE.HemisphereLight(0xe8f8ff,0x23334a,2.5));
 const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-4,5,6);scene.add(light);
 const fill=new THREE.DirectionalLight(0x44bfff,1.6);fill.position.set(4,3,-3);scene.add(fill);
 const glb=await new loaderModule.GLTFLoader().loadAsync(src);
 root=glb.scene;
 const box=new THREE.Box3().setFromObject(root);
 const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 baseScale=1.50/size.y;
 root.scale.setScalar(baseScale);
 root.position.set(-center.x*baseScale,-center.y*baseScale,-center.z*baseScale);
 baseZ=root.position.z;
 root.traverse(o=>{if(o.isSkinnedMesh){o.frustumCulled=false;if(o.morphTargetDictionary?.jawOpen!==undefined)face=o}});
 scene.add(root);
 mixer=new THREE.AnimationMixer(root);
 glb.animations.forEach(c=>clips[c.name]=mixer.clipAction(c));
 mixer.addEventListener('finished',e=>{if(e.action===clips.greet_02){phase='idle';action('wait')}});
 ready=true;
 // Walk from far away, then greet silently. Browser requires a click to play voice.
 phase='walk';approach=0;root.position.z=baseZ-3.2;root.scale.setScalar(baseScale*.6);
 action('walk',false,.98);
 const clock=new THREE.Clock();
 function frame(){
  if(!stage.isConnected)return;requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),.06),r=stage.getBoundingClientRect();
  const w=Math.max(1,r.width),h=Math.max(1,r.height);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  mixer.update(dt);
  if(phase==='walk'){
   approach=Math.min(1,approach+dt/4.2);
   // ease in/out translation while preserving walking animation
   const p=approach*approach*(3-2*approach);
   root.position.z=baseZ-3.2*(1-p);
   root.scale.setScalar(baseScale*(.6+.4*p));
   if(approach>=1)greet(false);
  }
  if(face){
   const mouth=speaking?Math.pow(Math.max(0,Math.sin(performance.now()*.0158)),.55):0;
   for(const [name,i] of Object.entries(face.morphTargetDictionary)){
    const value=name==='jawOpen'?.28*mouth:name==='viseme_A'?.88*mouth:name==='viseme_O'?.16*mouth:name==='viseme_E'?.12*mouth:0;
    face.morphTargetInfluences[i]=THREE.MathUtils.damp(face.morphTargetInfluences[i],value,15,dt);
   }
  }
  renderer.render(scene,camera);
 }
 frame();
}catch(err){
 console.error('YAKUT V9 yüklenemedi:',err);
 // No fake character and no empty overlay if the GLB or CDN fails.
 stage.remove();controls.remove();caption.remove();
}}
load();
})();