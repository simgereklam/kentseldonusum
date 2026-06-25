const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const skipDirs = new Set(['.git', '.github', 'node_modules', 'scripts']);

function walk(dir) {
  let out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!skipDirs.has(name)) out = out.concat(walk(full));
    } else if (exts.has(path.extname(name).toLowerCase())) {
      out.push(rel);
    }
  }
  return out;
}

function kategoriBul(file) {
  const lower = file.toLowerCase();
  const base = path.basename(lower);
  if (lower.includes('tamamlanan') || lower.includes('tamamlanmis') || base.startsWith('tamam')) return 'tamamlanmis';
  if (lower.includes('devam') || lower.includes('kaba') || lower.includes('santiye') || lower.includes('şantiye') || base.startsWith('kaba')) return 'devam-eden';
  if (lower.includes('ornek') || lower.includes('örnek') || lower.includes('proje') || base.startsWith('proje')) return 'ornekler';
  return null;
}

function sirala(a, b) {
  return a.localeCompare(b, 'tr', { numeric: true, sensitivity: 'base' });
}

const items = walk(ROOT)
  .filter(f => kategoriBul(f))
  .sort(sirala)
  .map((src) => {
    const kategori = kategoriBul(src);
    const no = (path.basename(src).match(/\d+/) || [''])[0];
    const basliklar = {
      'tamamlanmis': 'Tamamlanan Proje',
      'devam-eden': 'Devam Eden Proje',
      'ornekler': 'Proje Örneği'
    };
    return { kategori, src, baslik: no ? `${basliklar[kategori]} ${no}` : basliklar[kategori] };
  });

fs.writeFileSync(path.join(ROOT, 'resimler.json'), JSON.stringify(items, null, 2), 'utf8');
console.log(`resimler.json oluşturuldu. Görsel sayısı: ${items.length}`);
