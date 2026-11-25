"""Modal deployment of existing, unmodified Kumtas imar automation.

Deploy from the imar-api directory:
  modal secret create kumtas-imar-gateway IMAR_GATEWAY_SECRET=YOUR_RANDOM_SECRET
  modal deploy modal_app.py
Requires a Modal account and an activated free plan. Deployment isn't automatic.
"""
from pathlib import Path
import modal

ROOT = Path(__file__).parent
image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("fastapi>=0.115,<1", "uvicorn>=0.30,<1",
                 "playwright==1.58.0", "pydantic>=2,<3", "Pillow>=11,<13")
    .run_commands("python -m playwright install --with-deps chromium")
    .add_local_file(ROOT / "app_sadece_tkgm_duzeltildi.py",
                    remote_path="/root/app_sadece_tkgm_duzeltildi.py")
    .add_local_file(ROOT / "web_app.py", remote_path="/root/web_app.py")
)
app = modal.App("kumtas-imar-backend")

@app.function(
    image=image,
    cpu=2,
    memory=4096,
    timeout=180,
    max_containers=1,
    secrets=[modal.Secret.from_name("kumtas-imar-gateway")],
)
@modal.asgi_app()
def api():
    import sys
    sys.path.insert(0, "/root")
    from web_app import app as fastapi_app
    return fastapi_app
