'use strict';

const { createServer } = require('node:http');
const { lookup, sources } = require('./yakut-bagcilar-sorgu.cjs');

function createImarServer(findParcel, allowedOrigin) {
  let active = false;
  return createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Origin');
    const send = (status, body) => {
      res.statusCode = status;
      res.end(JSON.stringify(body));
    };
    if (req.headers.origin && req.headers.origin !== allowedOrigin) {
      return send(403, { durum: 'erisim_yok' });
    }
    if (req.headers.origin === allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    }
    const url = new URL(req.url, 'http://localhost');
    if (req.method !== 'GET' || !['/imar/sorgu', '/imar/bagcilar'].includes(url.pathname)) {
      return send(404, { durum: 'bulunamadi' });
    }
    const ilce = url.pathname === '/imar/bagcilar' ? 'Bağcılar' : url.searchParams.get('ilce');
    if (!sources.has(ilce)) return send(422, { durum: 'ilce_desteklenmiyor' });
    const ada = url.searchParams.get('ada') || '';
    const parsel = url.searchParams.get('parsel') || '';
    const mahalle = (url.searchParams.get('mahalle') || '').trim();
    if (!/^\d{1,9}$/.test(ada) || !/^\d{1,9}$/.test(parsel) || mahalle.length > 80) {
      return send(400, { durum: 'gecersiz_sorgu' });
    }
    if (active) return send(503, { durum: 'mesgul' });
    active = true;
    try {
      send(200, await findParcel({ ilce, ada, parsel, mahalle }));
    } catch (error) {
      console.error('Bağcılar e-İmar:', error.message);
      send(502, { durum: 'belediye_yanit_vermedi' });
    } finally {
      active = false;
    }
  });
}

if (require.main === module) {
  const origin = process.env.YAKUT_WEB_ORIGIN || 'https://xn--kentseldnm-lcb7ea99k.com.tr';
  createImarServer(lookup, origin).listen(Number(process.env.PORT || 8080));
}

module.exports = { createImarServer };
