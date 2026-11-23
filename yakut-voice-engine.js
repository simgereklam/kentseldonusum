/* YakutVoiceEngine: browser-local Turkish speech, no speech API calls. */
(() => {
'use strict';
if (window.YakutVoiceEngine) return;
class YakutVoiceEngine {
 constructor({onStart=()=>{},onEnd=()=>{},onError=()=>{},onLevel=()=>{}}={}) {
  this.synth=window.speechSynthesis||null;
  this.context=null;this.voice=null;this.unlocked=false;
  this.active=0;this.current=null;this.speaking=false;this.voices=[];
  this.onStart=onStart;this.onEnd=onEnd;this.onError=onError;this.onLevel=onLevel;
  this.toneEnabled=false;
  this.refreshVoices();
  if(this.synth) this.synth.addEventListener?.('voiceschanged',()=>this.refreshVoices());
 }
 refreshVoices(){
  this.voices=this.synth?.getVoices?.()||[];
  const tr=this.voices.filter(v=>/^tr(?:-|$)/i.test(v.lang||''));
  const female=/female|woman|kadın|selin|emel|ayşe|yelda|cemre|seda|zeynep|ipek|gamze/i;
  const unwanted=/male|erkek|robot|espeak/i;
  const score=v=>(/^tr-TR$/i.test(v.lang)?100: /^tr/i.test(v.lang)?80:-300)
   +(female.test(v.name)?28:0)+(v.localService?8:0)
   +(/natural|neural|enhanced|premium/i.test(v.name)?15:0)
   -(unwanted.test(v.name)?40:0);
  this.voice=tr.sort((a,b)=>score(b)-score(a))[0]||null;
  return this.voice;
 }
 async unlock(){
  this.unlocked=true;
  this.refreshVoices();
  const AC=window.AudioContext||window.webkitAudioContext;
  if(AC){
   try{
    if(!this.context)this.context=new AC();
    if(this.context.state==='suspended')await this.context.resume();
   }catch(_){}
  }
  return !!this.synth;
 }
 playTone(frequency=660,duration=.085){
  if(!this.toneEnabled||!this.context||this.context.state!=='running')return;
  const now=this.context.currentTime;
  const osc=this.context.createOscillator(),gain=this.context.createGain();
  osc.type='sine';osc.frequency.value=frequency;
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(.045,now+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.connect(gain).connect(this.context.destination);
  osc.start(now);osc.stop(now+duration+.01);
 }
 split(text,max=165){
  const words=String(text).replace(/\s+/g,' ').trim().split(' ');
  const chunks=[];let current='';
  for(const word of words){
   if(word.length>max){
    if(current){chunks.push(current);current='';}
    for(let i=0;i<word.length;i+=max)chunks.push(word.slice(i,i+max));
   }else if(!current)current=word;
   else if((current+' '+word).length<=max)current+=' '+word;
   else{chunks.push(current);current=word;}
  }
  if(current)chunks.push(current);
  return chunks;
 }
 stop(){
  this.active++;
  const current=this.current;this.current=null;
  if(current){clearTimeout(current.timer);current.resolve(false);}
  if(this.synth){try{this.synth.cancel()}catch(_){}}
  if(this.speaking){this.speaking=false;this.onEnd(false);}
  this.onLevel(0);
 }
 speak(text){
  this.stop();
  if(!this.synth||typeof window.SpeechSynthesisUtterance!=='function'){
   this.onError('Tarayıcı konuşma sentezini desteklemiyor.');
   return Promise.resolve(false);
  }
  const chunks=this.split(text);
  if(!chunks.length)return Promise.resolve(false);
  const generation=this.active;
  const voice=this.refreshVoices();
  return new Promise(resolve=>{
   const state={resolve,timer:null};this.current=state;let index=0,started=false;
   const finish=ok=>{
    if(generation!==this.active||this.current!==state)return;
    clearTimeout(state.timer);this.current=null;this.speaking=false;this.onLevel(0);
    this.onEnd(ok);resolve(ok);
   };
   const next=()=>{
    if(generation!==this.active)return;
    if(index>=chunks.length){finish(true);return;}
    const utterance=new SpeechSynthesisUtterance(chunks[index++]);
    utterance.lang='tr-TR';utterance.rate=.98;utterance.pitch=1.04;utterance.volume=1;
    if(voice)utterance.voice=voice;
    let done=false;
    const advance=()=>{if(done||generation!==this.active)return;done=true;clearTimeout(state.timer);next();};
    utterance.onstart=()=>{
     if(generation!==this.active)return;
     if(!started){started=true;this.speaking=true;this.onStart();}
     this.onLevel(.55);
    };
    utterance.onend=advance;
    utterance.onerror=e=>{
     if(generation!==this.active||done)return;
     const error=e.error||'speech-error';
     if(error==='canceled'||error==='interrupted'){finish(false);return;}
     this.onError(error);
     finish(false);
    };
    // A missing browser event must never leave Yakut permanently locked.
    state.timer=setTimeout(()=>{this.onError('speech-timeout');finish(false);},Math.max(12000,utterance.text.length*260));
    try{this.synth.speak(utterance);}catch(e){this.onError(e.message);finish(false);}
   };
   next();
  });
 }
}
window.YakutVoiceEngine=YakutVoiceEngine;
})();
