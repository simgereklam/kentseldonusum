'use strict';

const { chromium } = require('playwright');
const sources = new Map([
  ['Bağcılar', 'https://bbgis.bagcilar.bel.tr/imardurumu/'],
  ['Ataşehir', 'https://webgis.atasehir.bel.tr/imardurumu/index.aspx'],
  ['Kadıköy', 'https://webgis.kadikoy.bel.tr/imardurumu/']
]);
const normalize = value => value.trim().toLocaleLowerCase('tr-TR').normalize('NFC');

async function lookup({ ilce = 'Bağcılar', ada, parsel, mahalle }) {
  const source = sources.get(ilce);
  if (!source) return { durum: 'ilce_desteklenmiyor' };
  if (!/^\d+$/.test(ada) || !/^\d+$/.test(parsel)) {
    throw new Error('Ada ve parsel numarası rakamlardan oluşmalı.');
  }

  const browser = await chromium.launch({ executablePath: process.env.YAKUT_CHROMIUM_PATH || undefined });
  try {
    const page = await browser.newPage({ locale: 'tr-TR' });
    page.setDefaultTimeout(30000);
    const response = await page.goto(source, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (!response?.ok()) return { durum: 'belediye_erisim_hatasi', kaynak: source };
    const verification = page.getByText(/verify you are human|checking your browser|insan olduğunuzu doğrulayın/i).first();
    const parcelTab = page.getByRole('tab', { name: 'Ada/Parsel', exact: true });
    await parcelTab.or(verification).first().waitFor({ state: 'visible' });
    if (await verification.isVisible()) return { durum: 'dogrulama_gerekli', kaynak: source };
    await parcelTab.click();
    const adaField = page.getByRole('textbox', { name: 'Ada', exact: true });
    if (await adaField.isVisible()) {
      await adaField.fill(ada);
      await page.getByRole('textbox', { name: 'Parsel', exact: true }).fill(parsel);
    } else {
      await page.getByRole('textbox', { name: 'Ada/Parsel', exact: true }).fill(ada + '/' + parsel);
    }
    await page.getByRole('button', { name: 'Ara', exact: true }).click();

    const cards = page.locator('.result-item').filter({
      has: page.getByText(ada + '/' + parsel, { exact: true })
    });
    await cards.first().waitFor({ state: 'visible' });
    const matches = await cards.all();
    const mahalleler = await Promise.all(matches.map(async card =>
      (await card.innerText()).split('\n').map(line => line.trim()).filter(Boolean)[1] || ''
    ));
    const selected = mahalle
      ? mahalleler.flatMap((name, index) => normalize(name) === normalize(mahalle) ? [index] : [])
      : matches.length === 1 ? [0] : [];

    if (selected.length !== 1) {
      return { durum: 'mahalle_teyidi', ada, parsel, mahalleler, kaynak: source };
    }

    await matches[selected[0]].dblclick();
    if (ilce === 'Bağcılar') {
      await page.getByRole('button', { name: 'İmar Durumu', exact: true }).click();
    }
    await page.locator('#htmlOutput .divTableRow').first().waitFor({ state: 'visible' });
    const alanlar = await page.locator('#htmlOutput .divTableRow').evaluateAll(rows =>
      Object.fromEntries(rows.flatMap(row => {
        const label = row.querySelector('.divTableCellLabel')?.textContent.trim();
        const value = row.querySelector('.divTableContent')?.textContent.trim();
        return label ? [[label, value && value !== '-' ? value : null]] : [];
      }))
    );

    if (alanlar.Ada !== ada || alanlar.Parsel !== parsel ||
        normalize(alanlar.Mahalle || '') !== normalize(mahalleler[selected[0]])) {
      throw new Error('Belediye belgesindeki ada, parsel veya mahalle eşleşmedi.');
    }

    return { durum: 'bulundu', ada, parsel, mahalle: mahalleler[selected[0]], kaynak: page.url(), alanlar };
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  const [ada, parsel, ...district] = process.argv.slice(2);
  lookup({ ada: ada || '', parsel: parsel || '', mahalle: district.join(' ') })
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => {
      console.error('Sorgu tamamlanamadı:', error.message);
      process.exitCode = 1;
    });
}

module.exports = { lookup, sources };
