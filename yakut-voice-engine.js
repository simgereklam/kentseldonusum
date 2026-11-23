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
  try{this.selectedVoiceName=localStorage.getItem('yakutPreferredVoice')||'';}catch(_){this.selectedVoiceName='';}
  this.refreshVoices();
  if(this.synth) this.synth.addEventListener?.('voiceschanged',()=>this.refreshVoices());
 }
 getTurkishVoices(){
  this.voices=this.synth?.getVoices?.()||[];
  return this.voices.filter(v=>/^tr(?:-|$)/i.test(v.lang||''));
 }
 refreshVoices(){
  const tr=this.getTurkishVoices();
  const female=/(?:^|[\s_(-])(?:female|woman|kadın|selin|emel|ayşe|yelda|cemre|seda|zeynep|ipek|gamze)(?:$|[\s_)-])/i;
  const male=/(?:^|[\s_(-])(?:male|man|erkek)(?:$|[\s_)-])/i;
  const score=v=>(female.test(v.name)?100:0)-(male.test(v.name)?200:0)
   +(/natural|neural|enhanced/i.test(v.name)?15:0)+(v.localService?4:0);
  this.voice=tr.find(v=>v.name===this.selectedVoiceName)||
   tr.sort((a,b)=>score(b)-score(a))[0]||null;
  return this.voice;
 }
 chooseVoice(name){
  const voice=this.getTurkishVoices().find(v=>v.name===name);
  if(!voice)return false;
  this.selectedVoiceName=name;
  try{localStorage.setItem('yakutPreferredVoice',name);}catch(_){}
  this.voice=voice;
  return true;
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
 split(text,max=220){
  const cleaned=String(text||'').replace(/\s+/g,' ').trim();
  if(!cleaned)return [];
  const sentences=cleaned.match(/[^.!?…]+(?:[.!?…]+|$)/g)||[cleaned];
  const chunks=[];
  let piece='';
  const push=()=>{if(piece.trim())chunks.push(piece.trim());piece='';};
  for(const sentence of sentences){
   const words=sentence.trim().split(/\s+/).filter(Boolean);
   if(!words.length)continue;
   for(const word of words){
    // Do not split Turkish words; exceptionally long tokens are spoken intact.
    if(piece&&(piece.length+word.length+1>max))push();
    piece=piece?piece+' '+word:word;
   }
   // End each sentence as one or more utterances, avoiding arbitrary joins.
   push();
  }
  return chunks;
 }
 stop(){
  this.active++;
  const current=this.current;this.current=null;
  if(current){clearTimeout(current.timer);clearTimeout(current.nextTimer);current.resolve(false);}
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
   const state={resolve,timer:null,nextTimer:null};this.current=state;let index=0,started=false;
   const finish=ok=>{
    if(generation!==this.active||this.current!==state)return;
    clearTimeout(state.timer);clearTimeout(state.nextTimer);this.current=null;this.speaking=false;this.onLevel(0);
    this.onEnd(ok);resolve(ok);
   };
   const next=()=>{
    if(generation!==this.active)return;
    if(index>=chunks.length){finish(true);return;}
    const utterance=new SpeechSynthesisUtterance(chunks[index++]);
    utterance.lang='tr-TR';utterance.rate=.88;utterance.pitch=1;utterance.volume=1;
    if(voice)utterance.voice=voice;
    let done=false;
    const advance=()=>{if(done||generation!==this.active)return;done=true;
     clearTimeout(state.timer);
     // Some Android TTS backends drop the first syllable of immediate next utterances.
     state.nextTimer=setTimeout(next,100);
    };
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
