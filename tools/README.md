# Hero dot sculpture: how the data is made

Run from the repo root (Python 3, `pip install rembg onnxruntime opencv-python pillow numpy`):

1. `python tools/cutout.py assets/img/portrait.jpg` writes `cut.png` (you, background removed: rembg u2net_human_seg)
2. `python tools/depth.py` writes `depth.npy` (Depth Anything V2 small, ONNX; put `model.onnx` in `~/.cache/depth/`)
3. `python tools/bake-dots.py assets/img` writes `assets/img/portrait-dots.bin`

The crop (`CROP`) and head ellipse (`HX, HY, RX, RY`) must match `HEAD` / `NECK` / `GW` / `GH` in `assets/js/dot-hero.js`.
`cut.png`, `depth.npy` and the previews are scratch files: don't commit them.
