/* Yakut Aoede audio via local MP3 recordings or the Gemini Worker. */
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
 split(text,max=1400){
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
 async playRecordings(urls){
  this.stop();
  const token=this.generation;
  const controller=new AbortController();
  this.controller=controller;
  try{
   const buffers=await Promise.all(urls.map(async url=>{
    const response=await fetch(url,{signal:controller.signal});
    if(!response.ok)throw new Error('YAKUT_RECORDING_HTTP_'+response.status);
    return this.context.decodeAudioData(await response.arrayBuffer());
   }));
   if(token!==this.generation)return false;
   if(!this.analyser){
    this.analyser=this.context.createAnalyser();
    this.analyser.fftSize=512;
    this.analyser.connect(this.context.destination);
   }
   let at=this.context.currentTime+.02;
   const played=buffers.map(buffer=>new Promise(finish=>{
    const source=this.context.createBufferSource();
    source.buffer=buffer;source.connect(this.analyser);
    const entry={source,finish};
    this.sources.add(entry);
    source.onended=()=>{this.sources.delete(entry);finish();};
    source.start(at);at+=buffer.duration;
   }));
   this.playing=true;this.onStart();
   await Promise.all(played);
   return token===this.generation;
  }catch(error){
   if(token===this.generation)this.onError(error);
   return false;
  }finally{
   if(token===this.generation){this.controller=null;this.playing=false;}
  }
 }
 async speak(text){
  this.stop();
  const token=this.generation,parts=this.split(text);
  if(!parts.length)return false;
  if(!this.ready){this.onError(new Error('AUDIO_LOCKED'));return false;}
  const controller=new AbortController();this.controller=controller;
  let started=false,success=false;
  let timeout=null;
  try{
   for(const phrase of parts){
    if(token!==this.generation)return false;
    timeout=setTimeout(()=>controller.abort(),65000);
    const response=await fetch(new URL('/live',this.endpoint),{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({readAloud:phrase}),signal:controller.signal
    });
    if(!response.ok)throw new Error('GEMINI_VOICE_HTTP_'+response.status);
    if(!response.body||!response.headers.get('Content-Type')?.includes('application/x-ndjson'))
     throw new Error('GEMINI_AUDIO_FORMAT');
    const reader=response.body.getReader(),decoder=new TextDecoder();
    let pending='',doneFlag=false,nextAt=this.context.currentTime;
    const playbacks=[];
    const consume=line=>{
     if(!line)return;
     const frame=JSON.parse(line);
     if(frame.error)throw new Error(String(frame.error));
     if(frame.done){doneFlag=true;return;}
     if(!frame.audio)return;
     const raw=atob(frame.audio);
     if(raw.length%2)throw new Error('GEMINI_PCM_LENGTH');
     const count=raw.length/2;
     if(!count)return;
     const buffer=this.context.createBuffer(1,count,24000);
     const floats=buffer.getChannelData(0);
     for(let i=0;i<count;i++){
      const sample=raw.charCodeAt(i*2)|(raw.charCodeAt(i*2+1)<<8);
      floats[i]=(sample<<16>>16)/32768;
     }
     if(!this.analyser){
      this.analyser=this.context.createAnalyser();
      this.analyser.fftSize=512;
      this.analyser.connect(this.context.destination);
     }
     const source=this.context.createBufferSource();
     source.buffer=buffer;source.connect(this.analyser);
     const at=Math.max(nextAt,this.context.currentTime+.02);
     nextAt=at+buffer.duration;
     let settled=false,finish;
     const played=new Promise(resolve=>{finish=()=>{if(settled)return;settled=true;resolve();};});
     const entry={source,finish};
     this.sources.add(entry);
     source.onended=()=>{this.sources.delete(entry);finish();};
     source.start(at);
     playbacks.push(played);
     if(!started){started=true;this.playing=true;this.onStart();}
    };
    try{
     for(;;){
      const {value,done}=await reader.read();
      if(token!==this.generation)return false;
      if(done)break;
      pending+=decoder.decode(value,{stream:true});
      let idx;
      while((idx=pending.indexOf('\n'))>=0){
       const line=pending.slice(0,idx).trim();pending=pending.slice(idx+1);
       consume(line);
      }
     }
     pending+=decoder.decode();
     if(pending.trim())consume(pending.trim());
    }finally{
     try{reader.releaseLock()}catch(_){}
    }
    clearTimeout(timeout);timeout=null;
    if(!doneFlag)throw new Error('GEMINI_AUDIO_INCOMPLETE');
    // Wait for the entire scheduled audio, not just last voice frame or HTTP body.
    await Promise.all(playbacks);
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
