#!/usr/bin/env python3
"""Moving poster to video: python3 motion.py <name> [loops] [fps]
Takes the frames from FRAMES=n K=1 node render.mjs posters/<name>.js (out/<name>-frames/) and writes
  deliver/motion/<name>.mp4         the poster itself (1080 × 1528), the loop played <loops> times (default 3)
  deliver/motion/<name>-reel.mp4    for Instagram: the poster centred on black at 9:16 (1080 × 1920), sized so the
                                    profile grid's 3:4 crop shows it exactly like the static posts (Ben, 26 Nov)
  deliver/motion/<name>-reel-cover.jpg  the first frame in the same layout, to set as the reel's cover
Static posts are the poster 1262 px tall on a 1080 × 1350 black frame (scripts/instagram/images.mjs mockup); the grid
crops them to a 3:4 tile, so the poster fills 93.5% of the tile's height. The grid crops a reel to its centre 1080 × 1440,
so the reel's poster is 1346 px tall (93.5% of 1440) and 952 px wide, centred.
Frames play at <fps> (default 12, a stop-motion print look), written out at 24 fps.
"""
import os, subprocess, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
name = sys.argv[1]; loops = int(sys.argv[2]) if len(sys.argv) > 2 else 3; fps = sys.argv[3] if len(sys.argv) > 3 else '12'
src = f'out/{name}-frames/%04d.png'; os.makedirs('deliver/motion', exist_ok=True)
base = ['ffmpeg', '-y', '-loglevel', 'error', '-stream_loop', str(loops - 1), '-framerate', fps, '-i', src]
enc = ['-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-movflags', '+faststart']
subprocess.run(base + ['-vf', 'scale=1080:1528:flags=lanczos'] + enc + [f'deliver/motion/{name}.mp4'], check=True)
subprocess.run(base + ['-vf', 'scale=952:1346:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black'] + enc + [f'deliver/motion/{name}-reel.mp4'], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'out/{name}-frames/0000.png', '-vf', 'scale=952:1346:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black', '-q:v', '2', f'deliver/motion/{name}-reel-cover.jpg'], check=True)
print(f'deliver/motion/{name}.mp4, deliver/motion/{name}-reel.mp4, deliver/motion/{name}-reel-cover.jpg')
