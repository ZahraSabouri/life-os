"""Builds this folder's Events page with Life OS's display code (events/build_html.py).

This folder holds Xar's events research; the standalone research workflow runs
`python build_html.py` here after each sync, so this stays to run the shared code on it.
"""
from pathlib import Path
import runpy
import sys

HERE = Path(__file__).resolve().parent
sys.argv = [str(HERE.parent / "events" / "build_html.py"), str(HERE)]
runpy.run_path(sys.argv[0], run_name="__main__")
