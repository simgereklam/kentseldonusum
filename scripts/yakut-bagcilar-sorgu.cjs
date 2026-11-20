'use strict';

const { chromium } = require('playwright');
const source = 'https://bbgis.bagcilar.bel.tr/imardurumu/';
const normalize = value => value.trim().toLocaleLowerCase('tr-TR').normalize('NFC');

async function lookup({ ada, parsel, mahalle }) {
  if (!/^\d+$/.test(ada) || !/^\d+$/.test(parsel)) {
    throw new Error('Ada ve parsel numarası rakamlardan oluşmalı.');
  }

  const browser = await chromium.launch({ executablePath: process.env.YAKUT_CHROMIUM_PATH || undefined });
  try {
    const page = await browser.newPage({ locale: 'tr-TR' });
    page.setDefaultTimeout(15000);
    await page.goto(source, { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Ada/Parsel', exact: true }).click();
    await page.getByRole('textbox', { name: 'Ada', exact: true }).fill(ada);
    await page.getByRole('textbox', { name: 'Parsel', exact: true }).fill(parsel);
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
    await page.locator('#htmlOutput .divTableRow').first().waitFor({ state: 'visible' });
    const alanlar = await page.locator('#htmlOutput .divTableRow').evaluateAll(rows =>
      Object.fromEntries(rows.flatMap(row => {
        const label = row.querySelector('.divTableCellLabel')?.textContent.trim();
        const value = row.querySelector('.divTableContent')?.textContent.trim();
        return label ? [[label, value && value !== '-' ? value : null]] : [];
      }))
    );

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

module.exports = { lookup };
