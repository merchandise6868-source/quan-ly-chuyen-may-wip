import sys
import os

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

try:
    from PIL import Image, ImageDraw, ImageFont
    has_pil = True
except ImportError:
    has_pil = False

print(f"PIL available: {has_pil}")

def create_svg_icon(filepath, size):
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e" />
      <stop offset="50%" stop-color="#0e7490" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#34d399" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <!-- Background with smooth rounded corners -->
  <rect width="{size}" height="{size}" rx="{int(size * 0.22)}" fill="url(#bgGrad)" />
  
  <!-- Subtle border highlight -->
  <rect x="2" y="2" width="{size-4}" height="{size-4}" rx="{int(size * 0.22)}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="{max(2, int(size*0.01))}" />

  <!-- Central Emblem: Sewing spool & fabric / needle icon -->
  <g filter="url(#shadow)" transform="translate({size*0.15}, {size*0.12}) scale({size/512 * 0.7})">
    <!-- Factory / Clipboard / WIP Flow chart graphic -->
    <!-- Outer Shield / Container -->
    <rect x="40" y="40" width="432" height="432" rx="60" fill="rgba(255, 255, 255, 0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="8"/>
    
    <!-- Flow Chart Nodes & Lines -->
    <!-- Top Node (Cắt / Nhập) -->
    <rect x="186" y="80" width="140" height="60" rx="16" fill="url(#accentGrad)"/>
    <text x="256" y="120" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="900" fill="#0f172a" text-anchor="middle">NHẬP</text>
    
    <!-- Connecting Arrow 1 -->
    <line x1="256" y1="140" x2="256" y2="180" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"/>
    <polygon points="246,176 266,176 256,192" fill="#38bdf8"/>

    <!-- Middle Node (May WIP) -->
    <rect x="116" y="195" width="280" height="75" rx="18" fill="#ffffff"/>
    <text x="256" y="244" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" fill="#0f766e" text-anchor="middle">CHUYỀN MAY</text>
    
    <!-- Connecting Arrow 2 -->
    <line x1="256" y1="270" x2="256" y2="310" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"/>
    <polygon points="246,306 266,306 256,322" fill="#38bdf8"/>

    <!-- Bottom Node (QC / Xuất) -->
    <rect x="186" y="325" width="140" height="60" rx="16" fill="url(#accentGrad)"/>
    <text x="256" y="365" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="900" fill="#0f172a" text-anchor="middle">XUẤT</text>

    <!-- Bottom Branding text -->
    <text x="256" y="435" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">D&amp;D LONG AN</text>
  </g>
</svg>'''
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print(f"Created SVG: {filepath}")

def generate_png_via_pil(filepath, size):
    if not has_pil:
        return
    # Create high-res RGB image with rounded rectangle and clean typography
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded background gradient simulation
    radius = int(size * 0.22)
    # Background color: Teal-Cyan gradient tone
    draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=(15, 118, 110, 255))
    
    # Inner overlay for depth
    margin = max(2, int(size * 0.015))
    draw.rounded_rectangle([(margin, margin), (size - margin, size - margin)], radius=radius, outline=(255, 255, 255, 80), width=max(2, int(size * 0.015)))

    # Central card
    card_x1 = int(size * 0.12)
    card_y1 = int(size * 0.12)
    card_x2 = int(size * 0.88)
    card_y2 = int(size * 0.88)
    draw.rounded_rectangle([(card_x1, card_y1), (card_x2, card_y2)], radius=int(size * 0.1), fill=(255, 255, 255, 35), outline=(255, 255, 255, 90), width=max(2, int(size * 0.01)))

    # Top Pill "NHẬP"
    p1_x1 = int(size * 0.3)
    p1_y1 = int(size * 0.18)
    p1_x2 = int(size * 0.7)
    p1_y2 = int(size * 0.30)
    draw.rounded_rectangle([(p1_x1, p1_y1), (p1_x2, p1_y2)], radius=int(size * 0.05), fill=(56, 189, 248, 255))

    # Center Pill "CHUYỀN MAY"
    p2_x1 = int(size * 0.18)
    p2_y1 = int(size * 0.38)
    p2_x2 = int(size * 0.82)
    p2_y2 = int(size * 0.58)
    draw.rounded_rectangle([(p2_x1, p2_y1), (p2_x2, p2_y2)], radius=int(size * 0.06), fill=(255, 255, 255, 255))

    # Bottom Pill "XUẤT"
    p3_x1 = int(size * 0.3)
    p3_y1 = int(size * 0.66)
    p3_x2 = int(size * 0.7)
    p3_y2 = int(size * 0.78)
    draw.rounded_rectangle([(p3_x1, p3_y1), (p3_x2, p3_y2)], radius=int(size * 0.05), fill=(52, 211, 153, 255))

    # Try font or default
    try:
        font_large = ImageFont.truetype("arial.ttf", int(size * 0.09))
        font_med = ImageFont.truetype("arial.ttf", int(size * 0.065))
        font_small = ImageFont.truetype("arialbd.ttf", int(size * 0.055))
    except Exception:
        font_large = ImageFont.load_default()
        font_med = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # Draw texts
    draw.text((size * 0.5, size * 0.24), "NHẬP", fill=(15, 23, 42), font=font_med, anchor="mm")
    draw.text((size * 0.5, size * 0.48), "WIP MAY", fill=(15, 118, 110), font=font_large, anchor="mm")
    draw.text((size * 0.5, size * 0.72), "XUẤT", fill=(15, 23, 42), font=font_med, anchor="mm")
    draw.text((size * 0.5, size * 0.84), "D&D LONG AN", fill=(255, 255, 255), font=font_small, anchor="mm")

    img.save(filepath, "PNG")
    print(f"Created PNG: {filepath} ({size}x{size})")

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "frontend")
    os.makedirs(out_dir, exist_ok=True)
    
    # Generate SVGs
    create_svg_icon(os.path.join(out_dir, "icon.svg"), 512)
    create_svg_icon(os.path.join(out_dir, "favicon.svg"), 64)

    # Generate PNGs
    generate_png_via_pil(os.path.join(out_dir, "icon-192.png"), 192)
    generate_png_via_pil(os.path.join(out_dir, "icon-512.png"), 512)
    generate_png_via_pil(os.path.join(out_dir, "apple-touch-icon.png"), 180)
    generate_png_via_pil(os.path.join(out_dir, "favicon-32x32.png"), 32)
