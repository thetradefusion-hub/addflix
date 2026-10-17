"""Build transparent brand + prop cutouts for the landing hero."""
from pathlib import Path
import shutil
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path.home() / ".cursor" / "projects" / "c-Users-i-OneDrive-Desktop-addflix" / "assets"
OUT = ROOT / "public" / "landing"
PUBLIC = ROOT / "public"


def black_to_alpha(img: Image.Image, threshold: int = 18) -> Image.Image:
    rgba = img.convert("RGBA")
    arr = np.asarray(rgba).copy()
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    darkness = np.maximum(np.maximum(r, g), b)
    fade = np.clip((darkness.astype(np.float32) - threshold) / 16.0, 0.0, 1.0)
    arr[:, :, 3] = (arr[:, :, 3].astype(np.float32) * fade).astype(np.uint8)
    return Image.fromarray(arr)


def save(img: Image.Image, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, optimize=True)
    print(f"wrote {dst.name} ({dst.stat().st_size} bytes) {img.size}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    emblem_src = PUBLIC / "Glossy Red Play Emblem with A and Arrow.png"
    shutil.copy2(emblem_src, OUT / "brand-emblem.png")
    print(f"copied brand-emblem.png")

    word_src = ASSETS / "addflix-wordmark-blackbg.jpg"
    if not word_src.exists():
        word_src = ASSETS / "addflix-wordmark-blackbg.png"
    word = Image.open(word_src)
    w, h = word.size
    # Keep the ADDFLIX word band under the emblem
    crop = word.crop((int(w * 0.06), int(h * 0.48), int(w * 0.94), int(h * 0.82)))
    save(black_to_alpha(crop, 16), OUT / "brand-wordmark.png")

    props = [
        ("hero-prop-popcorn-clear.jpg", "hero-prop-popcorn.png", 14),
        ("hero-prop-sofa-clear.jpg", "hero-prop-sofa.png", 12),
    ]
    for src_name, dst_name, thr in props:
        src = ASSETS / src_name
        if not src.exists():
            print(f"skip {src_name}")
            continue
        save(black_to_alpha(Image.open(src), thr), OUT / dst_name)


if __name__ == "__main__":
    main()
