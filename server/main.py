import os
import subprocess
import signal
import sys
import time

print("======================================")
print(" MICROPLASTIC DETECTION SYSTEM STARTED ")
print("======================================\n")

try:
    # ----------------------------
    # Start live detection process
    # ----------------------------
    print("[1] Starting live stream detection...")
    detect_process = subprocess.Popen(
        ["python", "stream_detect.py"],
        cwd=os.path.dirname(__file__)
    )

    print("[INFO] Press CTRL + C to stop detection\n")

    # Keep main process alive
    while True:
        time.sleep(1)

except KeyboardInterrupt:
    print("\n[2] Stopping detection...")
    detect_process.send_signal(signal.SIGINT)
    time.sleep(2)

    # ----------------------------
    # Generate report after stop
    # ----------------------------
    print("[3] Generating report...")
    subprocess.run(
        ["python", "generate_report.py"],
        cwd=os.path.dirname(__file__)
    )

    print("\n======================================")
    print(" SYSTEM SHUTDOWN SUCCESSFUL ")
    print(" Report generated in /reports folder ")
    print("======================================")

    sys.exit(0)
