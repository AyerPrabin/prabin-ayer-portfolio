import sys
from rembg import remove, new_session
from PIL import Image
src = sys.argv[1]
im = Image.open(src).convert('RGB')
out = remove(im, session=new_session('u2net_human_seg'))
out.save('cut.png')
print(out.size, out.getbbox())
