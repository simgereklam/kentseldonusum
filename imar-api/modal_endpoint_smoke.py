"""One-off, private smoke test of the *deployed* Modal HTTP API.

Invoked by GitHub Actions via "modal run modal_endpoint_smoke.py".
The shared API key is injected by Modal Secrets and is never sent to GitHub logs.
Tests the real API, two real PNGs and the original municipal automation.
"""
import modal

app = modal.App("kumtas-imar-http-smoke")

@app.function(
    image=modal.Image.debian_slim(python_version="3.12").pip_install("httpx>=0.27,<1"),
    cpu=1,
    memory=512,
    timeout=250,
    secrets=[modal.Secret.from_name("kumtas-imar-gateway")],
)
def check_deployed_kadikoy():
    import hashlib
    import os
    import httpx

    base = "https://kumtasinsaatmuraterdem--kumtas-imar-backend-api.us-east.modal.run"
    key = os.environ.get("IMAR_GATEWAY_SECRET")
    if not key:
        raise RuntimeError("IMAR_GATEWAY_SECRET missing inside Modal function")
    headers = {"x-imar-gateway-key": key}
    payload = {
        "kaynak": "belediye",
        "il": "İstanbul",
        "ilce": "Kadıköy",
        "mahalle": "Erenköy",
        "ada": "1402",
        "parsel": "34",
    }
    with httpx.Client(timeout=httpx.Timeout(210.0, connect=30.0), follow_redirects=True, max_redirects=5) as client:
        resp = client.post(base + "/sorgula", json=payload, headers=headers)
        print("Deployed Modal /sorgula HTTP status:", resp.status_code, "redirect count:", len(resp.history), flush=True)
        # Allow only Modal's same-origin long-running request polling redirects.
        for previous in resp.history:
            if previous.status_code != 303 or previous.headers.get("location") is None:
                raise RuntimeError("Unexpected HTTP redirect during e-imar query")
        if resp.url.host != httpx.URL(base).host:
            raise RuntimeError("Redirect led to an unexpected domain")
        if resp.status_code != 200:
            # Never dump request headers (shared secret).
            raise RuntimeError("Modal /sorgula failed: HTTP %s, body: %s" %
                               (resp.status_code, resp.text[:700]))
        data = resp.json()
        if data.get("captcha_tespit_edildi"):
            raise RuntimeError("A municipal captcha is present; cannot validate result")
        report = str(data.get("yorum", ""))
        print("Report excerpt:", report[:380], flush=True)
        if not all(part in report.casefold() for part in ("1402", "34")):
            raise AssertionError("Response does not identify requested parcel")
        result = []
        for k in ("ekran_goruntusu_parca_1", "ekran_goruntusu_parca_2"):
            path = data.get(k)
            if not path or not path.startswith("/shots/"):
                raise AssertionError("Missing expected image link: " + k)
            image_resp = client.get(base + path, headers=headers)
            img = image_resp.content
            if image_resp.status_code != 200 or not img.startswith(b"\x89PNG\r\n\x1a\n") or len(img) < 10000:
                raise AssertionError("Invalid image: %s / HTTP %s / %d bytes" %
                                     (k, image_resp.status_code, len(img)))
            result.append({"image": k, "bytes": len(img), "sha256": hashlib.sha256(img).hexdigest()[:16]})
        print("LIVE MODAL KADIKOY SUCCESS: 2 validated PNG images", result, flush=True)
        return result

@app.local_entrypoint()
def main():
    check_deployed_kadikoy.remote()
