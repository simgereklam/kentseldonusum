'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createImarServer } = require('./yakut-imar-server.cjs');

const origin = 'https://xn--kentseldnm-lcb7ea99k.com.tr';

test('Bağcılar test verisiyle mahalle teyidi ve imar yanıtı', async () => {
  const server = createImarServer(async ({ ada, parsel, mahalle }) => {
    if (ada !== '0' || parsel !== '2135') return { durum: 'bulunamadi' };
    if (!mahalle) return { durum: 'mahalle_teyidi', mahalleler: ['Kirazlı', 'Mahmutbey'] };
    return { durum: 'bulundu', ada, parsel, mahalle, alanlar: {
      'K.A.K.S (Emsal)': '2,00',
      'T.A.K.S': null,
      'Kat Adedi': null
    } };
  }, origin);

  const request = query => new Promise(resolve => {
    const headers = {};
    const response = {
      setHeader(name, value) { headers[name] = value; },
      end(body) { resolve({ status: this.statusCode, headers, body: JSON.parse(body) }); }
    };
    server.emit('request', { method: 'GET', url: '/imar/bagcilar?' + query, headers: { origin } }, response);
  });

  const matches = await request('ada=0&parsel=2135');
  assert.equal(matches.body.durum, 'mahalle_teyidi');
  assert.deepEqual(matches.body.mahalleler, ['Kirazlı', 'Mahmutbey']);
  const result = await request('ada=0&parsel=2135&mahalle=Kirazl%C4%B1');
  assert.equal(result.status, 200);
  assert.equal(result.headers['Access-Control-Allow-Origin'], origin);
  assert.equal(result.body.alanlar['K.A.K.S (Emsal)'], '2,00');
  assert.equal(result.body.alanlar['T.A.K.S'], null);
  assert.equal((await request('ada=0&parsel=x')).status, 400);
});
