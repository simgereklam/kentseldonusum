"""One-off GitHub Actions smoke test. Never alters the working automation."""
import asyncio
import json
from pathlib import Path
import traceback

from app_sadece_tkgm_duzeltildi import SorguIstegi, parsel_sorgula

root = Path("test-outputs")
root.mkdir(exist_ok=True)

async def main():
    data = dict(kaynak="belediye", il="İstanbul", ilce="Kadıköy",
                mahalle="Erenköy", ada="1402", parsel="34")
    try:
        response = await parsel_sorgula(SorguIstegi(**data))
        (root / "response.json").write_text(
            json.dumps(response, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        paths = [
            response.get("ekran_goruntusu_parca_1"),
            response.get("ekran_goruntusu_parca_2"),
        ]
        if any(not p for p in paths):
            raise AssertionError("Expected screenshot path missing in API response")
        for public_path in paths:
            path = Path("screenshots") / Path(public_path).name
            if not path.is_file() or path.stat().st_size < 10000:
                raise AssertionError(f"Screenshot missing or too small: {path}")
            (root / path.name).write_bytes(path.read_bytes())
        print("SMOKE TEST FINISHED; screenshot count:", len(paths))
        print("Result URL:", response.get("url"))
        print("Summary:", response.get("yorum"))
        print("NOTE: passing means images were saved, not that cadastral data are authoritative.")
    except Exception:
        (root / "error.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise

if __name__ == "__main__":
    asyncio.run(main())
