"""Genera el video con transparencia del colibrí de la portada.

Uso (desde la raíz del proyecto):  python scripts/build-colibri-video.py
Requiere: opencv-python, numpy y ffmpeg (en el PATH o en la variable FFMPEG).

Combina videos/animacion.mp4 (original, fondo gris) con su versión recortada
(fondo negro) para reconstruir un canal alfa suave, invierte el vuelo para que
el ave mire hacia la derecha como el símbolo del logo y escribe
videos/colibri-vuelo.mp4: el color arriba y el canal alfa abajo, porque MP4 no
guarda transparencia. colibri-vuelo.js los vuelve a unir al reproducirlo.
"""
import os
import subprocess
import cv2
import numpy as np

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGINAL = os.path.join(BASE, 'videos', 'animacion.mp4')
KEYED = os.path.join(BASE, 'videos', '8e25a593-1fa4-48f9-8c1f-75c0b07cecdf.mp4')
OUT = os.path.join(BASE, 'videos', 'colibri-vuelo.mp4')
LAST = 200          # desde aquí el ave ya está posada e inmóvil
FIRST = 2           # el primer fotograma del recorte no está recortado
FPS = 24
SIZE = (960, 540)
EDGE = 28           # px de desvanecido en los bordes del encuadre


def load(path):
    capture, frames = cv2.VideoCapture(path), []
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        frames.append(frame)
    return frames


def edge_fade(w, h):
    x = np.clip(np.minimum(np.arange(w), w - 1 - np.arange(w)) / EDGE, 0, 1)
    y = np.clip(np.minimum(np.arange(h), h - 1 - np.arange(h)) / EDGE, 0, 1)
    return np.outer(y, x).astype(np.float32)


def matte(original, keyed, plate):
    o, k = original.astype(np.float32), keyed.astype(np.float32)
    key = (k.sum(2) / np.maximum(o.sum(2), 1) > .5).astype(np.uint8)
    # Quita motas sueltas del recorte.
    count, labels, stats, _ = cv2.connectedComponentsWithStats(key, connectivity=8)
    if count > 1:
        areas = stats[1:, cv2.CC_STAT_AREA]
        keep = np.flatnonzero(areas >= max(40, areas.max() * .02)) + 1
        key = np.isin(labels, keep).astype(np.uint8)
    key = cv2.erode(key, np.ones((3, 3), np.uint8)).astype(np.float32)
    feather = cv2.GaussianBlur(cv2.erode(key, np.ones((5, 5), np.uint8)), (0, 0), 4)
    inside = cv2.GaussianBlur(cv2.erode(key, np.ones((21, 21), np.uint8)), (0, 0), 6) * .85
    key = cv2.GaussianBlur(key, (0, 0), 1.2)
    # Las alas desenfocadas quedan translúcidas según cuánto difieren del fondo.
    diff = cv2.GaussianBlur(np.abs(o - plate).max(2), (0, 0), 1)
    soft = np.maximum(np.clip((diff - 5) / 29, 0, 1), inside)  # sin huecos dentro del ala
    core = cv2.dilate((diff > 46).astype(np.uint8), np.ones((9, 9), np.uint8))
    core = cv2.GaussianBlur(core.astype(np.float32), (0, 0), 2)
    # Cuerpo con borde nítido; alas con borde difuminado para tapar el recorte dentado.
    alpha = key * core + feather * soft * (1 - core)
    color = np.clip((o - (1 - alpha[..., None]) * plate) / np.maximum(alpha, 1e-3)[..., None], 0, 255)
    return color, alpha


def main():
    originals, keyeds = load(ORIGINAL), load(KEYED)
    plate = cv2.GaussianBlur(originals[0], (0, 0), 3).astype(np.float32)
    h, w = originals[0].shape[:2]
    fade = edge_fade(w, h)
    encoder = subprocess.Popen([
        os.environ.get('FFMPEG', 'ffmpeg'), '-y', '-loglevel', 'error',
        '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{SIZE[0]}x{SIZE[1] * 2}', '-r', str(FPS), '-i', '-',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', '-an', OUT], stdin=subprocess.PIPE)
    for source in range(FIRST, LAST + 1):
        color, alpha = matte(originals[source], keyeds[source], plate)
        alpha = (alpha * fade)[..., None]
        # Color premultiplicado arriba, alfa en gris abajo.
        stacked = np.vstack([color * alpha, np.repeat(alpha * 255, 3, axis=2)]).astype(np.uint8)
        stacked = cv2.resize(cv2.flip(stacked, 1), (SIZE[0], SIZE[1] * 2), interpolation=cv2.INTER_AREA)
        encoder.stdin.write(stacked.tobytes())
    encoder.stdin.close()
    encoder.wait()
    print(f'{LAST - FIRST + 1} fotogramas, {os.path.getsize(OUT) / 1024:.0f} KB en {OUT}')


if __name__ == '__main__':
    main()
