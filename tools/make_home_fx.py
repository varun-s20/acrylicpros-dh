#!/usr/bin/env python3
"""Generate the homepage atmosphere assets into assets/home/.

The reference design leans on two pieces of proprietary media — a looping
white-smoke video and a white cloud band. Neither may be reused, so both are
synthesised here from spectral (FFT) noise. FFT noise is periodic on every
axis, which gives two properties for free:

  * the cloud band tiles horizontally (it is used with repeat-x), and
  * the smoke video loops seamlessly, because time is one of the axes.

Also writes fin.png: the fin mark cut out of the white logo, used as the
prefooter watermark and the gallery tile badge.

    python tools/make_home_fx.py          # needs numpy, Pillow, scipy, ffmpeg

Deterministic (fixed seeds), so re-running reproduces the same files.
"""
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "home")


def spectral_noise(shape, beta, seed, time_cutoff=None):
    """Periodic 1/f^beta noise normalised to 0..1.

    For a 3-D (t, y, x) field, `time_cutoff` keeps only the slowest temporal
    frequencies so the smoke drifts and boils instead of flickering.
    """
    rng = np.random.default_rng(seed)
    freqs = np.meshgrid(*[np.fft.fftfreq(n).astype(np.float32) for n in shape],
                        indexing="ij", sparse=True)
    spatial = freqs[-2:] if len(shape) == 3 else freqs
    k = np.sqrt(sum(f * f for f in spatial))
    k[k == 0] = np.inf  # drop the DC term
    amp = k ** (-beta)
    if time_cutoff is not None:
        amp = amp * (np.abs(freqs[0]) * shape[0] <= time_cutoff)
    phase = rng.uniform(0, 2 * np.pi, shape).astype(np.float32)
    field = np.fft.ifftn(amp * np.exp(1j * phase)).real.astype(np.float32)
    field -= field.min()
    field /= field.max()
    return field


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def make_cloud():
    """White cloud band, 2690x380 RGBA: solid at the bottom, wisps at the top."""
    w, h = 2690, 380
    n = spectral_noise((h, w // 3), beta=1.6, seed=7)
    # Stretch horizontally: clouds read wider than tall.
    n = np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC),
                   dtype=np.float32) / 255
    fine = spectral_noise((h, w), beta=1.4, seed=11)
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    density = y * 2.0 + (n - 0.5) * 1.1 + (fine - 0.5) * 0.35 - 0.95
    alpha = smoothstep(0.0, 0.7, density)
    alpha = np.maximum(alpha, smoothstep(0.7, 0.95, y))  # guaranteed solid base
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., :3] = 255
    rgba[..., 3] = (alpha * 255).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, "cloud.png"), optimize=True)


def make_smoke():
    """White smoke on black, 1304x576, 10 s seamless loop (screen-blended in CSS)."""
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        sys.exit("ffmpeg not found on PATH")
    fps, frames = 24, 240
    h, w = 144, 326  # rendered small, upscaled 4x: smoke should be soft
    vol = spectral_noise((frames, h, w), beta=2.2, seed=3, time_cutoff=3)
    detail = spectral_noise((frames, h, w), beta=1.6, seed=5, time_cutoff=5)
    y = np.linspace(0, 1, h, dtype=np.float32)[None, :, None]
    field = vol * 0.8 + detail * 0.2
    lum = smoothstep(0.25, 0.8, field) * smoothstep(0.05, 0.9, y)
    lum = np.clip(lum * 1.15, 0, 1)
    tmp = tempfile.mkdtemp()
    try:
        for i in range(frames):
            Image.fromarray((lum[i] * 255).astype(np.uint8), "L").save(
                os.path.join(tmp, "f%04d.png" % i))
        subprocess.run([
            ffmpeg, "-v", "error", "-y", "-framerate", str(fps),
            "-i", os.path.join(tmp, "f%04d.png"),
            "-vf", "scale=1304:576:flags=bicubic,format=yuv420p",
            "-c:v", "libx264", "-preset", "slow", "-crf", "30",
            "-movflags", "+faststart", "-an",
            os.path.join(OUT, "smoke.mp4"),
        ], check=True)
    finally:
        shutil.rmtree(tmp)


def make_fin():
    """The fin (largest connected shapes left of the wordmark), white on transparent."""
    logo = Image.open(os.path.join(ROOT, "assets", "images", "brand", "logo-primary-white.png"))
    alpha = np.asarray(logo.getchannel("A")) > 40
    labels, count = ndimage.label(alpha)
    boxes = ndimage.find_objects(labels)
    keep = np.zeros_like(alpha)
    for idx, box in enumerate(boxes, start=1):
        ys, xs = box
        # Fin parts start in the left third and are tall; letters are not.
        if xs.start < 560 and (ys.stop - ys.start) > 60:
            keep |= labels == idx
    ys, xs = np.nonzero(keep)
    crop = keep[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    a = np.asarray(logo.getchannel("A"))[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    rgba = np.zeros(crop.shape + (4,), np.uint8)
    rgba[..., :3] = 255
    rgba[..., 3] = np.where(crop, a, 0)
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, "fin.png"), optimize=True)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    make_cloud()
    make_fin()
    make_smoke()
    for name in ("cloud.png", "fin.png", "smoke.mp4"):
        print("%-10s %7d bytes" % (name, os.path.getsize(os.path.join(OUT, name))))
