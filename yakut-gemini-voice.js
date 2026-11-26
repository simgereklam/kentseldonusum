/* Play Emel recordings and synthesize answers to external questions. */
(() => {
'use strict';
if(window.YakutGeminiVoice)return;
class YakutGeminiVoice{
 constructor({endpoint,onStart=()=>{},onEnd=()=>{},onError=()=>{}}={}){
  this.endpoint=endpoint;
  this.onStart=onStart;this.onEnd=onEnd;this.onError=onError;
  this.context=null;this.analyser=null;this.output=null;this.samples=null;
  this.cache=new Map();this.recordingLoads=new Map();
  this.manifest=fetch(new URL('yakut-sesler/manifest.json?v=emel-kayitlar-20261126',location.origin+'/'),{
   signal:AbortSignal.timeout(8000)
  }).then(response=>response.ok?response.json():{}).catch(()=>({}));
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
 preloadRecording(phrase,timeout=4000){
  if(this.cache.has(phrase))return Promise.resolve(this.cache.get(phrase));
  if(this.recordingLoads.has(phrase))return this.recordingLoads.get(phrase);
  const audio=this.manifest.then(async manifest=>{
   const name=Object.hasOwn(manifest,phrase)?manifest[phrase]:'';
   if(!/^[a-f0-9]{24}\.mp3$/.test(name))return null;
   const file=new URL('yakut-sesler/'+name,location.origin+'/');
   const response=await fetch(file,{signal:AbortSignal.timeout(timeout)});
   if(!response.ok)return null;
   const buffer=await this.context.decodeAudioData(await response.arrayBuffer());
   this.cache.set(phrase,buffer);
   return buffer;
  }).catch(()=>null).finally(()=>this.recordingLoads.delete(phrase));
  this.recordingLoads.set(phrase,audio);
  return audio;
 }
 duck(){
  if(!this.playing||!this.output)return;
  const now=this.context.currentTime,gain=this.output.gain;
  gain.cancelScheduledValues(now);
  gain.setTargetAtTime(.08,now,.015);
  gain.setTargetAtTime(1,now+.85,.07);
 }
 getLevel(){
  if(!this.playing||!this.analyser)return 0;
  if(!this.samples)this.samples=new Uint8Array(this.analyser.fftSize);
  this.analyser.getByteTimeDomainData(this.samples);
  let sum=0;for(const sample of this.samples){const n=(sample-128)/128;sum+=n*n;}
  return Math.min(1,Math.sqrt(sum/this.samples.length)*6);
 }
 stop(){
  ++this.generation;
  this.controller?.abort();this.controller=null;
  for(const item of this.sources){
   try{item.source.stop()}catch(_){}
   item.finish();
  }
  this.sources.clear();
  if(this.output){
   const now=this.context.currentTime;
   this.output.gain.cancelScheduledValues(now);
   this.output.gain.setValueAtTime(1,now);
  }
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
 async speak(parts,{recordedOnly=false}={}){
  this.stop();
  const token=this.generation;
  if(!parts.length)return false;
  if(!this.ready){this.onError(new Error('AUDIO_LOCKED'));return false;}
  const controller=new AbortController();this.controller=controller;
  let started=false,success=false;
  try{
   const load=async phrase=>{
    const local=await Promise.race([this.preloadRecording(phrase,1200),new Promise(resolve=>setTimeout(()=>resolve(null),1500))]);
    if(token!==this.generation||controller.signal.aborted)return null;
    if(local)return local;
    // Missing or unavailable recording: use the existing Emel live service.
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
   const lookahead=Math.min(parts.length,8);
   for(let i=0;i<lookahead;i++)prefetch(i);
   for(let i=0;i<parts.length;i++){
    if(token!==this.generation)return false;
    const result=await pending.get(i);
    pending.delete(i);
    if(result.error)throw result.error;
    const buffer=result.buffer;
    if(token!==this.generation||!buffer)return false;
    prefetch(i+lookahead);
    if(!this.analyser){
      this.analyser=this.context.createAnalyser();
      this.analyser.fftSize=512;
      this.output=this.context.createGain();
      this.analyser.connect(this.output);
      this.output.connect(this.context.destination);
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
