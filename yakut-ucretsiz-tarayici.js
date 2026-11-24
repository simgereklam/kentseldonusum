/* Yakut local Piper female Turkish voice proof-of-concept.
   100% local synthesis after static model download, no paid TTS endpoint. */
(()=>{
'use strict';
const BASE='https://piper-tts.github.io/vendor/';
const MODEL='https://huggingface.co/ilkeraktuna/piper-tts-tr-ilkiz-medium/resolve/main/';
const SCRIPT_URLS=[
 BASE+'ort/ort.wasm.min.js',
 BASE+'phonemize/piper_phonemize.js'
];
const $=s=>document.querySelector(s);
const status=$('#status'),output=$('#answer'),input=$('#question');
let context=null,session=null,phonemizer=null,configuration=null,voicePromise=null,activeSource=null,job=0;
function message(text){status.textContent=text;}
async function unlock(){
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC)throw new Error('Bu tarayıcı Web Audio desteklemiyor.');
 context??=new AC();
 if(context.state!=='running')await context.resume();
 if(context.state!=='running')throw new Error('Sesi açmak için düğmeye yeniden dokunun.');
}
function loadScript(url){
 return new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=url;script.onload=resolve;
  script.onerror=()=>reject(new Error('Ücretsiz ses kütüphanesi indirilemedi: '+url));
  document.head.append(script);
 });
}
async function checked(url,type='arrayBuffer'){
 const response=await fetch(url);
 if(!response.ok)throw new Error('Ses modeli indirilemedi: HTTP '+response.status);
 return type==='json'?response.json():response.arrayBuffer();
}
async function loadVoice(){
 if(voicePromise)return voicePromise;
 voicePromise=(async()=>{
  message('Türkçe kadın sesi hazırlanıyor. İlk kullanımda yaklaşık 64 MB indirilecek.');
  for(const url of SCRIPT_URLS)await loadScript(url);
  if(!window.ort||!window.createPiperPhonemize)throw new Error('Ses bileşenleri yüklenmedi.');
  ort.env.wasm.wasmPaths=BASE+'ort/';
  ort.env.wasm.numThreads=1; // GitHub Pages has no required isolation headers.
  const [cfg,model]=await Promise.all([
   checked(MODEL+'ilkiz.onnx.json','json'),
   checked(MODEL+'ilkiz.onnx')
  ]);
  configuration=cfg;
  const rows=[];
  phonemizer=await createPiperPhonemize({
   print:line=>rows.push(JSON.parse(line)),
   printErr:line=>console.warn('Piper phonemizer',line),
   locateFile:file=>BASE+'phonemize/'+file
  });
  session=await ort.InferenceSession.create(model,{executionProviders:['wasm']});
  const voice=cfg.espeak?.voice||'tr';
  message('Hazır: Türkçe kadın sesi cihazınızda çalışacak. ('+voice+')');
  return {rows,voice};
 })().catch(e=>{voicePromise=null;throw e;});
 return voicePromise;
}
function stop(){
 ++job;
 if(activeSource){try{activeSource.stop()}catch(_){}activeSource=null;}
}
function phonemesToSpeech(sentence,rows,voice){
 rows.length=0;
 const rc=phonemizer.callMain([
  '--espeak_data','/espeak-ng-data','--language',voice,
  '--input',JSON.stringify([{text:sentence}])
 ]);
 if(rc!==0||!rows.length)throw new Error('Türkçe telaffuz dönüştürülemedi.');
 const ids=rows.flatMap(row=>row.phoneme_ids||[]);
 if(!ids.length)throw new Error('Ses için fonem bulunamadı.');
 return ids;
}
async function speak(text){
 stop();
 const myJob=job;
 await unlock();
 const {rows,voice}=await loadVoice();
 if(myJob!==job)return;
 const sentences=String(text||'').match(/[^.!?]+[.!?]?/g)||[text];
 const sampleRate=configuration.audio?.sample_rate||22050;
 const inf=configuration.inference||{};
 for(const sentence of sentences.map(x=>x.trim()).filter(Boolean)){
  if(myJob!==job)return;
  message('Yakut konuşuyor…');
  const ids=phonemesToSpeech(sentence,rows,voice);
  const feeds={
   input:new ort.Tensor('int64',BigInt64Array.from(ids.map(BigInt)),[1,ids.length]),
   input_lengths:new ort.Tensor('int64',BigInt64Array.from([BigInt(ids.length)]),[1]),
   scales:new ort.Tensor('float32',Float32Array.from([
    inf.noise_scale??0.667,inf.length_scale??1.04,inf.noise_w??0.8
   ]),[3])
  };
  if(configuration.num_speakers>1)feeds.sid=new ort.Tensor('int64',BigInt64Array.from([0n]),[1]);
  const result=await session.run(feeds);
  if(myJob!==job)return;
  const samples=result.output?.data;
  if(!samples?.length)throw new Error('Ses modeli boş yanıt verdi.');
  const buffer=context.createBuffer(1,samples.length,sampleRate);
  buffer.copyToChannel(samples,0);
  await new Promise(resolve=>{
   if(myJob!==job){resolve();return;}
   const src=context.createBufferSource();
   src.buffer=buffer;src.connect(context.destination);
   activeSource=src;
   src.onended=()=>{if(activeSource===src)activeSource=null;resolve();};
   src.start();
  });
 }
 if(myJob===job)message('Konuşma tamamlandı. Yeni bir soru sorabilirsiniz.');
}
function localAnswer(query){
 const q=query.toLocaleLowerCase('tr-TR');
 if(/merhaba|selam|günaydın/.test(q))return 'Merhaba, ben Kumtaş İnşaat asistanı Yakut. Size nasıl yardımcı olabilirim?';
 if(/kim(sin)?|adın ne|yakut/.test(q))return 'Ben Yakut. Kumtaş İnşaat ve kentsel dönüşüm hakkında yardımcı olabilirim.';
 if(/kentsel dönüşüm nedir|dönüşüm ne demek/.test(q))return 'Kentsel dönüşüm, riskli yapıların güvenli ve güncel standartlara uygun biçimde yenilenmesi sürecidir. Kesin hak ve koşullar yapıya ve mevzuata göre değişir.';
 if(/iletişim|adres|telefon/.test(q))return 'İletişim için sitemizin iletişim sayfasını açabilirsiniz.';
 return null;
}
async function wikipedia(query){
 const url=new URL('https://tr.wikipedia.org/w/api.php');
 url.search=new URLSearchParams({
  action:'query',generator:'search',gsrsearch:query,gsrlimit:'3',
  prop:'extracts',exintro:'1',explaintext:'1',exsentences:'3',
  format:'json',origin:'*'
 });
 const response=await fetch(url);
 if(!response.ok)throw new Error('Ücretsiz Wikipedia araması HTTP '+response.status);
 const data=await response.json();
 const pages=Object.values(data.query?.pages||{}).sort((a,b)=>(a.index||99)-(b.index||99));
 const valid=pages.find(p=>p.extract?.trim());
 if(!valid)return null;
 return {answer:(valid.title+'. '+valid.extract).replace(/\s+/g,' ').slice(0,900),url:'https://tr.wikipedia.org/?curid='+valid.pageid};
}
$('#start').addEventListener('click',async()=>{
 try{await unlock();await loadVoice();await speak('Merhaba. Ben Yakut. Türkçe kadın sesim cihazınızda çalışıyor.');}
 catch(e){message('Başlatma hatası: '+e.message);}
});
$('#ask').addEventListener('click',async()=>{
 const q=input.value.trim();if(!q)return;
 output.textContent='Yanıt hazırlanıyor…';
 $('#source').hidden=true;
 try{
  let answer=localAnswer(q),source=null;
  if(!answer){
   message('Ücretsiz Wikipedia araması yapılıyor…');
   const hit=await wikipedia(q);
   if(hit){answer=hit.answer;source=hit.url;}
   else answer='Bu soruyla ilgili güvenilir bilgi bulamadım. Genel web araması ve güncel haberler için ayrıca bir hizmet gerekir.';
  }
  output.textContent=answer;
  if(source){const a=$('#source');a.href=source;a.hidden=false;}
  await speak(answer);
 }catch(e){message('Hata: '+e.message);output.textContent='Yanıt seslendirilemedi: '+e.message;}
});
$('#stop').addEventListener('click',()=>{stop();message('Yakut sustu.');});
input.addEventListener('keydown',e=>{if(e.key==='Enter')$('#ask').click();});
})();