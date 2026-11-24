/* Yakut audio is generated exclusively by Emel via the protected Worker. */
(() => {
'use strict';
if(window.YakutGeminiVoice)return;
class YakutGeminiVoice{
 constructor({endpoint,onStart=()=>{},onEnd=()=>{},onError=()=>{}}={}){
  this.endpoint=endpoint;
  this.onStart=onStart;this.onEnd=onEnd;this.onError=onError;
  this.context=null;this.analyser=null;this.samples=null;
  this.generation=0;this.controller=null;this.sources=new Set();this.playing=false;
 }
 unlock(){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return Promise.resolve(false);
  try{
   if(!this.context)this.context=new Audio();
   const resume=this.context.state==='running'?Promise.resolve():this.context.resume();
   return Promise.resolve(resume).then(()=>this.context.state==='running').catch(()=>false);
  }catch(error){this.onError(error);return Promise.resolve(false);}
 }
 get ready(){return this.context?.state==='running';}
 getLevel(){
  if(!this.playing||!this.analyser)return 0;
  if(!this.samples)this.samples=new Uint8Array(this.analyser.fftSize);
  this.analyser.getByteTimeDomainData(this.samples);
  let sum=0;for(const sample of this.samples){const n=(sample-128)/128;sum+=n*n;}
  return Math.min(1,Math.sqrt(sum/this.samples.length)*6);
 }
 split(text,max=450){
  const words=String(text||'').trim().split(/\s+/).filter(Boolean);
  const pieces=[];let current='';
  for(const word of words){
   if(current&&current.length+word.length+1>max){pieces.push(current);current='';}
   current=current?current+' '+word:word;
  }
  if(current)pieces.push(current);
  return pieces;
 }
 stop(){
  ++this.generation;
  this.controller?.abort();this.controller=null;
  for(const item of this.sources){
   try{item.source.stop()}catch(_){}
   item.finish();
  }
  this.sources.clear();
  this.playing=false;this.onEnd(false);
 }
 async speak(text){
  this.stop();
  const token=this.generation,parts=this.split(text,180);
  if(!parts.length)return false;
  if(!this.ready){this.onError(new Error('AUDIO_LOCKED'));return false;}
  const controller=new AbortController();this.controller=controller;
  let started=false,success=false;
  let timeout=null;
  try{
   const load=async phrase=>{
    const response=await fetch(new URL('/live',this.endpoint),{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({readAloud:phrase}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(65000)])
    });
    if(!response.ok)throw new Error('EMEL_VOICE_HTTP_'+response.status);
    if(!response.headers.get('Content-Type')?.includes('audio/mpeg'))throw new Error('EMEL_AUDIO_FORMAT');
    const bytes=await response.arrayBuffer();
    if(token!==this.generation)return null;
    return this.context.decodeAudioData(bytes);
   };
   let next=load(parts[0]).then(buffer=>({buffer}),error=>({error}));
   for(let i=0;i<parts.length;i++){
    if(token!==this.generation)return false;
    const result=await next;
    if(result.error)throw result.error;
    const buffer=result.buffer;
    if(token!==this.generation||!buffer)return false;
    if(i+1<parts.length)next=load(parts[i+1]).then(buffer=>({buffer}),error=>({error}));
    if(!this.analyser){
      this.analyser=this.context.createAnalyser();
      this.analyser.fftSize=512;
      this.analyser.connect(this.context.destination);
    }
    const source=this.context.createBufferSource();
    source.buffer=buffer;source.connect(this.analyser);
    let finish;
    const played=new Promise(resolve=>{finish=resolve;});
    const entry={source,finish};this.sources.add(entry);
    source.onended=()=>{this.sources.delete(entry);finish();};
    source.start();
    if(!started){started=true;this.playing=true;this.onStart();}
    await played;
   }
   success=token===this.generation&&started;
   return success;
  }catch(error){
   if(token===this.generation&&!controller.signal.aborted)this.onError(error);
   return false;
  }finally{
   clearTimeout(timeout);
   if(token===this.generation){
    if(!success){
     for(const item of this.sources){try{item.source.stop()}catch(_){}item.finish();}
     this.sources.clear();
    }
    this.controller=null;this.playing=false;this.onEnd(success);
   }
  }
 }
}
window.YakutGeminiVoice=YakutGeminiVoice;
})();
