# (owner, Nov 28 2026) /angry: his angry face, expressions/angry.aseprite (one frame, 48 x 50 canvas with the whole
# character), cut like expr_cry_omg_cut.py (only the face pixels, sprite rows 7..22, that differ from the standing
# frame; mirrored to face right, x6, every skin tone) -> <skin>/expr_angry.png. Used by js/player/emotes.js.
# The character is found on his bigger canvas by matching default_look.aseprite's silhouette.
# Run:  python3 art-source/character/expr_angry_cut.py <project root>
import sys
import numpy as np

ROOT = sys.argv[1]
_src = open(ROOT + '/art-source/character/expr_cry_omg_cut.py').read()
exec(_src[:_src.index('cry = read_frames(')])  # its readers, fit, skin tones and save() (nothing written by that part)

fr = read_frames(HERE + 'expressions/angry.aseprite')[0]
h, w = look.shape[:2]
lm, fm = look[..., 3] > 0, fr[..., 3] > 0
best = max(((np.sum(fm[y:y + h, x:x + w] & lm) - np.sum(fm[y:y + h, x:x + w] ^ lm), x, y)
            for y in range(fr.shape[0] - h + 1) for x in range(fr.shape[1] - w + 1)))
_, x, y = best
print('body at', x, y, 'fit', best[0], 'of', int(lm.sum()))
print('expr_angry', save(fit(fr[y:y + h, x:x + w]), 'expr_angry'), 'px')
