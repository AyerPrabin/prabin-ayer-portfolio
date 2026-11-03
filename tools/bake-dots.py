# bust cut-out + AI depth -> point cloud. Uint16 triples (x, y, depth<<8 | brightness) on a 250-wide grid.
# Head depth is normalised on its own so the face has relief; body keeps the global depth + local folds.
import numpy as np, cv2, sys
from PIL import Image
OUT = sys.argv[1]
CROP = (500, 205, 1280, 905)
im = Image.open('cut.png').convert('RGBA').crop(CROP)
W = 250; H = round(im.height * W / im.width)
a = np.array(im.resize((W, H), Image.LANCZOS)).astype(np.float32)
mask = (a[..., 3] > 128).astype(np.uint8)
lum = (0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]).astype(np.uint8)
eq = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(6, 6)).apply(lum)
d = cv2.resize(np.load('depth.npy'), (W, H), interpolation=cv2.INTER_AREA)
yy, xx = np.mgrid[0:H, 0:W]
HX, HY, RX, RY = 97, 44, 36, 44
e = np.hypot((xx - HX) / RX, (yy - HY) / RY)
head = (e < 1.05) & (mask > 0)
zb = d * 0.55 + np.clip((d - cv2.GaussianBlur(d, (0, 0), 6)) * 6, -.25, .25)    # body: overall + folds
hv = d[head]; hz = np.clip((d - np.percentile(hv, 3)) / (np.percentile(hv, 99) - np.percentile(hv, 3)), 0, 1)
dome = np.sqrt(np.clip(1 - np.minimum(e, 1) ** 2, 0, 1))                          # keep the skull round at the edges
zh = 0.45 + 0.55 * (0.6 * hz + 0.4 * dome)
w = np.clip((1.12 - e) / 0.2, 0, 1)
z = np.where(head, zh * w + zb * (1 - w), zb)
z = cv2.GaussianBlur(np.clip(z, 0, 1).astype(np.float32), (0, 0), 0.8)
ys, xs = np.nonzero(mask)
keep = np.random.default_rng(7).random(len(xs)) < 1.0   # every pixel: fine, dense dots
xs, ys = xs[keep], ys[keep]
zq = np.clip(z[ys, xs] * 255, 0, 255).astype(np.uint16)
l = np.clip(eq[ys, xs].astype(np.float32) * 1.15 + 25, 0, 255).astype(np.uint16)
pts = np.stack([xs, ys, (zq << 8) | l], 1).astype('<u2')
open(OUT + '/portrait-dots.bin', 'wb').write(pts.tobytes())
Image.fromarray((z * mask * 255).astype(np.uint8)).resize((W * 2, H * 2)).save('zfinal.png')
print('points', len(pts), W, H)
