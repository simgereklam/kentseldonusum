'use strict';
const phonemizerRoot='https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/';
const runtimeRoot='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.3/dist/';
const modelRoot='https://huggingface.co/ilkeraktuna/piper-tts-tr-ilkiz-medium/resolve/ecf42bcc271974d000542f5868d81bbcf4e4ec0f/';
let engine;
let busy=false;

async function checkedFetch(url) {
 const response=await fetch(url);
 if(!response.ok)throw new Error('Ses dosyası yüklenemedi ('+response.status+').');
 return response;
}

async function loadEngine() {
 importScripts(runtimeRoot+'ort.wasm.min.js',phonemizerRoot+'piper_phonemize.js');
 ort.env.wasm.wasmPaths=runtimeRoot;
 ort.env.wasm.numThreads=1;
 const messages=[];
 const [model,config,phonemizer]=await Promise.all([
  checkedFetch(modelRoot+'ilkiz.onnx').then(response=>response.arrayBuffer()),
  checkedFetch(modelRoot+'ilkiz.onnx.json').then(response=>response.json()),
  createPiperPhonemize({
   locateFile:file=>phonemizerRoot+file,
   print:line=>messages.push(JSON.parse(line)),
   printErr:line=>console.warn(line)
  })
 ]);
 const session=await ort.InferenceSession.create(model,{executionProviders:['wasm']});
 return {messages,config,phonemizer,session};
}

async function speak(text) {
 const {messages,config,phonemizer,session}=await (engine ||= loadEngine().catch(error=>{
  engine=null;
  throw error;
 }));
 messages.length=0;
 const status=phonemizer.callMain(['--espeak_data','/espeak-ng-data','--language',config.espeak.voice,
  '--input',JSON.stringify([{text}])]);
 if(status!==0||!messages[0]?.phoneme_ids?.length)throw new Error('Türkçe ses birimleri oluşturulamadı.');
 const eos=config.phoneme_id_map.$[0];
 const ids=messages[0].phoneme_ids;
 const scales=config.inference;
 const sampleRate=config.audio.sample_rate;
 let start=0;
 for(let end=0;end<ids.length;end++){
  if(ids[end]!==eos&&end+1!==ids.length)continue;
  const sentence=ids.slice(start,end+1);
  start=end+1;
  const feeds={
   input:new ort.Tensor('int64',BigInt64Array.from(sentence,BigInt),[1,sentence.length]),
   input_lengths:new ort.Tensor('int64',BigInt64Array.of(BigInt(sentence.length)),[1]),
   scales:new ort.Tensor('float32',Float32Array.of(scales.noise_scale,scales.length_scale,scales.noise_w),[3])
  };
  const {output}=await session.run(feeds);
  const samples=Float32Array.from(output.data);
  if(!samples.length)throw new Error('Ses verisi boş geldi.');
  postMessage({samples,sampleRate},[samples.buffer]);
 }
}

self.onmessage=async ({data})=>{
 if(busy||typeof data?.text!=='string'||!data.text.trim()||data.text.length>2000){
  postMessage({error:'Ses isteği geçersiz veya motor meşgul.'});
  return;
 }
 busy=true;
 try { await speak(data.text.trim()); postMessage({done:true}); }
 catch(error){postMessage({error:error.message||'Ses üretilemedi.'});}
 finally {busy=false;}
};
