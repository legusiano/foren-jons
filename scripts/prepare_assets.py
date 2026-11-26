#!/usr/bin/env python3
"""Prepare full, background-free silver chain cutouts from the repository's own photos.

The source images ship with the project in scripts/sources/, so no
third-party licence is introduced. Only transparent cutouts are published
to public/media/. The mask uses a soft alpha ramp plus a closing
pass: bright metal highlights stay inside the chain instead of being erased as
"background", and the complete outline is kept with a generous margin.

Run from the repository root: python3 scripts/prepare_assets.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "public" / "media"
SOURCES_DIR = ROOT / "scripts" / "sources"

SOURCES = [
    ("bracelet-white.jpg", "chain-01.png", None),
    ("bracelet-grey.jpg", "chain-02.png", None),
    ("chain-parts.png", "chain-03.png", None),
    ("chain-source.webp", "chain-05.png", None),
]


def estimate_background(array: np.ndarray) -> np.ndarray:
    h, w, _ = array.shape
    k = max(12, min(h, w) // 12)
    border = np.concatenate(
        [
            array[:k, :k].reshape(-1, 3),
            array[:k, -k:].reshape(-1, 3),
            array[-k:, :k].reshape(-1, 3),
            array[-k:, -k:].reshape(-1, 3),
        ]
    )
    return np.median(border, axis=0)


def build_alpha(array: np.ndarray, background: np.ndarray) -> np.ndarray:
    distance = np.linalg.norm(array - background, axis=2)

    # Soft ramp keeps antialiased edges and faint reflections.
    soft = np.clip((distance - 5.0) / 26.0, 0.0, 1.0)

    # A closed mask restores bright highlights that sit inside the metal.
    strong = Image.fromarray((distance > 30).astype("uint8") * 255)
    closed = strong.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(7))
    closed = np.asarray(closed).astype(np.float32) / 255.0

    alpha = np.maximum(soft, closed * 0.96)
    alpha = np.asarray(
        Image.fromarray((alpha * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(0.65))
    ).astype(np.float32) / 255.0
    return np.clip(alpha, 0.0, 1.0)


def unpremultiply(array: np.ndarray, background: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    safe = np.maximum(alpha[..., None], 0.08)
    recovered = background + (array - background) / safe
    return np.clip(recovered, 0, 255)


def to_silver(array: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Map the photograph to a cool silver/graphite ramp — no gold, no colour cast."""
    luminance = (
        0.2126 * array[..., 0] + 0.7152 * array[..., 1] + 0.0722 * array[..., 2]
    )
    tone = np.clip((luminance - 45.0) / 155.0, 0.0, 1.0)
    value = 34.0 + tone * 188.0
    rgb = np.stack([value - 3.0, value, value + 3.5], axis=-1)

    # Keep a hint of the original micro-contrast so the metal does not look flat.
    detail = (luminance - np.percentile(luminance, 50)) * 0.06
    rgb = rgb + detail[..., None]
    return np.clip(rgb, 0, 255).astype("uint8"), alpha


def prepare(source: str, target: str, crop: tuple[float, float, float, float] | None) -> None:
    image = Image.open(SOURCES_DIR / source).convert("RGB")
    array = np.asarray(image).astype(np.float32)

    background = estimate_background(array)
    alpha = build_alpha(array, background)
    recovered = unpremultiply(array, background, alpha)
    rgb, alpha = to_silver(recovered, alpha)

    # Crop to the object, but always leave a wide safety margin: nothing is cut off.
    ys, xs = np.where(alpha > 0.14)
    if not len(xs):
        raise RuntimeError(f"No object found in {source}")
    span = max(xs.max() - xs.min(), ys.max() - ys.min())
    pad = int(span * 0.11)
    x0, x1 = max(0, xs.min() - pad), min(array.shape[1], xs.max() + pad + 1)
    y0, y1 = max(0, ys.min() - pad), min(array.shape[0], ys.max() + pad + 1)

    rgb = rgb[y0:y1, x0:x1]
    alpha8 = (alpha[y0:y1, x0:x1] * 255).astype("uint8")
    rgba = np.dstack([rgb, alpha8])

    side = max(rgba.shape[0], rgba.shape[1])
    canvas = np.zeros((side, side, 4), dtype=np.uint8)
    oy = (side - rgba.shape[0]) // 2
    ox = (side - rgba.shape[1]) // 2
    canvas[oy : oy + rgba.shape[0], ox : ox + rgba.shape[1]] = rgba

    cutout = Image.fromarray(canvas, "RGBA")
    target_path = Path(target)
    cutout.save(MEDIA / target_path, optimize=True)
    cutout.save(MEDIA / target_path.with_suffix(".webp"), "WEBP", quality=88, method=6)
    print(
        f"{target}: {side}x{side}, object {int((alpha8 > 40).sum() * 100 / alpha8.size)}%, "
        f"margin {min(x0, y0, rgba.shape[1] - (x1 - x0), rgba.shape[0] - (y1 - y0))}px"
    )


if __name__ == "__main__":
    for args in SOURCES:
        prepare(*args)
