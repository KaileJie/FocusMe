#!/usr/bin/env python3
"""
Generate icon files for Focus Me PWA
Creates icon-192.png and icon-512.png
"""

try:
    from PIL import Image, ImageDraw
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("PIL/Pillow not installed. Install with: pip3 install Pillow")

if HAS_PIL:
    def create_tomato_icon(size):
        """Create a tomato icon at the specified size"""
        # Create image with transparent background
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        center_x, center_y = size // 2, size // 2
        scale = size / 120.0  # Original SVG is 120x120
        
        # Main tomato body (red ellipse)
        bbox1 = (
            center_x - 42 * scale,
            center_y - 35 * scale,
            center_x + 42 * scale,
            center_y + 50 * scale
        )
        draw.ellipse(bbox1, fill='#EF4444')
        
        # Overlay ellipse for depth
        bbox2 = (
            center_x - 42 * scale,
            center_y - 40 * scale,
            center_x + 42 * scale,
            center_y + 45 * scale
        )
        draw.ellipse(bbox2, fill='#DC2626')
        
        # Eyes (white circles)
        eye_radius = 6 * scale
        eye_y = center_y - 5 * scale
        draw.ellipse([
            center_x - 12 * scale - eye_radius,
            eye_y - eye_radius,
            center_x - 12 * scale + eye_radius,
            eye_y + eye_radius
        ], fill='#FFFFFF')
        
        draw.ellipse([
            center_x + 12 * scale - eye_radius,
            eye_y - eye_radius,
            center_x + 12 * scale + eye_radius,
            eye_y + eye_radius
        ], fill='#FFFFFF')
        
        # Pupils (black circles)
        pupil_radius = 3.5 * scale
        draw.ellipse([
            center_x - 12 * scale - pupil_radius,
            eye_y - pupil_radius,
            center_x - 12 * scale + pupil_radius,
            eye_y + pupil_radius
        ], fill='#1F2937')
        
        draw.ellipse([
            center_x + 12 * scale - pupil_radius,
            eye_y - pupil_radius,
            center_x + 12 * scale + pupil_radius,
            eye_y + pupil_radius
        ], fill='#1F2937')
        
        # Eye highlights
        highlight_radius_x = 1.5 * scale
        highlight_radius_y = 2 * scale
        draw.ellipse([
            center_x - 11 * scale - highlight_radius_x,
            eye_y - 7 * scale - highlight_radius_y,
            center_x - 11 * scale + highlight_radius_x,
            eye_y - 7 * scale + highlight_radius_y
        ], fill='#FFFFFF')
        
        draw.ellipse([
            center_x + 13 * scale - highlight_radius_x,
            eye_y - 7 * scale - highlight_radius_y,
            center_x + 13 * scale + highlight_radius_x,
            eye_y - 7 * scale + highlight_radius_y
        ], fill='#FFFFFF')
        
        # Smile (arc)
        smile_y = center_y + 7 * scale
        # Using multiple lines to create smooth curve
        for i in range(-8, 9):
            x = center_x + i * scale
            y = smile_y + (i * i * 0.1) * scale
            draw.ellipse([x - 1.5 * scale, y - 1.5 * scale, x + 1.5 * scale, y + 1.5 * scale], fill='#1F2937')
        
        # Cheeks blush
        blush_radius_x = 6 * scale
        blush_radius_y = 5 * scale
        blush_y = center_y + 3 * scale
        draw.ellipse([
            center_x - 22 * scale - blush_radius_x,
            blush_y - blush_radius_y,
            center_x - 22 * scale + blush_radius_x,
            blush_y + blush_radius_y
        ], fill='#FCA5A5')
        
        draw.ellipse([
            center_x + 22 * scale - blush_radius_x,
            blush_y - blush_radius_y,
            center_x + 22 * scale + blush_radius_x,
            blush_y + blush_radius_y
        ], fill='#FCA5A5')
        
        # Stem (triangle)
        stem_points = [
            (center_x - 5 * scale, center_y - 45 * scale),
            (center_x - 10 * scale, center_y - 55 * scale),
            (center_x + 5 * scale, center_y - 55 * scale)
        ]
        draw.polygon(stem_points, fill='#10B981')
        
        # Stem base
        draw.ellipse([
            center_x - 7 * scale,
            center_y - 57.5 * scale,
            center_x + 3 * scale,
            center_y - 52.5 * scale
        ], fill='#059669')
        
        # Leaf (rotated ellipse)
        leaf_x = center_x + 7 * scale
        leaf_y = center_y - 52 * scale
        # Simple ellipse approximation
        draw.ellipse([
            leaf_x - 3 * scale,
            leaf_y - 6 * scale,
            leaf_x + 3 * scale,
            leaf_y + 6 * scale
        ], fill='#10B981')
        
        # Highlight
        highlight_bbox = (
            center_x - 10 * scale - 12 * scale,
            center_y - 15 * scale - 20 * scale,
            center_x - 10 * scale + 12 * scale,
            center_y - 15 * scale + 20 * scale
        )
        # Create semi-transparent highlight
        highlight = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        highlight_draw = ImageDraw.Draw(highlight)
        highlight_draw.ellipse(highlight_bbox, fill=(255, 255, 255, 102))  # 40% opacity
        img = Image.alpha_composite(img, highlight)
        
        return img
    
    # Generate icons
    print("Generating icon-192.png...")
    icon192 = create_tomato_icon(192)
    icon192.save('icon-192.png', 'PNG')
    print("✓ Created icon-192.png")
    
    print("Generating icon-512.png...")
    icon512 = create_tomato_icon(512)
    icon512.save('icon-512.png', 'PNG')
    print("✓ Created icon-512.png")
    
    print("\n✅ Icons generated successfully!")
    print("Files created:")
    print("  - icon-192.png (192x192)")
    print("  - icon-512.png (512x512)")

