#!/usr/bin/env python3
"""Execute the bundled notebook against backend/dataset.csv. No sample/random result generation."""
import argparse, subprocess, sys
from pathlib import Path
BASE=Path(__file__).resolve().parent

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--notebook',default=str(BASE/'notebook.ipynb')); args=ap.parse_args()
    out=BASE/'results'; out.mkdir(exist_ok=True)
    cmd=[sys.executable,'-m','jupyter','nbconvert','--to','notebook','--execute','--ExecutePreprocessor.timeout=1200','--output','executed_notebook.ipynb','--output-dir',str(out),args.notebook]
    print('Executing:',args.notebook); subprocess.run(cmd,cwd=str(BASE),check=True); print('Done.')
if __name__=='__main__': main()
