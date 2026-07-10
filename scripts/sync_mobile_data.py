"""Copy the exported JSON into the mobile app.

The Expo app bundles its data at build time (`import ... from '../data/dashboard.json'`),
so it cannot read dashboard-web/public/data at runtime. It therefore keeps its own copy,
and that copy silently goes stale every time an export script runs.

Run this after any of the export_*.py scripts:
    python scripts/sync_mobile_data.py
"""
import filecmp
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "dashboard-web" / "public" / "data"
MOBILE = ROOT / "mobile" / "src" / "data"

# web filename -> mobile filename
FILES = {
    "dashboard_data.json": "dashboard.json",
    "passenger_data.json": "passenger.json",
    "manager_data.json": "manager.json",
}


def main() -> None:
    if not MOBILE.exists():
        raise SystemExit(f"mobile data directory not found: {MOBILE}")

    changed = 0
    for src_name, dst_name in FILES.items():
        src, dst = WEB / src_name, MOBILE / dst_name
        if not src.exists():
            raise SystemExit(f"missing export: {src} — run the export_*.py scripts first")

        if dst.exists() and filecmp.cmp(src, dst, shallow=False):
            print(f"  {dst_name:18s} already up to date")
            continue

        shutil.copyfile(src, dst)
        changed += 1
        print(f"  {dst_name:18s} updated from {src_name}")

    print(f"\n{changed} file(s) changed." if changed else "\nMobile data already in sync.")


if __name__ == "__main__":
    main()
