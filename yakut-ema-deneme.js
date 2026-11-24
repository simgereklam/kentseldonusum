/* Yakut EMA Lightning trial, entirely static/self-hosted speech. MIT license for wrapper; EMA model Apache-2.0. */
import { EMA, RATE, wavBlob } from './assets/yakut/ema/tts.js';
const $=id=>document.getElementById(id);
const status=$('status'),output=$('answer'),input=$('question'),player=$('replay'),source=$('source');
let engine=null,loading=null,context=null,playId=0,activeSources=new Set(),lastObjectUrl=null;
const modelRoot=new URL('./assets/yakut/ema/models/',import.meta.url).href;
function setStatus(message){status.textContent=message;}
function stop(){
 playId++;
 for(const src of activeSources){try{src.stop()}catch(_){}}
 activeSources.clear();
 try{player.pause()}catch(_){}
}
async function unlock(){
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC)throw Error('Tarayıcı Web Audio özelliğini desteklemiyor.');
 if(!context)context=new AC();
 if(context.state!=='running')await context.resume();
 if(context.state!=='running')throw Error('Telefon ses oynatmayı engelledi. Ses düğmesine yeniden dokunun.');
}
async function prepare(){
 if(engine)return engine;
 if(loading)return loading;
 loading=(async()=>{
  setStatus('EMA Lightning modeli kendi GitHub sitemizden hazırlanıyor…');
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  const backend=(!ios&&navigator.gpu)?'webgpu':'wasm';
  try{
   engine=await EMA.load(backend,modelRoot,(part,progress)=>setStatus('EMA hazırlanıyor: '+part+' '+Math.round(progress*100)+'%'),'fp32');
  }catch(error){
   if(backend==='wasm')throw error;
   setStatus('Ekran kartı modunda sorun var, işlemci moduna geçiliyor…');
   engine=await EMA.load('wasm',modelRoot,(part,progress)=>setStatus('EMA hazırlanıyor: '+part+' '+Math.round(progress*100)+'%'),'fp32');
  }
  setStatus('Kadın sesi hazır. Artık aynı sesle yanıt oluşturabilirim.');
  return engine;
 })().catch(error=>{loading=null;throw error;});
 return loading;
}
async function speak(text){
 stop();const token=playId;
 await unlock();
 const model=await prepare();
 if(token!==playId)return;
 const speed=Number($('speed').value)||1;
 const chunks=[];
 try{
  setStatus('EMA metni sese dönüştürüyor…');
  for await(const samples of model.stream(text,{speed,seed:32})){
   if(token!==playId)return;
   if(samples.length)chunks.push(new Float32Array(samples));
  }
  if(token!==playId)return;
  const total=chunks.reduce((n,p)=>n+p.length,0);
  if(!total)throw Error('EMA ses verisi oluşturamadı.');
  // Pre-render all chunks; one playback source avoids mid-sentence generation gaps.
  const buffer=context.createBuffer(1,total,RATE);
  const output=buffer.getChannelData(0);
  let offset=0;for(const part of chunks){output.set(part,offset);offset+=part.length;}
  if(lastObjectUrl)URL.revokeObjectURL(lastObjectUrl);
  lastObjectUrl=URL.createObjectURL(wavBlob(chunks));
  player.src=lastObjectUrl;player.hidden=false;player.load();
  const src=context.createBufferSource();
  src.buffer=buffer;src.connect(context.destination);
  src.onended=()=>{activeSources.delete(src);if(token===playId)setStatus('Konuşma tamamlandı. Yeniden dinlemek için ▶ Oynat düğmesine bas.');};
  activeSources.add(src);
  setStatus('EMA konuşuyor…');
  src.start();
 }catch(e){
  if(token===playId)throw e;
 }
}
const localAnswers=[
 [/merhaba|selam|günaydın/i,'Merhaba, hoş geldiniz. Ben Kumtaş İnşaat asistanı Yakut. Size nasıl yardımcı olabilirim?'],
 [/kimsin|adın ne|yakut kim/i,'Ben Yakut. Kumtaş İnşaat için hazırlanmış sesli yardımcıyım.'],
 [/kentsel dönüşüm nedir|kentsel dönüşüm ne demek/i,'Kentsel dönüşüm, riskli yapıların güvenli biçimde yenilenmesidir. Haklar ve süreç, projenin özelliklerine göre değişir.'],
 [/iletişim|telefon numara|adres/i,'Kumtaş İnşaat iletişim bilgilerine sitemizin iletişim sayfasından ulaşabilirsiniz.']
];
async function wiki(q){
 const url=new URL('https://tr.wikipedia.org/w/api.php');
 url.search=new URLSearchParams({action:'query',generator:'search',gsrsearch:q,gsrlimit:'3',prop:'extracts',exintro:'1',explaintext:'1',exsentences:'2',format:'json',origin:'*'});
 const response=await fetch(url);
 if(!response.ok)throw Error('Ücretsiz Wikipedia araması yanıt vermedi.');
 const data=await response.json();
 const pages=Object.values(data.query?.pages||{}).sort((a,b)=>(a.index??99)-(b.index??99));
 const item=pages.find(x=>x.extract?.trim());
 return item?{text:(item.title+'. '+item.extract).replace(/\s+/g,' ').slice(0,650),url:'https://tr.wikipedia.org/?curid='+item.pageid}:null;
}
$('start').addEventListener('click',async()=>{
 try{await speak('Merhaba. Ben Yakut. Kumtaş İnşaat için buradayım. Size yardımcı olmaktan mutluluk duyarım.');}
 catch(e){setStatus('Ses hatası: '+e.message);}
});
$('ask').addEventListener('click',async()=>{
 const q=input.value.trim();if(!q)return;
 // Unlock immediately while this is a user gesture, before the optional web request.
 try{
  await unlock();
  output.textContent='Yanıt hazırlanıyor…';source.hidden=true;
  let answer=localAnswers.find(([pattern])=>pattern.test(q))?.[1]||null;
  if(!answer){
   setStatus('Ücretsiz Wikipedia araması yapılıyor…');
   const match=await wiki(q);
   answer=match?.text||'Bu soruyla ilgili Wikipedia üzerinden doğrulanabilir bir cevap bulamadım.';
   if(match){source.href=match.url;source.hidden=false;}
  }
  output.textContent=answer;
  await speak(answer);
 }catch(e){setStatus('Hata: '+e.message);output.textContent='Cevap seslendirilemedi: '+e.message;}
});
$('stop').addEventListener('click',()=>{stop();setStatus('Ses durduruldu.');});
input.addEventListener('keydown',e=>{if(e.key==='Enter')$('ask').click();});
