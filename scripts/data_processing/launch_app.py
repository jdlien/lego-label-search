#!/usr/bin/env python3
"""
Launcher for Lego Parts Search application.
This launcher starts the application without keeping a terminal window open.
"""
import os
import subprocess
import sys
from pathlib import Path

def main():
    # Get the directory where this script is located
    script_dir = Path(os.path.dirname(os.path.abspath(__file__)))

    # Path to the main Python script
    app_script = script_dir / "lego_parts_search.py"

    print(f"Launching Lego Parts Search...")

    # Launch the app without keeping this script running
    if sys.platform == 'darwin':  # macOS
        subprocess.Popen(
            ['/usr/bin/env', 'python3', str(app_script)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            cwd=str(script_dir),
            start_new_session=True
        )
    else:  # Windows/Linux
        subprocess.Popen(
            [sys.executable, str(app_script)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            cwd=str(script_dir),
            start_new_session=True
        )

    # Exit this script immediately
    sys.exit(0)

if __name__ == "__main__":
    main()