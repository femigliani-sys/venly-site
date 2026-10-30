"""Gera as artes demonstrativas em PNG (mapas e produtos).

Nenhum projeto, cliente ou produto real é representado aqui — todas as imagens
contêm a marcação "IMAGEM DEMONSTRATIVA" e podem ser substituídas pelo painel.
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.join(os.getcwd(), "public", "demo")
MAPS = os.path.join(ROOT, "maps")
PRODUCTS = os.path.join(ROOT, "products")
os.makedirs(MAPS, exist_ok=True)
os.makedirs(PRODUCTS, exist_ok=True)

LOGO = Image.open(os.path.join(os.getcwd(), "public", "logo.png")).convert("RGBA")
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
MONO_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
F_TINY = ImageFont.truetype(MONO, 14)
F_SMALL = ImageFont.truetype(MONO, 16)
F_BOLD = ImageFont.truetype(MONO_BOLD, 17)
PINK = (255, 0, 143, 255)
PINK_LIGHT = (255, 110, 190, 255)
WHITE = (255, 255, 255, 210)


def canvas(w, h, cx, cy, spread=1.0):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((x - cx) / (390 * spread)) ** 2 + ((y - cy) / (300 * spread)) ** 2)
    glow = np.exp(-(r ** 2) * 1.7)
    vignette = 1 - np.clip(((x - w / 2) / (w / 1.25)) ** 2 + ((y - h / 2) / (h / 1.15)) ** 2, 0, 1) * 0.55
    base = np.zeros((h, w, 3), dtype=np.float32)
    base[..., 0] = 5 + 52 * glow * vignette
    base[..., 1] = 6 + 6 * glow * vignette
    base[..., 2] = 14 + 34 * glow * vignette
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def grid(img, step=48, color=(255, 0, 143, 22)):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for x in range(0, img.width, step):
        d.line([(x, 0), (x, img.height)], fill=color, width=1)
    for y in range(0, img.height, step):
        d.line([(0, y), (img.width, y)], fill=color, width=1)
    return Image.alpha_composite(img, layer)


def neon(img, draw_fn, blur=16, strength=0.9):
    """Desenha em uma camada, cria halo e compõe por adição."""
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(glow))
    halo = glow.filter(ImageFilter.GaussianBlur(blur))
    if strength != 1:
        a = halo.getchannel("A").point(lambda v: int(v * strength))
        halo.putalpha(a)
    img = ImageChops.add(img.convert("RGB"), halo.convert("RGB"), scale=1).convert("RGBA")
    return Image.alpha_composite(img, glow)


def corners(d, w, h, m=30, length=48, color=(255, 110, 190, 190)):
    for x, dx in ((m, 1), (w - m, -1)):
        for y, dy in ((m, 1), (h - m, -1)):
            d.line([(x, y), (x + dx * length, y)], fill=color, width=2)
            d.line([(x, y), (x, y + dy * length)], fill=color, width=2)


def scanlines(img, opacity=26):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for y in range(0, img.height, 4):
        d.line([(0, y), (img.width, y)], fill=(0, 0, 0, opacity), width=1)
    return Image.alpha_composite(img, layer)


def rotated_rect(cx, cy, w, h, angle):
    a = math.radians(angle)
    pts = [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]
    return [(cx + px * math.cos(a) - py * math.sin(a), cy + px * math.sin(a) + py * math.cos(a)) for px, py in pts]


def make_map(seed, label, variant):
    rnd = random.Random(seed * 7919 + variant * 104729)
    W, H = 1200, 750
    img = canvas(W, H, 400 + variant * 120, 330 + variant * 25)
    img = grid(img)

    # linhas topográficas / fluxo do mapa
    def _topo(d):
        for i in range(8):
            y = 60 + i * 92 + rnd.randint(-18, 18)
            pts = [(0, y), (rnd.randint(220, 430), y - 45), (rnd.randint(600, 820), y + 40), (W, y - 15)]
            d.line(pts, fill=(255, 0, 143, 30 + i * 2), width=2, joint="curve")
    img = neon(img, _topo, blur=9, strength=0.35)

    # plataforma principal
    platform = rotated_rect(600, 375, 940 + variant * 18, 470, -3 + variant)
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.polygon(platform, fill=(9, 8, 18, 232))
    img = Image.alpha_composite(img, layer)

    def _outline(d):
        d.line(platform + [platform[0]], fill=(255, 0, 143, 130), width=3, joint="curve")
        for i in range(1, 5):
            inset = [(600 + (x - 600) * (1 - i * 0.16), 375 + (y - 375) * (1 - i * 0.16)) for x, y in platform]
            d.line(inset + [inset[0]], fill=(255, 0, 143, 22), width=1)
    img = neon(img, _outline, blur=13, strength=0.7)

    # blocos do mapa
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(19):
        x = rnd.randint(120, 1080)
        y = rnd.randint(120, 630)
        bw, bh = rnd.randint(48, 165), rnd.randint(32, 110)
        angle = variant * 2 - 3 + rnd.randint(-6, 6)
        poly = rotated_rect(x, y, bw, bh, angle)
        fill = (255, 0, 143, 16) if rnd.random() > 0.55 else (6, 7, 16, 225)
        d.polygon(poly, fill=fill)
        d.line(poly + [poly[0]], fill=(255, 0, 143, rnd.randint(70, 175)), width=2)
        if rnd.random() > 0.5:
            d.line([poly[0], poly[1]], fill=(255, 150, 210, 120), width=3)
    img = Image.alpha_composite(img, layer)

    # rotas e nós
    def _routes(d):
        for _ in range(4):
            pts = [(rnd.randint(100, 300), rnd.randint(150, 600)), (rnd.randint(400, 700), rnd.randint(180, 560)), (rnd.randint(850, 1100), rnd.randint(150, 600))]
            d.line(pts, fill=(255, 0, 143, 110), width=3, joint="curve")
        for _ in range(28):
            x, y = rnd.randint(60, 1140), rnd.randint(60, 690)
            rr = rnd.choice([2, 2, 3, 4])
            d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=(255, 130, 200, 170))
        d.ellipse((520 - 22, 375 - 22, 520 + 22, 375 + 22), outline=(255, 255, 255, 150), width=2)
        d.line([(498, 375), (542, 375)], fill=(255, 255, 255, 150), width=1)
        d.line([(520, 353), (520, 397)], fill=(255, 255, 255, 150), width=1)
    img = neon(img, _routes, blur=14, strength=0.55)

    # anéis de referência e HUD
    hud = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(hud)
    for radius in (130, 215, 300):
        d.ellipse((600 - radius, 375 - radius * 0.58, 600 + radius, 375 + radius * 0.58), outline=(255, 0, 143, 30), width=2)
    corners(d, W, H)
    d.text((46, 40), "VENLY CREATES / CONCEITO VISUAL", font=F_BOLD, fill=WHITE)
    d.text((46, 710), f"{label.upper()} · IMAGEM DEMONSTRATIVA · NÃO É UM PROJETO REAL", font=F_TINY, fill=(255, 255, 255, 115))
    d.text((1154, 40), f"SEC-{seed:02d} / V{variant + 1}", font=F_TINY, fill=(255, 255, 255, 115), anchor="ra")
    img = Image.alpha_composite(img, hud)
    img = scanlines(img)
    return img.convert("RGB")


def paste_logo(img, cx, cy, size=108):
    logo = LOGO.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=12, fill=255)
    img.paste(logo, (cx - size // 2, cy - size // 2), mask)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((cx - size // 2, cy - size // 2, cx + size // 2, cy + size // 2), radius=12, outline=(255, 255, 255, 70), width=2)


SHAPES = {
    "jersey": [(300, 220), (370, 195), (450, 240), (530, 195), (600, 220), (680, 290), (630, 350), (585, 315), (585, 680), (450, 705), (315, 680), (315, 315), (270, 350), (220, 290)],
    "tee": [(310, 230), (380, 205), (450, 245), (520, 205), (590, 230), (670, 275), (625, 330), (585, 305), (585, 640), (450, 662), (315, 640), (315, 305), (275, 330), (230, 275)],
    "hoodie": [(295, 235), (370, 200), (450, 175), (530, 200), (605, 235), (685, 295), (640, 355), (595, 320), (600, 680), (450, 705), (300, 680), (305, 320), (260, 355), (215, 295)],
    "cap": [(270, 500), (280, 350), (450, 260), (620, 350), (630, 500)],
    "sleeve": [(330, 230), (450, 205), (570, 230), (610, 650), (450, 690), (290, 650)],
    "mousepad": [(150, 300), (750, 260), (790, 620), (190, 660)],
}


def make_product(kind, label):
    W = H = 900
    img = canvas(W, H, 450, 400, 0.95)
    img = grid(img, 42)

    def _rings(d):
        d.ellipse((110, 100, 790, 780), outline=(255, 0, 143, 55), width=2)
        d.ellipse((155, 145, 745, 735), outline=(255, 0, 143, 25), width=2)
        d.ellipse((200, 770, 700, 830), fill=(255, 0, 143, 45))
    img = neon(img, _rings, blur=22, strength=0.45)

    poly = SHAPES[kind]
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.polygon(poly, fill=(11, 12, 22, 250))
    img = Image.alpha_composite(img, layer)

    def _edges(d):
        d.line(poly + [poly[0]], fill=(255, 0, 143, 225), width=4, joint="curve")
        if kind in ("jersey", "tee", "hoodie"):
            d.arc((370, 180, 530, 280), 0, 180, fill=(255, 130, 200, 220), width=5)
            d.line([(340, 645), (560, 645)], fill=(255, 0, 143, 110), width=3)
            d.line([(345, 250), (345, 620)], fill=(255, 0, 143, 55), width=2)
            d.line([(555, 250), (555, 620)], fill=(255, 0, 143, 55), width=2)
        if kind == "hoodie":
            d.rounded_rectangle((365, 500, 535, 590), radius=14, outline=(255, 0, 143, 140), width=3)
            d.ellipse((380, 165, 520, 285), outline=(255, 0, 143, 170), width=4)
        if kind == "cap":
            d.line([(270, 500), (450, 520), (630, 500)], fill=(255, 140, 205, 210), width=5, joint="curve")
            d.arc((285, 495, 700, 610), 10, 170, fill=(255, 0, 143, 200), width=4)
            d.ellipse((438, 258, 462, 282), fill=(255, 0, 143, 230))
        if kind == "sleeve":
            d.line([(320, 290), (580, 290)], fill=(255, 140, 205, 150), width=3)
            d.line([(300, 625), (600, 625)], fill=(255, 140, 205, 150), width=3)
        if kind == "mousepad":
            d.line([(170, 320), (730, 283)], fill=(255, 140, 205, 150), width=3)
            d.line([(190, 635), (770, 598)], fill=(255, 140, 205, 120), width=3)
    img = neon(img, _edges, blur=15, strength=0.8)

    logo_pos = {"jersey": (450, 340), "tee": (450, 340), "hoodie": (450, 360), "cap": (450, 385), "sleeve": (450, 440), "mousepad": (450, 445)}
    paste_logo(img, *logo_pos[kind], 108)

    hud = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(hud)
    corners(d, W, H, 32, 56)
    d.text((56, 52), "VENLY STORE", font=F_BOLD, fill=WHITE)
    d.text((56, 848), f"{label.upper()} · IMAGEM DEMONSTRATIVA", font=F_TINY, fill=(255, 255, 255, 120))
    d.text((844, 848), "ILUSTRATIVO", font=F_TINY, fill=(255, 255, 255, 120), anchor="ra")
    img = Image.alpha_composite(img, hud)
    return img.convert("RGB")


MAP_DEFS = [
    ("neon-circuit", "Neon Circuit", 3), ("pulse-yard", "Pulse Yard", 8),
    ("violet-hold", "Violet Hold", 12), ("echo-garden", "Echo Garden", 17),
    ("grid-lab", "Grid Lab", 23), ("brand-arena", "Brand Arena", 29),
]
for slug, label, seed in MAP_DEFS:
    for v in range(3):
        name = f"{slug}.png" if v == 0 else f"{slug}-{v + 1}.png"
        make_map(seed, label, v).save(os.path.join(MAPS, name), optimize=True)

PRODUCT_DEFS = [
    ("jersey", "Jersey Venly Pro"), ("tee", "Camiseta Essential"),
    ("hoodie", "Moletom Oversized"), ("cap", "Boné Snapback"),
    ("sleeve", "Manguito Gamer"), ("mousepad", "Mousepad XL"),
]
for kind, label in PRODUCT_DEFS:
    make_product(kind, label).save(os.path.join(PRODUCTS, f"{kind}.png"), optimize=True)

print("PNGs gerados:", len(os.listdir(MAPS)), "mapas,", len(os.listdir(PRODUCTS)), "produtos")
