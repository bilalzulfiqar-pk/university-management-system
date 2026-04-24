from __future__ import annotations

import subprocess  # nosec B404
import sys
from pathlib import Path
from shutil import which


REPO_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_DIR = REPO_ROOT / "frontend"
FRONTEND_SOURCE_DIR = FRONTEND_DIR / "src"


def run_check(command: list[str], cwd: Path | None = None) -> None:
    location = cwd or REPO_ROOT
    print(f"Running: {' '.join(command)} (cwd={location})")
    completed = subprocess.run(command, cwd=location)  # nosec B603
    if completed.returncode != 0:
        raise SystemExit(completed.returncode)


def verify_frontend_session_storage() -> None:
    offending_files: list[str] = []
    for file_path in FRONTEND_SOURCE_DIR.rglob("*"):
        if file_path.suffix not in {".ts", ".tsx"}:
            continue
        if "localStorage" in file_path.read_text(encoding="utf-8"):
            offending_files.append(str(file_path.relative_to(REPO_ROOT)))

    if offending_files:
        joined = ", ".join(offending_files)
        raise SystemExit(f"Frontend auth regression: localStorage usage detected in {joined}")


def main() -> None:
    verify_frontend_session_storage()
    run_check([sys.executable, "-m", "bandit", "-q", "-r", "app"])
    run_check([sys.executable, "-m", "pip_audit", ".", "--skip-editable"])
    if FRONTEND_DIR.exists():
        npm_executable = which("npm") or which("npm.cmd") or "npm"
        run_check([npm_executable, "run", "audit:runtime"], cwd=FRONTEND_DIR)


if __name__ == "__main__":
    main()
