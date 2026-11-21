# (owner, Nov 21 2026: "a sound effect when the character passes a checkpoint") a short bright rising chime, made
# here (no original file): four bell notes G5 C6 E6 G6 a little apart, then a soft sparkle on top.
# Run:  python3 art-source/sfx/checkpoint_make.py out.wav   then  ffmpeg -i out.wav -b:a 96k www/assets/sfx/checkpoint.mp3
import sys, wave
import numpy as np

SR = 44100
T = 0.9
out = np.zeros(int(SR * T))
t = np.arange(len(out)) / SR


def bell(f, start, dur, vol):
    n0 = int(start * SR)
    tt = t[: len(out) - n0][: int(dur * SR)]
    env = np.minimum(1, tt / 0.004) * np.exp(-tt * 7)
    s = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt * 10)
         + 0.15 * np.sin(2 * np.pi * f * 3.01 * tt) * np.exp(-tt * 16))
    out[n0:n0 + len(tt)] += s * env * vol


for i, f in enumerate([783.99, 1046.5, 1318.5, 1567.98]):
    bell(f, i * 0.065, 0.8, 0.5 if i < 3 else 0.62)
# sparkle: quick high pings
rng = np.random.default_rng(3)
for k in range(6):
    bell(2093 * 2 ** (rng.integers(0, 5) / 12), 0.26 + k * 0.05, 0.25, 0.08)
out /= np.abs(out).max() * 1.12
fade = np.minimum(1, (len(out) - np.arange(len(out))) / (SR * 0.15))
out *= fade
w = wave.open(sys.argv[1], 'wb')
w.setnchannels(1)
w.setsampwidth(2)
w.setframerate(SR)
w.writeframes((out * 32767).astype(np.int16).tobytes())
w.close()
