#!/usr/bin/env python3
"""Moving poster to video: python3 motion.py <name> [loops] [fps]
Takes the frames from FRAMES=n K=1 node render.mjs posters/<name>.js (out/<name>-frames/) and writes
  deliver/motion/<name>.mp4         the poster itself (1080 × 1528), the loop played <loops> times (default 3)
  deliver/motion/<name>-reel.mp4    for Instagram, 30 seconds: the poster centred on black at 9:16 (1080 × 1920), sized so the
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
os.makedirs('deliver/motion', exist_ok=True)
# Hold the finished poster longer (Ben, 26 Nov 2026): find the loop's still stretch (consecutive frames that barely
# change: the poster at rest, finished) and repeat its frames so the rest lasts at least HOLD_SECONDS per loop.
HOLD_SECONDS = 2.5
from PIL import Image, ImageChops, ImageStat
fdir = f'out/{name}-frames'; frames = sorted(f for f in os.listdir(fdir) if f.endswith('.png')); n = len(frames)
small = [Image.open(f'{fdir}/{f}').convert('L').resize((108, 153)) for f in frames]
still = [ImageStat.Stat(ImageChops.difference(small[i], small[(i + 1) % n])).mean[0] < 0.6 for i in range(n)]
best, run, start = (0, 0), 0, 0
for i in range(2 * n):                                   # longest cyclic run of still frames
    if still[i % n]: run += 1; start = start if run > 1 else i
    else: run = 0
    if run > best[0] and run <= n: best = (run, start)
seq = list(range(n))
if best[0] and best[0] < n:
    need = int(round(HOLD_SECONDS * float(fps))) - best[0]
    if need > 0:
        mid = (best[1] + best[0] // 2) % n
        seq = seq[:mid + 1] + [mid] * need + seq[mid + 1:]
        print(f'hold: {best[0]} still frames at {best[1] % n}, +{need} frames ({HOLD_SECONDS}s rest per loop)')
listf = f'out/{name}-seq.txt'
def write_list(loops):
    with open(listf, 'w') as fh:
        for _ in range(loops):
            for i in seq: fh.write(f"file '{os.path.abspath(fdir)}/{frames[i]}'\nduration {1 / float(fps):.6f}\n")
        fh.write(f"file '{os.path.abspath(fdir)}/{frames[seq[-1]]}'\n")
inp = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listf]
enc = ['-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-movflags', '+faststart']
write_list(loops)
subprocess.run(inp + ['-vf', 'scale=1080:1528:flags=lanczos'] + enc + [f'deliver/motion/{name}.mp4'], check=True)
# the Instagram version runs 30 seconds (Ben, 26 Nov 2026: room for more of a good song, and people linger to hear
# it): the loop repeated until it covers REEL_SECONDS, cut there. The archive version stays a few loops (small file).
REEL_SECONDS = 30
write_list(int(REEL_SECONDS // (len(seq) / float(fps))) + 1)
subprocess.run(inp + ['-vf', 'scale=952:1346:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black', '-t', str(REEL_SECONDS)] + enc + [f'deliver/motion/{name}-reel.mp4'], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'out/{name}-frames/0000.png', '-vf', 'scale=952:1346:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black', '-q:v', '2', f'deliver/motion/{name}-reel-cover.jpg'], check=True)
print(f'deliver/motion/{name}.mp4, deliver/motion/{name}-reel.mp4, deliver/motion/{name}-reel-cover.jpg')
