"""Start the server and log output to files."""
import subprocess, sys, os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with open("server_log.txt", "w") as log:
    log.write("=== TILAWA Server Launcher ===\n")
    log.flush()
    
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"],
        stdout=log,
        stderr=subprocess.STDOUT,
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    
    # Wait max 15 seconds for startup, then leave it running
    try:
        proc.wait(timeout=15)
        log.write(f"\n=== Server exited with code {proc.returncode} ===\n")
    except subprocess.TimeoutExpired:
        log.write("\n=== Server is running (15s startup OK) ===\n")
        # Write PID so we can kill it later
        with open("server_pid.txt", "w") as f:
            f.write(str(proc.pid))
