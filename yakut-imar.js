(() => {
'use strict';
const fields = {
 area: 'net imar parseli alanı', taks: 'TAKS', kaks: 'emsal veya KAKS',
 floors: 'zemin dahil kat adedi', unit: 'daire başına brüt alan',
 common: 'ortak alan yüzdesi', shop: 'zemindeki dükkân alanı'
};
const labels = {
 area: '(?:net (?:imar )?parsel(?:i(?:nin)?)? alanı|imar parsel(?:i(?:nin)?)? net alanı|imar parsel(?:i(?:nin)?)? alanı|net arsa alanı)',
 taks: '(?:taks|taban alanı katsayısı)',
 kaks: '(?:kaks\\s*[/–-]\\s*emsal|emsal\\s*[/–-]\\s*kaks|kaks|emsal(?: oranı)?|kat alanı katsayısı)',
 floors: '(?:zemin d[aâ]hil kat (?:sayısı|adedi)|kat (?:sayısı|adedi))',
 unit: '(?:daire başına (?:brüt )?alan|daire brütü)',
 common: '(?:ortak alan (?:payı|yüzdesi))',
 shop: '(?:(?:zemindeki )?dükk[aâ]n alanı)'
};
const fmt = new Intl.NumberFormat('tr-TR', {maximumFractionDigits: 2});
const byId = id => document.getElementById(id);
const number = '[+-]?\\d+(?:[.,]\\d+)*';
const spokenNumbers = {
 sıfır:'0', bir:'1', iki:'2', üç:'3', dört:'4', beş:'5', altı:'6', yedi:'7', sekiz:'8', dokuz:'9',
 on:'10', yirmi:'20', otuz:'30', kırk:'40', elli:'50', altmış:'60', yetmiş:'70', seksen:'80', doksan:'90',
 yüz:'100', bin:'1000'
};

function spokenDigits(text) {
 const words = text.trim().toLocaleLowerCase('tr-TR').split(/\s+/);
 let group = 0, total = 0, previous = 0;
 for (const word of words) {
  if (!Object.hasOwn(spokenNumbers, word)) return null;
  const value = Number(spokenNumbers[word]);
  if (value === 1000) {if (total || previous >= 1000) return null; total = (group || 1) * 1000; group = 0;}
  else if (value === 100) {if (group >= 10) return null; group = (group || 1) * 100;}
  else {
   if (previous >= 10 && previous < 100 && value >= 10 || previous > 0 && previous < 10) return null;
   group += value;
  }
  previous = value;
 }
 return String(total + group);
}

function readNumber(value, key) {
 const raw = String(value ?? '').trim().toLocaleLowerCase('tr-TR');
 if (!raw) return null;
 const percent = /^%|^yüzde\s/.test(raw);
 let text = raw.replace(/^(?:%\s*|yüzde\s+)/, '');
 if (!/^[+-]?\d+(?:[.,]\d+)*$/.test(text)) {
  const parts = text.split(/\s+(?:virgül|nokta)\s+/);
  const digits = parts.length <= 2 && parts.map((part, index) =>
   /^\d+$/.test(part) ? part : index === 1 && part.split(/\s+/).every(word => /^[0-9]$/.test(spokenNumbers[word] || ''))
    ? part.split(/\s+/).map(word => spokenNumbers[word]).join('')
    : spokenDigits(part));
  if (!digits || !digits.every(part => part !== null)) return null;
  text = digits.join(',');
 }
 if (text.includes(',')) {
  if (!/^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+),\d+$/.test(text)) return null;
  text = text.replace(/\./g, '').replace(',', '.');
 } else if ((key === 'area' || key === 'unit' || key === 'shop') && /^[+-]?\d{1,3}(?:\.\d{3})+$/.test(text)) {
  text = text.replace(/\./g, '');
 }
 const result = Number(text);
 return percent && (key === 'taks' || key === 'kaks') ? result / 100 : result;
}

function validValue(key, value) {
 if (!Number.isFinite(value)) return false;
 if (key === 'taks') return value > 0 && value <= 1;
 if (key === 'floors') return Number.isInteger(value) && value >= 1 && value <= 200;
 if (key === 'common') return value >= 0 && value < 100;
 if (key === 'shop') return value >= 0;
 return value > 0;
}

function readZoningText(text) {
 const source = String(text || '').normalize('NFC').toLocaleLowerCase('tr-TR');
 const words = Object.keys(spokenNumbers).join('|') + '|virgül|nokta';
 const values = {};
 for (const [key, label] of Object.entries(labels)) {
  const pattern = new RegExp('(?:^|[^\\p{L}])'+label+'(?:m(?:ız)?|nız)?[ \\t]*(?:[:=–-][ \\t]*|[ \\t]+)(?:(?:%[ \\t]*|yüzde[ \\t]+))?(?:'+number+'|(?:(?:'+words+')(?:[ \\t]+|(?=[^\\p{L}]|$)))+)', 'gu');
  const entries = [...source.matchAll(pattern)].map(match => {
   const content = match[0].replace(new RegExp('^[^\\p{L}]?'+label+'(?:m(?:ız)?|nız)?[ \\t]*(?:[:=–-][ \\t]*)?','u'), '').trim();
   return readNumber(content, key);
  }).filter(value => validValue(key, value));
  if (entries.length && entries.every(value => value === entries[0])) values[key] = entries[0];
 }
 const zPlus = source.match(/(?:^|\s)z\s*\+\s*(\d{1,3})(?![\d.,])/);
 if (!values.floors && zPlus && validValue('floors', +zPlus[1] + 1)) values.floors = +zPlus[1] + 1;
 return values;
}

function calculate(values) {
 const footprint = values.area && values.taks ? values.area * values.taks : null;
 const emsalArea = values.area && values.kaks ? values.area * values.kaks : null;
 const result = {footprint, emsalArea, floorArea: null, housingArea: null, units: null};
 if (!(footprint && emsalArea && values.floors)) return result;
 const floorArea = Math.min(footprint, emsalArea / values.floors);
 const usableFloor = floorArea * (1 - values.common / 100);
 const groundHousing = usableFloor - values.shop;
 result.floorArea = floorArea;
 if (groundHousing < -1e-8) {result.shopTooLarge = true; return result;}
 result.housingArea = Math.max(0, usableFloor * values.floors - values.shop);
 result.units = Math.floor((Math.max(0, groundHousing) + 1e-8) / values.unit) +
  (values.floors - 1) * Math.floor((usableFloor + 1e-8) / values.unit);
 return result;
}

function readFields() {
 const values = {};
 for (const key of Object.keys(fields)) {
  const value = byId(key).valueAsNumber;
  if (validValue(key, value)) values[key] = value;
 }
 return {...values, unit: values.unit ?? 100, common: values.common ?? 20, shop: values.shop ?? 0};
}

function fillFields(values) {
 const filled = [];
 for (const [key, value] of Object.entries(values)) {
  const input = byId(key);
  if (input && validValue(key, value)) {
   input.value = String(value);
   filled.push(fields[key]);
  }
 }
 return filled;
}

let waiting = '';
let housingRequested = false;
function renderCalculation({housing = housingRequested, scroll = false} = {}) {
 housingRequested = housing;
 const invalid = Object.keys(fields).find(key => byId(key).value && !validValue(key, byId(key).valueAsNumber));
 if (invalid) {
  waiting = invalid;
  const message = 'Geçerli bir değer girin. Alan: ' + fields[invalid] + '.';
  byId('error').textContent = message;
  byId('results').hidden = true;
  return message;
 }
 const values = readFields();
 const result = calculate(values);
 const areaText = value => value === null ? '—' : fmt.format(value) + ' m²';
 byId('foot').textContent = areaText(result.footprint);
 byId('gross').textContent = areaText(result.emsalArea);
 byId('net').textContent = areaText(result.housingArea);
 byId('units').textContent = result.units === null ? '—' : String(result.units);
 byId('building').textContent = result.footprint ? areaText(result.footprint) + ' teorik oturum' : 'Bina oturumu';
 byId('results').hidden = !(result.footprint || result.emsalArea);
 const messages = [];
 if (result.footprint !== null) messages.push('TAKS’a göre azami teorik taban alanı ' + fmt.format(result.footprint) + ' metrekare.');
 if (result.emsalArea !== null) messages.push('Emsale esas azami alan ' + fmt.format(result.emsalArea) + ' metrekare.');
 if (result.shopTooLarge) messages.push('Dükkân alanı, bu senaryoda zeminde ayrılabilen alanı aşıyor.');
 if (result.units !== null) {
  messages.push('Zemin dahil ' + values.floors + ' katı eşit büyüklükte varsayarak, yüzde ' + fmt.format(values.common) +
   ' ortak alan ve daire başına ' + fmt.format(values.unit) + ' metrekare brüt alanla yaklaşık ' + result.units + ' daire sığar.');
 }
 waiting = ['area', 'taks', 'kaks'].find(key => !(key in values)) || '';
 if (!waiting && housing && !values.floors) waiting = 'floors';
 const questions = {
  area: 'Resmî belgedeki net imar parseli alanı kaç metrekare? Bu bilgi yanınızda yoksa parsel sorgula diyebilirsiniz.',
  taks: 'Resmî belgedeki TAKS değeri kaç?',
  kaks: 'Resmî belgedeki emsal veya KAKS değeri kaç?',
  floors: 'Daire senaryosu için zemin dahil kaç kat kullanayım?'
 };
 const next = questions[waiting] || (result.shopTooLarge ? 'Dükkân alanını veya kat senaryosunu değiştirin.' : '');
 byId('error').textContent = next;
 if (scroll && !byId('results').hidden) byId('results').scrollIntoView({behavior:'smooth', block:'start'});
 return [...messages, next].filter(Boolean).join(' ');
}

function tell(text) {
 if (text) document.dispatchEvent(new CustomEvent('yakut:eimar-result', {detail:text}));
}

function answer(text, command) {
 const updates = readZoningText(text);
 const isCalculation = /^(?:yakut )?(?:hesapla|imar hesabı|imar hesabını yap|imar hesapla)$|(?:imar.{0,20}hesap|kaç daire|kaç konut|kaç dükk[aâ]n|emsale esas alan|taban oturumu|inşaat alanı hesap)/.test(command);
 if (!Object.keys(updates).length && waiting) {
  const answer = text.replace(/\s+(?:metrekare|m²|kat)\s*$/i, '');
  const value = readNumber(answer, waiting);
  if (validValue(waiting, value)) updates[waiting] = value;
 }
 if (!Object.keys(updates).length && !isCalculation) return null;
 const housing = housingRequested || /daire|konut|dükk[aâ]n/.test(command);
 fillFields(updates);
 return renderCalculation({housing, scroll:true});
}

const official = {
 bagcilar: 'https://www.turkiye.gov.tr/bagcilar-belediyesi-imar-durum-sorgulama',
 bahcelievler: 'https://www.turkiye.gov.tr/bahcelievler-belediyesi-imar-durum-sorgulama'
};
function updateLink() {
 const district = byId('district');
 byId('source').href = official[district.value] || 'https://www.turkiye.gov.tr/arama?aranan=' +
  encodeURIComponent(district.selectedOptions[0].textContent.trim() + ' belediyesi imar durum bilgisi sorgulama');
}
let activeLookup;
const importedFields = new Map();
function cancelLookup() {
 activeLookup?.abort();
 activeLookup = null;
 byId('lookup').disabled = false;
}
function resetLookup() {
 cancelLookup();
 for (const [key, value] of importedFields) {
  if (byId(key).valueAsNumber === value) byId(key).value = '';
 }
 importedFields.clear();
 byId('results').hidden = true;
 byId('source-note').textContent = '';
 updateLink();
}
function setParcel(values) {
 let changed = false;
 for (const [key, value] of Object.entries(values)) {
  if (value && byId(key).value !== value) {
   byId(key).value = value;
   changed = true;
  }
 }
 if (changed) resetLookup();
}

async function lookup() {
 const district = byId('district').value;
 const neighborhood = byId('mahalle').value.trim();
 const ada = byId('ada').value.trim();
 const parsel = byId('parsel').value.trim();
 const missing = !neighborhood ? 'Mahalle adını girin.' : !/^\d{1,9}$/.test(ada) ? 'Ada numarasını girin.' :
  !/^0*[1-9]\d{0,8}$/.test(parsel) || parsel.length > 9 ? 'Parsel numarasını girin.' : '';
 if (missing) {byId('source-note').textContent = missing; tell(missing); return;}
 if (!Object.hasOwn(official, district)) {
  const note = 'Bu ilçe için belediye bağlantısını açıp imar sonucundaki bilgileri buraya aktarabilirsiniz.';
  byId('source-note').textContent = note; tell(note); return;
 }
 activeLookup?.abort();
 const controller = new AbortController();
 activeLookup = controller;
 byId('lookup').disabled = true;
 const districtName = byId('district').selectedOptions[0].textContent.trim();
 byId('source-note').textContent = districtName + ' Belediyesi sorgulanıyor.';
 try {
  const endpoint = new URL('/imar', document.querySelector('meta[name="yakut-chat-endpoint"]')?.content ||
   'https://kumtas-yakut-api.bloomyvanilla256.chatgpt.site/chat');
  const response = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json'},
   body:JSON.stringify({district, neighborhood, ada, parsel}),
   signal:AbortSignal.any([controller.signal, AbortSignal.timeout(18000)])});
  if (!response.ok) throw new Error('lookup');
  const data = await response.json();
  if (controller.signal.aborted) return;
  const note = data.status === 'no-parcel' ? 'Belediye bu mahalle, ada ve parsel için sonuç döndürmedi.' :
   data.status === 'no-neighborhood' ? 'Mahalle adını ' + districtName + ' Belediyesi kaydıyla eşleştiremedim.' :
   'Bu sorguda hesap için doğrulanmış katsayıları otomatik alamadım.';
  const values = readZoningText(data.zoning || '');
  const filled = fillFields(values);
  for (const [key, value] of Object.entries(values)) importedFields.set(key, value);
  if (filled.length) {
   byId('source-note').textContent = districtName + ' Belediyesi sonucundan aktarılan alanlar: ' + filled.join(', ') + '.';
   tell(renderCalculation({scroll:true}));
  } else {
   const message = note + ' Resmî sonucu açabilir ve oradaki imar değerlerini buraya girebilirsiniz.';
   byId('source-note').textContent = message;
   tell(message);
  }
 } catch {
  if (controller.signal.aborted) return;
  const note = 'Belediye sorgusuna şu anda ulaşılamıyor. Resmî bağlantıyı açıp değerleri girebilirsiniz.';
  byId('source-note').textContent = note; tell(note);
 } finally {
  if (activeLookup === controller) byId('lookup').disabled = false;
 }
}

byId('lookup').onclick = lookup;
byId('calc').onclick = () => tell(renderCalculation({housing:true, scroll:true}));
byId('read-document').onclick = () => {
 const values = readZoningText(byId('zoning-text').value);
 const filled = fillFields(values);
 const message = filled.length ? 'Aktarılan alanlar: ' + filled.join(', ') + '.' :
  'Metinde açıkça yazılmış net alan, TAKS, emsal veya kat adedi bulunamadı.';
 byId('document-note').textContent = message;
 if (filled.length) tell(renderCalculation({scroll:true}));
 else tell(message);
};
for (const key of ['district','mahalle','ada','parsel']) byId(key).addEventListener('input', resetLookup);
updateLink();
window.yakutImar = {answer, lookup, setParcel, cancelLookup, canLookUp: () => Object.hasOwn(official, byId('district').value)};
})();
