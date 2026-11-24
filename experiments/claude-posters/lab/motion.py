#!/usr/bin/env python3
"""Moving poster to video: python3 motion.py <name> [loops] [fps]
Takes the frames from FRAMES=n K=1 node render.mjs posters/<name>.js (out/<name>-frames/) and writes
  deliver/motion/<name>.mp4         the poster itself (1080 × 1528), the loop played <loops> times (default 3)
  deliver/motion/<name>-reel.mp4    for Instagram: the poster centred on black at 9:16 (1080 × 1920)
Frames play at <fps> (default 12, a stop-motion print look), written out at 24 fps.
"""
import os, subprocess, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
name = sys.argv[1]; loops = int(sys.argv[2]) if len(sys.argv) > 2 else 3; fps = sys.argv[3] if len(sys.argv) > 3 else '12'
src = f'out/{name}-frames/%04d.png'; os.makedirs('deliver/motion', exist_ok=True)
base = ['ffmpeg', '-y', '-loglevel', 'error', '-stream_loop', str(loops - 1), '-framerate', fps, '-i', src]
enc = ['-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-movflags', '+faststart']
subprocess.run(base + ['-vf', 'scale=1080:1528:flags=lanczos'] + enc + [f'deliver/motion/{name}.mp4'], check=True)
subprocess.run(base + ['-vf', 'scale=908:1284:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black'] + enc + [f'deliver/motion/{name}-reel.mp4'], check=True)
print(f'deliver/motion/{name}.mp4, deliver/motion/{name}-reel.mp4')
