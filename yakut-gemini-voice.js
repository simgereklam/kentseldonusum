/* Yakut audio is generated exclusively by Emel via the protected Worker. */
(() => {
'use strict';
if(window.YakutGeminiVoice)return;
class YakutGeminiVoice{
 constructor({endpoint,onStart=()=>{},onEnd=()=>{},onError=()=>{}}={}){
  this.endpoint=endpoint;
  this.onStart=onStart;this.onEnd=onEnd;this.onError=onError;
  this.context=null;this.analyser=null;this.samples=null;
  this.cache=new Map();
  this.manifest=fetch(new URL('yakut-sesler/manifest.json',location.origin+'/'),{signal:AbortSignal.timeout(2500)}).then(r=>r.ok?r.json():{}).catch(()=>({}));
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
 compactPauses(buffer){
  const rate=buffer.sampleRate,step=Math.max(1,Math.floor(rate*.01)),channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
  const cuts=[];let quiet=-1;
  for(let p=0;p<buffer.length;p+=step){
   let peak=0;for(const ch of channels)for(let j=p;j<Math.min(p+step,buffer.length);j++)peak=Math.max(peak,Math.abs(ch[j]));
   if(peak<0.003){if(quiet<0)quiet=p;}else if(quiet>=0){
    if(quiet>0&&p-quiet>rate*.45)cuts.push([quiet+Math.floor(rate*.12),p-Math.floor(rate*.12)]);
    quiet=-1;
   }
  }
  if(!cuts.length)return buffer;
  const out=this.context.createBuffer(buffer.numberOfChannels,buffer.length-cuts.reduce((n,[a,b])=>n+b-a,0),rate);
  for(let c=0;c<channels.length;c++){let from=0,to=0;const dest=out.getChannelData(c);for(const [a,b] of cuts){dest.set(channels[c].subarray(from,a),to);to+=a-from;from=b;}dest.set(channels[c].subarray(from),to);}
  return out;
 }
 async speak(text,{beforePlayback,chunkSize=180,intro=""}={}){
  this.stop();
  const token=this.generation,parts=[...(intro?[intro]:[]),...this.split(text,chunkSize)];
  if(!parts.length)return false;
  if(!this.ready){this.onError(new Error('AUDIO_LOCKED'));return false;}
  const controller=new AbortController();this.controller=controller;
  let started=false,success=false;
  let timeout=null;
  try{
   const load=async phrase=>{
    if(this.cache.has(phrase))return this.cache.get(phrase);
    const manifest=await this.manifest;
    let local=null;
    if(manifest[phrase])local=await fetch(new URL('yakut-sesler/'+manifest[phrase],location.origin+'/'),{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(3000)])}).catch(()=>null);
    if(local?.ok){try{const b=await this.context.decodeAudioData(await local.arrayBuffer());if(token!==this.generation)return null;this.cache.set(phrase,b);return b;}catch(_){local=null;}}
    if(controller.signal.aborted)return null;
    const response=await fetch(new URL('/live',this.endpoint),{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({readAloud:phrase}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(65000)])
    });
    if(!response.ok)throw new Error('EMEL_VOICE_HTTP_'+response.status);
    if(!response.headers.get('Content-Type')?.includes('audio/mpeg'))throw new Error('EMEL_AUDIO_FORMAT');
    const bytes=await response.arrayBuffer();
    if(token!==this.generation)return null;
    const buffer=this.compactPauses(await this.context.decodeAudioData(bytes));
    if(this.cache.size>=12)this.cache.delete(this.cache.keys().next().value);
    this.cache.set(phrase,buffer);return buffer;
   };
   const pending=new Map();
   const prefetch=i=>{if(i<parts.length&&!pending.has(i))pending.set(i,load(parts[i]).then(buffer=>({buffer}),error=>({error})));};
   prefetch(0);prefetch(1);
   for(let i=0;i<parts.length;i++){
    if(token!==this.generation)return false;
    const result=await pending.get(i);
    pending.delete(i);
    if(result.error)throw result.error;
    const buffer=result.buffer;
    if(token!==this.generation||!buffer)return false;
    prefetch(i+1);prefetch(i+2);
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
    if(beforePlayback&&i===(intro?1:0)){
     await beforePlayback();
     if(token!==this.generation||controller.signal.aborted)return false;
    }
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
   controller.abort();
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
