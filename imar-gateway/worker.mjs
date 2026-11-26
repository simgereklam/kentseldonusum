/**
 * Standalone Kumtas imar gateway. Does NOT modify the existing Yakut Worker.
 * Configure MODAL_URL, CLOUD_RUN_URL and IMAR_GATEWAY_SECRET as Worker secrets.
 * Visit /health to see configured upstreams (not a claim of live availability).
 *
 * GitHub Actions is intentionally not used as a synchronous HTTP fallback:
 * workflow_dispatch is asynchronous and cannot return a parcel result directly.
 */
const ALLOWED_ORIGINS = new Set([
  "https://xn--kentseldnm-lcb7ea99k.com.tr",
  "https://www.xn--kentseldnm-lcb7ea99k.com.tr",
  "https://kentseldönüşüm.com.tr",
  "https://www.kentseldönüşüm.com.tr",
]);
const SOURCES = ["modal", "cloudrun"];
let nextIndex = 0;
const offlineUntil = new Map();
function cors(origin) {
  return origin && ALLOWED_ORIGINS.has(origin) ? {
    "Access-Control-Allow-Origin": origin, "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "7200",
  } : {};
}
function json(value, status=200, headers={}) {
  return new Response(JSON.stringify(value), {
    status, headers: {"content-type":"application/json; charset=utf-8", ...headers},
  });
}
function upstreamUrl(env, name) {
  const raw = name === "modal" ? env.MODAL_URL : env.CLOUD_RUN_URL;
  if (!raw) return null;
  try { const url = new URL(raw); return url.protocol === "https:" ? url.origin + url.pathname.replace(/\/$/, "") : null; }
  catch { return null; }
}
async function send(env, name, pathname, request, body, timeoutMs) {
  const base = upstreamUrl(env, name);
  if (!base) throw Error("Backend not configured");
  const origin = new URL(base).origin;
  let endpoint = base + pathname;
  let method = request.method;
  let requestBody = body;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Modal uses HTTP 303 after ~150 seconds to poll its pending web result.
    // Follow only same-origin 303 redirects; never forward our private key elsewhere.
    for (let redirects = 0; redirects <= 5; redirects++) {
      const response = await fetch(endpoint, {
        method, signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-imar-gateway-key": env.IMAR_GATEWAY_SECRET,
        },
        body: requestBody,
        redirect: "manual",
      });
      if (response.status !== 303) return response;
      const location = response.headers.get("location");
      if (!location) throw Error("Backend redirected without destination");
      const next = new URL(location, endpoint);
      if (next.protocol !== "https:" || next.origin !== origin) {
        throw Error("Unsafe backend redirect refused");
      }
      endpoint = next.href;
      method = "GET";
      requestBody = undefined;
    }
    throw Error("Too many backend redirects");
  } finally { clearTimeout(timer); }
}
function sanitize(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const kaynak = body.kaynak === "tkgm" ? "tkgm" : body.kaynak === "belediye" ? "belediye" : null;
  const ilce = typeof body.ilce === "string" ? body.ilce.trim().slice(0, 50) : "";
  const mahalle = typeof body.mahalle === "string" ? body.mahalle.trim().slice(0, 80) : "";
  const ada = String(body.ada ?? ""), parsel = String(body.parsel ?? "");
  if (!kaynak || !/^\d{1,10}$/.test(ada) || !/^\d{1,10}$/.test(parsel)) return null;
  if (kaynak === "belediye" && !["kadıköy", "bağcılar", "fatih"].includes(ilce.toLocaleLowerCase("tr"))) return {unsupported:true};
  return {kaynak, il:"İstanbul", ilce, mahalle, ada, parsel, url:null};
}
function rewritePath(raw, provider) {
  if (!raw || typeof raw !== "string") return null;
  const match = /^\/shots\/([a-zA-Z0-9_-]+\.png)$/.exec(raw);
  return match ? "/shots/" + provider + "/" + match[1] : null;
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const ch = cors(origin);
    if (request.method === "OPTIONS") {
      if (!origin || !ALLOWED_ORIGINS.has(origin)) return new Response(null,{status:403});
      return new Response(null,{status:204,headers:ch});
    }
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({detail:"Bu siteye izin verilmedi"},403,ch);
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ok:true, service:"imar-gateway", deployments:{
        modal: !!upstreamUrl(env,"modal"), cloudrun: !!upstreamUrl(env,"cloudrun")},
        note:"Configured is not the same as deployed/healthy"},200,ch);
    }
    if (!env.IMAR_GATEWAY_SECRET) return json({detail:"Gateway secret missing"},503,ch);
    if (request.method === "POST" && url.pathname === "/sorgula") {
      let parsed;
      try { parsed = await request.json(); }
      catch { return json({detail:"Geçersiz JSON"},400,ch); }
      const params = sanitize(parsed);
      if (!params) return json({detail:"Geçersiz sorgu"},400,ch);
      if (params.unsupported) return json({detail:"Otomatik e-İmar şu anda Kadıköy, Bağcılar ve Fatih için kurulu"},422,ch);
      const available = SOURCES.filter(name => !!upstreamUrl(env,name));
      if (!available.length) return json({detail:"Henüz çalışan bir bulut servisi bağlanmadı"},503,ch);
      const first = nextIndex++ % available.length;
      const ordered = available.slice(first).concat(available.slice(0,first))
        .sort((a,b) => (offlineUntil.get(a)||0)- (offlineUntil.get(b)||0));
      let lastError = "Hizmet geçici olarak yanıt vermedi";
      for (const provider of ordered) {
        if ((offlineUntil.get(provider)||0) > Date.now()) continue;
        try {
          const response = await send(env,provider,"/sorgula",request,JSON.stringify(params),230000);
          if (response.status >= 500 || [401, 402, 403, 408, 425, 429].includes(response.status)) {
            lastError = provider + ": HTTP " + response.status;
            offlineUntil.set(provider,Date.now()+20000);
            continue;
          }
          const data = await response.json();
          if (!response.ok) return json(data,response.status,ch);
          for (const key of ["ekran_goruntusu_url","ekran_goruntusu_parca_1","ekran_goruntusu_parca_2"]) {
            data[key] = rewritePath(data[key], provider);
          }
          data.goruntu_sayfasi = null;  // local /goruntu route cannot be proxied without rewriting HTML assets
          data.sorgu_sunucusu = provider;
          return json(data,200,{"cache-control":"no-store",...ch});
        } catch(e) {
          lastError = provider + ": " + String(e?.message || e);
          offlineUntil.set(provider,Date.now()+20000);
        }
      }
      return json({detail:lastError, retryable:true},503,ch);
    }
    const m = /^\/shots\/(modal|cloudrun)\/([a-zA-Z0-9_-]+\.png)$/.exec(url.pathname);
    if (request.method === "GET" && m) {
      try {
        const upstream = await send(env,m[1],"/shots/"+m[2],request,undefined,20000);
        if (!upstream.ok) return json({detail:"Görsel henüz mevcut değil"},upstream.status,ch);
        return new Response(upstream.body,{status:200,headers:{
          "content-type":"image/png", "cache-control":"private, max-age=300",...ch,
        }});
      } catch { return json({detail:"Görsel servisi yanıt vermedi"},503,ch); }
    }
    return json({detail:"Bulunamadı"},404,ch);
  }
};
