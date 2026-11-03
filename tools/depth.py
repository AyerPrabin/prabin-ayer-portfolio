# Depth Anything V2 (small) on the bust crop of the ORIGINAL photo -> depth.npy (near = 1) + preview
import numpy as np, onnxruntime as ort
from PIL import Image
CROP = (500, 205, 1280, 905)
im = Image.open('assets/img/portrait.jpg').convert('RGB').crop(CROP)
w, h = 518, 462
x = np.asarray(im.resize((w, h), Image.BICUBIC), np.float32) / 255
x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
x = x.transpose(2, 0, 1)[None].astype(np.float32)
d = ort.InferenceSession('C:/Users/ayerp/.cache/depth/model.onnx').run(None, {'pixel_values': x})[0][0]
d = np.asarray(Image.fromarray(d).resize(im.size, Image.BICUBIC))
m = np.asarray(Image.open('cut.png').convert('RGBA').crop(CROP))[..., 3] > 128
v = d[m]; lo, hi = np.percentile(v, 2), np.percentile(v, 99.5)
dn = np.clip((d - lo) / (hi - lo), 0, 1) * m
np.save('depth.npy', dn.astype(np.float32))
Image.fromarray((dn * 255).astype(np.uint8)).save('depth.png')
print('ok', d.shape, lo, hi)
