cd "$HOME\Desktop\kentseldonusum-main (1)\kentseldonusum-main"

$code = Get-Content .\yakut-v9.js -Raw -Encoding UTF8

# 1. Gerçek ses dalgasına (AnalyserNode) bağlı dudak senkronizasyonu ekle
$oldAudioSetup = @'
let audioUnlocked=false,yakutTtsContext=null,yakutAudioPlaying=false,yakutVoiceGeneration=0,yakutGestureClock=0;
'@

$newAudioSetup = @'
let audioUnlocked=false,yakutTtsContext=null,yakutAnalyser=null,yakutAnalyserData=null,yakutAudioPlaying=false,yakutVoiceGeneration=0,yakutGestureClock=0;
function getYakutAudioDest(){
 if(!yakutTtsContext)return null;
 if(!yakutAnalyser){
  yakutAnalyser=yakutTtsContext.createAnalyser();
  yakutAnalyser.fftSize=256;
  yakutAnalyserData=new Uint8Array(yakutAnalyser.frequencyBinCount);
  yakutAnalyser.connect(yakutTtsContext.destination);
 }
 return yakutAnalyser;
}
'@

# 2. MP3 kayıtlarını ve Canlı TTS sesini doğrudan Analyser'a bağla + tam zamanında başlat
$oldPlayRec = @'
  source.buffer=buffer;
  source.connect(context.destination);
'@

$newPlayRec = @'
  source.buffer=buffer;
  source.connect(getYakutAudioDest()||context.destination);
'@

$oldLiveStart = @'
    const source=context.createBufferSource();
    source.buffer=buffer;source.connect(context.destination);
    nextStart=Math.max(nextStart,context.currentTime+(played?0.015:0.09));
    source.start(nextStart);nextStart+=buffer.duration;
    yakutLiveSources.add(source);
    playbackEnded=new Promise(resolve=>{
     source.onended=()=>{yakutLiveSources.delete(source);resolve();};
    });
    if(!played)beginYakutAudioPlayback();
    played=true;
'@

$newLiveStart = @'
    const source=context.createBufferSource();
    source.buffer=buffer;source.connect(getYakutAudioDest()||context.destination);
    const startAt=Math.max(nextStart,context.currentTime+0.01);
    nextStart=startAt+buffer.duration;
    source.start(startAt);
    yakutLiveSources.add(source);
    playbackEnded=new Promise(resolve=>{
     source.onended=()=>{yakutLiveSources.delete(source);resolve();};
    });
    if(!played){
     const delayMs=Math.max(0,(startAt-context.currentTime)*1000);
     if(delayMs>5)setTimeout(()=>{if(generation===yakutVoiceGeneration&&yakutLiveSources.size)beginYakutAudioPlayback();},delayMs);
     else beginYakutAudioPlayback();
    }
    played=true;
'@

# 3. Cümleler arası beklemede dudakları durdur (sessiz oynamayı önle)
$oldSentenceLoop = @'
   for(const sentence of sentences){
    if(turn!==yakutVoiceGeneration||hidden){allOk=false;break;}
    const ok=await askYakutLive(endpoint,{readAloud:sentence},turn);
    if(!ok){allOk=false;break;}
   }
'@

$newSentenceLoop = @'
   for(const sentence of sentences){
    if(turn!==yakutVoiceGeneration||hidden){allOk=false;break;}
    yakutAudioPlaying=false;
    const ok=await askYakutLive(endpoint,{readAloud:sentence},turn);
    yakutAudioPlaying=false;
    if(!ok){allOk=false;break;}
   }
'@

# 4. Dudak hareketini yapay sinüs yerine gerçek ses genliğine bağla
$oldLipSync = @'
if(face){
const v=yakutAudioPlaying?Math.max(0,Math.sin(performance.now()*.016)):.0;
for(const [name,i] of Object.entries(face.morphTargetDictionary)){
const influence=/jawOpen|viseme_A/i.test(name)?v*.65:/viseme_O/i.test(name)?v*.18:0;
face.morphTargetInfluences[i]=THREE.MathUtils.damp(face.morphTargetInfluences[i],influence,14,dt)}
}
'@

$newLipSync = @'
if(face){
let amp=0;
if(yakutAudioPlaying&&yakutLiveSources.size>0&&yakutAnalyser&&yakutAnalyserData){
 yakutAnalyser.getByteTimeDomainData(yakutAnalyserData);
 let sum=0;
 for(let k=0;k<yakutAnalyserData.length;k++){const d=(yakutAnalyserData[k]-128)/128;sum+=d*d;}
 amp=Math.min(1,Math.sqrt(sum/yakutAnalyserData.length)*4.5);
}
for(const [name,i] of Object.entries(face.morphTargetDictionary)){
const influence=/jawOpen|viseme_A/i.test(name)?amp*.75:/viseme_O/i.test(name)?amp*.22:0;
face.morphTargetInfluences[i]=THREE.MathUtils.damp(face.morphTargetInfluences[i],influence,22,dt)}
}
'@

# 5. Dur/Sus komutlarını genişlet ve mikrofon geçişini hızlandır
$oldStopFn = @'
function isYakutStopCommand(command){
 return /(?:^| )(?:dur|sus|konuşma|kes|yeter|tamam dur|bi saniye|bir saniye|bekle)(?: |$)/.test(command) && command.split(' ').length <= 4;
}
'@

$newStopFn = @'
function isYakutStopCommand(command){
 return /(?:^| )(?:dur|durun|sus|susun|konuşma|kes|yeter|tamam|bekle|bi saniye|bir saniye|kapat)(?: |$)/.test(command) && command.split(' ').length <= 5;
}
'@

$oldQueueListen = @'
function queueListen(delay=600){
 clearTimeout(listenRetry);
 if(!ready||!listenEnabled||hidden||yakutDeferredSpeech)return;
 const stopOnly=speaking||processingSpeech;
 if(recognition){
  if(micStopOnly===stopOnly)return;
  releaseYakutMic();
 }
 const ms=Math.max(delay,micRestartAt-Date.now(),0);
 listenRetry=setTimeout(startSpeech,ms);
}
'@

$newQueueListen = @'
function queueListen(delay=250){
 clearTimeout(listenRetry);
 if(!ready||!listenEnabled||hidden||yakutDeferredSpeech)return;
 const stopOnly=speaking||processingSpeech;
 if(recognition){
  micStopOnly=stopOnly;
  return;
 }
 const ms=Math.max(delay,micRestartAt-Date.now(),0);
 listenRetry=setTimeout(startSpeech,ms);
}
'@

# 6. startSpeech içinde micStopOnly değişkenini dinamik oku (mikrofonu kapatıp açmadan anında yakala)
$oldSpeechMode = @'
 const stopOnly=speaking||processingSpeech;
 const rec=new API();recognition=rec;micStarting=true;
 micStopOnly=stopOnly;
'@

$newSpeechMode = @'
 const rec=new API();recognition=rec;micStarting=true;
 micStopOnly=speaking||processingSpeech;
'@

$oldOnResultMode = @'
  if(stopOnly){
   // Only a standalone stop command can interrupt while Yakut's own voice is audible.
   pendingStop=false;
   for(const result of results.slice(e.resultIndex)){
    if(!isYakutStopCommand(normalizeYakutCommand(result[0].transcript)))continue;
    if(result.isFinal){stop();return}
    pendingStop=true;
   }
   if(pendingStop){stop();return;}
   return;
  }
'@

$newOnResultMode = @'
  if(speaking||processingSpeech||micStopOnly){
   for(const result of results.slice(e.resultIndex)){
    const heard=normalizeYakutCommand(result[0].transcript);
    if(isYakutStopCommand(heard)){
     releaseYakutMic();
     stopYakutAnswer();
     return;
    }
   }
   return;
  }
'@

$code = $code.Replace($oldAudioSetup, $newAudioSetup).Replace($oldPlayRec, $newPlayRec).Replace($oldLiveStart, $newLiveStart).Replace($oldSentenceLoop, $newSentenceLoop).Replace($oldLipSync, $newLipSync).Replace($oldStopFn, $newStopFn).Replace($oldQueueListen, $newQueueListen).Replace($oldSpeechMode, $newSpeechMode).Replace($oldOnResultMode, $newOnResultMode)
Set-Content -Path .\yakut-v9.js -Value $code -Encoding UTF8
Write-Host "yakut-v9.js basariyla guncellendi!"
