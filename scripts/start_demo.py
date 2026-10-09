#!/usr/bin/env python3
import os
import shutil
import signal
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND_DIR = ROOT / "frontend"


def wait_for(url: str, label: str, timeout_seconds: int = 45) -> bool:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=3) as response:
                if response.status < 500:
                    print(f"{label} ready at {url}")
                    return True
        except Exception:
            time.sleep(1)
    print(f"{label} did not respond at {url} within {timeout_seconds}s.", file=sys.stderr)
    return False


def start_process(command: list[str], cwd: Path, env: dict[str, str] | None = None) -> subprocess.Popen[str]:
    return subprocess.Popen(command, cwd=str(cwd), env=env, stdout=None, stderr=None, stdin=None)


def terminate(proc: subprocess.Popen[str] | None) -> None:
    if proc is None or proc.poll() is not None:
        return
    if os.name == "nt":
        proc.terminate()
    else:
        proc.send_signal(signal.SIGINT)
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()


if __name__ == "__main__":
    env = os.environ.copy()
    env.setdefault("PYTHONPATH", str(ROOT))

    backend_cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"]
    npm_cmd = shutil.which("npm") or shutil.which("npm.cmd") or "npm"
    frontend_cmd = [npm_cmd, "run", "dev", "--", "--host", "127.0.0.1"]

    backend_proc = start_process(backend_cmd, ROOT, env)
    frontend_proc = start_process(frontend_cmd, FRONTEND_DIR, env)

    try:
        backend_ready = wait_for("http://127.0.0.1:8000/health", "Backend")
        frontend_ready = wait_for("http://127.0.0.1:5173", "Frontend")

        if backend_ready and frontend_ready:
            print("\nDemo is ready:")
            print("  Backend: http://127.0.0.1:8000/docs")
            print("  Frontend: http://127.0.0.1:5173")
            try:
                import webbrowser
                webbrowser.open("http://127.0.0.1:5173")
            except Exception:
                pass
            while True:
                time.sleep(1)
        else:
            raise RuntimeError("One or more demo services did not start correctly.")
    except KeyboardInterrupt:
        print("\nShutting down demo services...")
    finally:
        terminate(backend_proc)
        terminate(frontend_proc)
        print("Demo services stopped.")
