# -*- coding: utf-8 -*-
"""Generate the AI person-counting demo clip.

Pipeline (fully reproducible, no manual assets):
  1. Pull real person cut-outs from ultralytics' bundled sample images using a
     YOLO segmentation model (so the moving figures are genuine people).
  2. Composite them walking along a synthetic station platform.
  3. Run YOLO *detection* on each rendered frame and draw boxes + a live count.
  4. Encode to an H.264 MP4 the browser can play.

The same detection step works on real CCTV footage — see run_person_count() at the
bottom; point it at any video file to count live.
"""
import os, io
import numpy as np
import cv2
from ultralytics import YOLO
from ultralytics.utils import ASSETS
import imageio

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "dashboard-web", "public", "demo", "station_count.mp4")
W, H, FPS, N_FRAMES = 1280, 720, 24, 120
ACCENT = (80, 168, 197)  # BGR of #C5A880-ish

rng = np.random.default_rng(7)


def extract_people_sprites():
    """Return a list of BGRA person cut-outs from bundled sample images."""
    seg = YOLO("yolov8n-seg.pt")
    sprites = []
    for name in ["zidane.jpg", "bus.jpg"]:
        path = str(ASSETS / name)
        img = cv2.imread(path)
        res = seg(path, verbose=False)[0]
        if res.masks is None:
            continue
        for i, cls in enumerate(res.boxes.cls.tolist()):
            if int(cls) != 0:  # person only
                continue
            x1, y1, x2, y2 = [int(v) for v in res.boxes.xyxy[i].tolist()]
            if (x2 - x1) < 40 or (y2 - y1) < 80:
                continue
            mask = np.zeros(img.shape[:2], np.uint8)
            poly = res.masks.xy[i].astype(np.int32)
            cv2.fillPoly(mask, [poly], 255)
            crop = img[y1:y2, x1:x2]
            alpha = mask[y1:y2, x1:x2]
            sprites.append(np.dstack([crop, alpha]))
    return sprites


def make_platform():
    """Draw a simple, clean station-platform background (BGR)."""
    bg = np.zeros((H, W, 3), np.uint8)
    # wall gradient (top) -> floor (bottom)
    for y in range(H):
        if y < H * 0.55:
            t = y / (H * 0.55)
            bg[y, :] = (int(40 + 18 * t), int(44 + 20 * t), int(52 + 22 * t))
        else:
            t = (y - H * 0.55) / (H * 0.45)
            bg[y, :] = (int(70 - 20 * t), int(66 - 18 * t), int(62 - 16 * t))
    # platform edge + tactile yellow line
    edge = int(H * 0.78)
    cv2.rectangle(bg, (0, edge), (W, edge + 8), (0, 200, 230), -1)
    cv2.rectangle(bg, (0, edge + 8), (W, H), (54, 50, 46), -1)
    # pillars
    for px in [180, 640, 1100]:
        cv2.rectangle(bg, (px - 16, 60), (px + 16, edge), (60, 58, 55), -1)
    # signage
    cv2.rectangle(bg, (W // 2 - 150, 40), (W // 2 + 150, 96), (30, 32, 38), -1)
    cv2.putText(bg, "PLATFORM 2  -  LONDON", (W // 2 - 132, 78),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 205), 2, cv2.LINE_AA)
    return bg


def alpha_paste(frame, sprite, cx, cy):
    """Paste a BGRA sprite centred at (cx, cy) onto BGR frame."""
    sh, sw = sprite.shape[:2]
    x1, y1 = int(cx - sw / 2), int(cy - sh)
    x2, y2 = x1 + sw, y1 + sh
    fx1, fy1, fx2, fy2 = max(0, x1), max(0, y1), min(W, x2), min(H, y2)
    if fx1 >= fx2 or fy1 >= fy2:
        return
    sx1, sy1 = fx1 - x1, fy1 - y1
    region = sprite[sy1:sy1 + (fy2 - fy1), sx1:sx1 + (fx2 - fx1)]
    a = (region[:, :, 3:4].astype(float)) / 255.0
    frame[fy1:fy2, fx1:fx2] = (
        region[:, :, :3].astype(float) * a + frame[fy1:fy2, fx1:fx2].astype(float) * (1 - a)
    ).astype(np.uint8)


def build():
    sprites = extract_people_sprites()
    if not sprites:
        raise SystemExit("No person sprites extracted.")
    detector = YOLO("yolov8n.pt")
    platform = make_platform()
    edge = int(H * 0.78)

    # actors moving across the platform
    actors = []
    for k in range(6):
        s = sprites[k % len(sprites)]
        target_h = int(rng.integers(190, 300))
        scale = target_h / s.shape[0]
        sp = cv2.resize(s, (max(1, int(s.shape[1] * scale)), target_h))
        actors.append({
            "spr": sp,
            "x": float(rng.integers(0, W)),
            "y": int(edge + rng.integers(10, 60)),
            "v": float(rng.choice([-1, 1]) * rng.uniform(1.6, 3.4)),
            "phase": rng.uniform(0, 6.28),
        })

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    writer = imageio.get_writer(OUT, fps=FPS, codec="libx264",
                                output_params=["-pix_fmt", "yuv420p"], macro_block_size=8)

    for f in range(N_FRAMES):
        frame = platform.copy()
        for a in actors:
            a["x"] += a["v"]
            if a["x"] < -120:
                a["x"] = W + 120
            if a["x"] > W + 120:
                a["x"] = -120
            bob = int(4 * np.sin(f * 0.4 + a["phase"]))
            alpha_paste(frame, a["spr"], a["x"], a["y"] + bob)

        # real YOLO detection on the rendered frame
        res = detector(frame, verbose=False, conf=0.35)[0]
        count = 0
        for i, cls in enumerate(res.boxes.cls.tolist()):
            if int(cls) != 0:
                continue
            count += 1
            x1, y1, x2, y2 = [int(v) for v in res.boxes.xyxy[i].tolist()]
            conf = float(res.boxes.conf[i])
            cv2.rectangle(frame, (x1, y1), (x2, y2), ACCENT, 2)
            cv2.putText(frame, f"person {conf:.2f}", (x1, max(14, y1 - 6)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, ACCENT, 1, cv2.LINE_AA)

        # header overlay
        cv2.rectangle(frame, (0, 0), (W, 40), (12, 14, 18), -1)
        cv2.putText(frame, f"AI PEOPLE COUNT: {count}", (16, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, ACCENT, 2, cv2.LINE_AA)
        cv2.putText(frame, "YOLOv8  *  Platform CCTV (demo)", (W - 360, 26),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (180, 180, 185), 1, cv2.LINE_AA)

        writer.append_data(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

    writer.close()
    print("Wrote", OUT)


def run_person_count(video_path, out_path=None, model="yolov8n.pt"):
    """Count people in a real video, frame by frame, writing an annotated copy."""
    det = YOLO(model)
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24
    out_path = out_path or (os.path.splitext(video_path)[0] + "_counted.mp4")
    writer = None
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        res = det(frame, verbose=False, conf=0.35)[0]
        count = sum(1 for c in res.boxes.cls.tolist() if int(c) == 0)
        annotated = res.plot()
        cv2.putText(annotated, f"People: {count}", (16, 32),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (80, 168, 197), 2, cv2.LINE_AA)
        if writer is None:
            h, w = annotated.shape[:2]
            writer = imageio.get_writer(out_path, fps=fps, codec="libx264",
                                        output_params=["-pix_fmt", "yuv420p"], macro_block_size=8)
        writer.append_data(cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB))
    if writer:
        writer.close()
    cap.release()
    print("Wrote", out_path)


if __name__ == "__main__":
    build()
