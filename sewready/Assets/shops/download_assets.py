#!/usr/bin/env python3
"""
Download Stock Media for Sewing Ops Shops
Run this script to batch download stock images/videos
"""

import os
import json
import subprocess
import urllib.request
import urllib.error

# Load shop data
with open("../all_prompts.json", "r") as f:
    data = json.load(f)

BASE = "../shops"

# Free stock media URLs (direct download links)
# These are public domain / CC0 resources

STOCK_VIDEOS = [
    # Sewing themed videos (public domain / CC0)
    (
        "https://storage.coverr.co/videos/6LrK3W7Jb01IuEwQ5i8u5l9T01",
        "sewing-machine.mp4",
    ),
    (
        "https://storage.coverr.co/videos/coverr-sewing-machine-4557/1080p",
        "tailor-work.mp4",
    ),
]

STOCK_IMAGES = [
    # Placeholder images - will generate below
]


def generate_placeholder_images():
    """Generate placeholder images with shop name"""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("❌ PIL not installed. Install with: pip install pillow")
        return

    for shop_name, info in data.items():
        slug = (
            shop_name.lower()
            .replace(" ", "-")
            .replace("&", "")
            .replace("'", "")
            .replace("#", "")
        )
        colors = info.get("theme_colors", ["#8b5cf6", "#1a1a1a"])

        img_dir = os.path.join(BASE, slug, "images")

        # Create hero placeholder
        img = Image.new("RGB", (1920, 1080), color=colors[0])
        draw = ImageDraw.Draw(img)

        # Add text
        text = shop_name
        # Simple text - PIL will use default font
        draw.text(
            (960, 540),
            text,
            fill=colors[1] if len(colors) > 1 else "#ffffff",
            anchor="mm",
        )

        img.save(os.path.join(img_dir, "hero-placeholder.png"))

    print(f"✅ Generated placeholder images")


def create_download_scripts():
    """Create scripts for user to run"""

    script_content = """#!/bin/bash
# Stock Media Downloader for Sewing Ops
# Run this to download stock images/videos

echo "🎬 Sewing Ops - Stock Media Downloader"
echo ""

# Pixabay (requires free account)
echo "📥 To download stock media:"
echo ""
echo "1. Pixabay (free videos & images):"
echo "   https://pixabay.com/videos/search/sewing/"
echo "   https://pixabay.com/images/search/sewing/"
echo ""
echo "2. Mixkit (free videos):"
echo "   https://mixkit.co/free-stock-video/sewing/"
echo "   https://mixkit.co/free-stock-video/tailor/"
echo ""
echo "3. Videezy (free videos):"
echo "   https://videezy.com/free-video/sewing"
echo ""
echo "4. Pexels (free images & videos):"
echo "   https://www.pexels.com/search/sewing/"
echo "   https://www.pexels.com/video/sewing/"
echo ""
echo "5. Unsplash (free images):"
echo "   https://unsplash.com/images/search/sewing"
echo ""

# Create keyword file for searching
cat > search_keywords.txt << KWEOF
sewing machine
tailor working
alterations
fabric thread
clothing rack
military uniform
dry cleaning
ironing clothes
sewing workshop
dressmaker
KWEOF

echo "✅ Created search_keywords.txt"
echo ""
echo "📋 Next steps:"
echo "1. Visit the sites above"
echo "2. Search using keywords in search_keywords.txt"
echo "3. Download videos/images"
echo "4. Save to: shops/{shop-name}/videos/ or shops/{shop-name}/images/"
"""

    with open("download_media.sh", "w") as f:
        f.write(script_content)

    os.chmod("download_media.sh", 0o755)
    print("✅ Created download_media.sh")


def generate_docusaurus():
    """Generate a docusaurus/markdown with all download links"""

    md = """# Stock Media Downloads

## How to Get Media for Each Shop

### Quick Search Links

| Category | Pixabay | Mixkit | Pexels | Videezy |
|----------|---------|--------|--------|---------|
| **Sewing** | [Videos](https://pixabay.com/videos/search/sewing/) [Images](https://pixabay.com/images/search/sewing/) | [Videos](https://mixkit.co/free-stock-video/sewing/) | [Videos](https://www.pexels.com/video/sewing/) [Images](https://www.pexels.com/search/sewing/) | [Videos](https://videezy.com/free-video/sewing) |
| **Tailor** | [Videos](https://pixabay.com/videos/search/tailor/) | [Videos](https://mixkit.co/free-stock-video/tailor/) | | |
| **Alterations** | [Videos](https://pixabay.com/videos/search/alterations/) | | | |
| **Military** | [Videos](https://pixabay.com/videos/search/military/) | | | |

### Per-Shop Keywords

"""

    for shop_name, info in sorted(data.items()):
        slug = shop_name.lower().replace(" ", "-").replace("&", "")
        keywords = info.get("stock_keywords", {})

        md += f"""#### {shop_name}

- Location: `shops/{slug}/`
- Search terms: {", ".join(keywords.get("primary", [])[:3])}
- [Open folder →](shops/{slug}/)

"""

    with open("STOCK_MEDIA.md", "w") as f:
        f.write(md)

    print("✅ Created STOCK_MEDIA.md")


if __name__ == "__main__":
    print("🎬 Asset Downloader")
    print("=" * 40)

    generate_placeholder_images()
    create_download_scripts()
    generate_docusaurus()

    print("\n📋 To generate AI images:")
    print("   1. Open https://midjourney.com")
    print("   2. Copy prompts from all_prompts.json")
    print("   3. Save images to shops/{slug}/images/")
