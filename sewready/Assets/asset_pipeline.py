#!/usr/bin/env python3
"""
Sewing Ops - Asset Generation Pipeline
Takes shop BIO data and generates prompts for AI image/video generation
plus downloads relevant stock footage
"""

import os
import json
import subprocess
from datetime import datetime

# BIO Data for all clients (from index.html)
BIO_DATA = {
    "S.A.S. Military Surplus": {
        "name": "S.A.S. Military Surplus",
        "theme": "military",
        "colors": ["#b71c1c", "#1a1a1a", "#c5b358"],
        "specialty": "Military surplus buy/sell/trade - Cash for military gear",
        "unique": "High-traffic Yadkin Rd location - prime military corridor",
        "vibe": "tactical, authentic, veteran-owned",
    },
    "Lone Wolf Tactical, Inc.": {
        "name": "Lone Wolf Tactical",
        "theme": "military",
        "colors": ["#ff6f00", "#1a1a1a", "#333"],
        "specialty": "Tactical gear, military surplus, outdoor equipment",
        "unique": "Veteran owned - 'Gear Up for Adventure'",
        "vibe": "adventure, tactical, bold",
    },
    "North Carolina Military Supplies": {
        "name": "NC Military Supplies",
        "theme": "military",
        "colors": ["#1b5e20", "#1a1a1a", "#c5b358"],
        "specialty": "Military supplies, wholesale durable goods",
        "unique": "SF Veteran owned - Jeffrey Cormier, retired US Army Special Forces",
        "vibe": "professional, elite, military-grade",
    },
    "Jin Sewing": {
        "name": "Jin Sewing",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#1a1a1a", "#f0f0f0"],
        "specialty": "Professional sewing, precise alterations, military uniform services",
        "unique": "Husband is retired Army AND ordained Deacon at his church",
        "vibe": "family, trustworthy, precise",
    },
    "Kim's #1 Sewing & Dry Cleaning": {
        "name": "Kim's #1 Sewing",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#ffd700", "#1a1a1a"],
        "specialty": "Fort Bragg's #1 sewing shop - uniform setup, shaped berets",
        "unique": "58+ years, 360+ 5-star reviews, 'Home of Inspection'",
        "vibe": "established, premium, military-focused",
    },
    "Kim's Speedy Sewing Shop": {
        "name": "Kim's Speedy Sewing",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#00ff41", "#1a1a1a"],
        "specialty": "Speedy alterations, wedding apparel, leather work",
        "unique": "Fast turnaround - 'lived up to their name, speedy!'",
        "vibe": "fast, efficient, reliable",
    },
    "Lee's Alterations & Sewing": {
        "name": "Lee's Alterations",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#ff69b4", "#1a1a1a"],
        "specialty": "Alterations, sewing, dry cleaning - same day service",
        "unique": "Family-owned, specializes in wedding dresses",
        "vibe": "family, elegant, detail-oriented",
    },
    "Lee's Tailors": {
        "name": "Lee's Tailors",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#4a90d9", "#1a1a1a"],
        "specialty": "Professional tailoring and alterations",
        "unique": "Experienced seamstress, quality craftsmanship",
        "vibe": "professional, classic, skilled",
    },
    "Make It Fit": {
        "name": "Make It Fit",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#ff4081", "#1a1a1a"],
        "specialty": "Custom alterations and fittings",
        "unique": "Focus on custom fit solutions",
        "vibe": "custom, personal, precise",
    },
    "Mary's Alterations": {
        "name": "Mary's Alterations",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#e91e63", "#1a1a1a"],
        "specialty": "Formalwear alterations, bridesmaid dresses, prom dresses",
        "unique": "Specialist in military dress uniforms - 'sweet lady'",
        "vibe": "elegant, caring, detail-focused",
    },
    "Monarch Cleaners": {
        "name": "Monarch Cleaners",
        "theme": "cleaners",
        "colors": ["#8b5cf6", "#9c27b0", "#1a1a1a"],
        "specialty": "Military uniform care, wedding dresses, leather, fur",
        "unique": "3 locations, 34+ years, 4.8/5 rating",
        "vibe": "established, premium, comprehensive",
    },
    "Nan's Cleaners": {
        "name": "Nan's Cleaners",
        "theme": "cleaners",
        "colors": ["#8b5cf6", "#00bcd4", "#1a1a1a"],
        "specialty": "Army uniform dry cleaning & services",
        "unique": "Military uniform specialists",
        "vibe": "reliable, military-focused",
    },
    "One Stop Sewing & Cleaning": {
        "name": "One Stop Sewing",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#4caf50", "#1a1a1a"],
        "specialty": "Fort Bragg soldiers - uniform setup, boot shining",
        "unique": "Since 2008, made cloth masks during COVID",
        "vibe": "community, dedicated, full-service",
    },
    "Otrebla's Tailoring": {
        "name": "Otrebla's Tailoring",
        "theme": "tailoring",
        "colors": ["#8b5cf6", "#795548", "#1a1a1a"],
        "specialty": "Full-service custom tailoring & haberdashery, tuxedo rentals",
        "unique": "One of the last true bench tailors - high-end craftsmanship",
        "vibe": "luxury, craftsmanship, bespoke",
    },
    "STAR Sewing & Cleaners": {
        "name": "STAR Sewing & Cleaners",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#ff9800", "#1a1a1a"],
        "specialty": "Uniform tailoring, military supply, express service",
        "unique": "20+ years, complete military uniform services",
        "vibe": "star-quality, reliable, comprehensive",
    },
    "Sue's Sewing & Laundry": {
        "name": "Sue's Sewing & Laundry",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#e91e63", "#1a1a1a"],
        "specialty": "One-stop: alterations, sewing, boot repair, dry cleaning",
        "unique": "Since 1998, military discounts, 24-hour turnaround",
        "vibe": "family, fast, veteran-friendly",
    },
    "Pak Cleaners": {
        "name": "Pak Cleaners",
        "theme": "cleaners",
        "colors": ["#8b5cf6", "#607d8b", "#1a1a1a"],
        "specialty": "Military and civilian tailoring, alterations, dry cleaning",
        "unique": "WiFi available for waiting customers",
        "vibe": "modern, convenient",
    },
    "Choi's Sewing & Cleaning": {
        "name": "Choi's Sewing",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#ff5722", "#1a1a1a"],
        "specialty": "Dry cleaning, sewing, alterations, custom sewing",
        "unique": "Praised as affordable and reliable on neighborhood forums",
        "vibe": "friendly, affordable, quality",
    },
    "Jan's Cleaners & Alterations": {
        "name": "Jan's Cleaners",
        "theme": "cleaners",
        "colors": ["#8b5cf6", "#009688", "#1a1a1a"],
        "specialty": "Full-service cleaners and alterations near Fort Bragg",
        "unique": "Personalized approach, quick alterations",
        "vibe": "personal, quick, meticulous",
    },
    "McMurray Fabrics": {
        "name": "McMurray Fabrics",
        "theme": "fabrics",
        "colors": ["#8b5cf6", "#8b4513", "#1a1a1a"],
        "specialty": "Textile manufacturer - nets, webbing, automotive textiles",
        "unique": "Established 1968 - 58+ years in textile manufacturing",
        "vibe": "industrial, established, B2B",
    },
    "Minh's Alteration Shop": {
        "name": "Minh's Alteration Shop",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#00bcd4", "#1a1a1a"],
        "specialty": "Expert alterations and tailoring",
        "unique": "Personalized tailoring approach",
        "vibe": "precise, personal, skilled",
    },
    "Perfit": {
        "name": "Perfit",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#e91e63", "#1a1a1a"],
        "specialty": "Perfect fit alterations",
        "unique": "Focus on precision fitting",
        "vibe": "precise, quality, focused",
    },
    "Sewing Sensations": {
        "name": "Sewing Sensations",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#ff4081", "#1a1a1a"],
        "specialty": "Quality sewing and alterations",
        "unique": "Community sewing shop with personal service",
        "vibe": "creative, community, quality",
    },
    "S & F Sewing And Alterations": {
        "name": "S & F Sewing",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#2196f3", "#1a1a1a"],
        "specialty": "Professional sewing services",
        "unique": "Local family-run business",
        "vibe": "family, professional, reliable",
    },
    "Spotless Cleaners & Alterations": {
        "name": "Spotless Cleaners",
        "theme": "cleaners",
        "colors": ["#8b5cf6", "#4caf50", "#1a1a1a"],
        "specialty": "Cleaning and alteration specialists",
        "unique": "Combined cleaning and alterations service",
        "vibe": "clean, professional, thorough",
    },
    "Tailorite": {
        "name": "Tailorite",
        "theme": "tailoring",
        "colors": ["#8b5cf6", "#673ab7", "#1a1a1a"],
        "specialty": "Professional tailoring",
        "unique": "Quality tailoring services",
        "vibe": "classic, professional, skilled",
    },
    "Tina's Alterations": {
        "name": "Tina's Alterations",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#ff9800", "#1a1a1a"],
        "specialty": "Expert alterations",
        "unique": "Personalized service approach",
        "vibe": "personal, caring, skilled",
    },
    "T & S Cleaning": {
        "name": "T & S Cleaning",
        "theme": "cleaners",
        "colors": ["#8b5cf6", "#00acc1", "#1a1a1a"],
        "specialty": "Cleaning and alteration services",
        "unique": "Located near Benjamin Martin School, embroidery services",
        "vibe": "local, convenient, thorough",
    },
    "T & T Tailor & Alterations": {
        "name": "T & T Tailor",
        "theme": "tailoring",
        "colors": ["#8b5cf6", "#5c6bc0", "#1a1a1a"],
        "specialty": "Professional tailoring and alterations",
        "unique": "Combined tailoring service",
        "vibe": "professional, reliable, skilled",
    },
    "AAA Tailor Shop": {
        "name": "AAA Tailor Shop",
        "theme": "tailoring",
        "colors": ["#8b5cf6", "#ffd700", "#1a1a1a"],
        "specialty": "Quality tailoring services",
        "unique": "Top-rated local tailor",
        "vibe": "premium, professional, reliable",
    },
    "Connie's Sewing Room": {
        "name": "Connie's Sewing Room",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#f48fb1", "#1a1a1a"],
        "specialty": "Personalized sewing services",
        "unique": "Personal touch with sewing projects",
        "vibe": "personal, creative, warm",
    },
    "Final Stitch: Alterations & Clothing": {
        "name": "Final Stitch",
        "theme": "sewing",
        "colors": ["#8b5cf6", "#ff5722", "#1a1a1a"],
        "specialty": "Final touch alterations",
        "unique": "Focus on perfect finishing",
        "vibe": "detail-oriented, precise, quality",
    },
}


def generate_image_prompts(shop_name, data):
    """Generate AI image prompts based on shop BIO"""

    theme = data.get("theme", "sewing")
    colors = data.get("colors", ["#8b5cf6", "#1a1a1a"])
    specialty = data.get("specialty", "")
    vibe = data.get("vibe", "")

    prompts = {
        "logo": f"Minimalist logo for {shop_name}, {vibe} style, {colors[0]} and {colors[1]}, vector, clean lines, professional",
        "hero": f"Modern website hero image for {shop_name}, {specialty}, warm inviting atmosphere, professional lighting, {colors[0]} accent color",
        "about": f"Portrait of skilled tailor working at sewing machine, {shop_name} - {specialty}, warm natural lighting, professional setting",
        "services": f"Clean service menu graphic for {shop_name}, alterations and sewing services, modern minimalist design, {colors[0]} and white",
        "contact": f"Professional business card design for {shop_name}, contact information layout, {colors[0]} and {colors[1]}, clean modern style",
    }

    return prompts


def generate_video_prompts(shop_name, data):
    """Generate AI video prompts based on shop BIO"""

    theme = data.get("theme", "sewing")
    colors = data.get("colors", ["#8b5cf6", "#1a1a1a"])
    specialty = data.get("specialty", "")
    vibe = data.get("vibe", "")

    prompts = {
        "hero_video": f"Cinematic intro video for {shop_name}, {specialty}, slow motion sewing machine needle, warm golden light, {colors[0]} color grade, 10 seconds, professional commercial",
        "about_video": f"B-roll footage of tailor working, {shop_name}, alterations shop interior, skilled hands sewing, natural window light, 15 seconds, documentary style",
        "service_video": f"Animated service showcase for {shop_name}, smooth transitions between sewing, fitting, finishing shots, {colors[0]} accent, 20 seconds, modern motion graphics",
        "testimonial": f"Customer testimonial background for {shop_name}, subtle bokeh of sewing supplies, warm inviting atmosphere, {colors[0]} tint, 30 seconds loop",
    }

    return prompts


def generate_midjourney_prompt(shop_name, data, asset_type):
    """Generate Midjourney prompt for specific asset"""

    prompts = generate_image_prompts(shop_name, data)
    base = prompts.get(asset_type, "")

    # Add Midjourney-specific parameters
    midjourney = f"{base} --ar 16:9 --v 6 --q 2 --stylize 250"

    return midjourney


def generate_heygen_script(shop_name, data):
    """Generate script for HeyGen avatar video"""

    specialty = data.get("specialty", "")
    unique = data.get("unique", "")

    script = f"""Welcome to {shop_name}, your premier destination for {specialty}.

What sets us apart: {unique}

Visit us today and experience the quality that has made us a local favorite.

{shop_name} - Quality Service, Every Time."""

    return script


def get_stock_video_keywords(shop_name, data):
    """Get keywords for downloading stock videos"""

    specialty = data.get("specialty", "")
    theme = data.get("theme", "sewing")

    keywords = {
        "primary": ["sewing machine", "tailor working", "alterations"],
        "secondary": ["fabric", "thread", "needle and thread"],
        "background": ["shop interior", "clothing rack", "military uniforms"],
        "theme_specific": {
            "military": ["army uniform", "tactical gear", "military surplus"],
            "sewing": ["sewing workshop", "dressmaker", "clothing alteration"],
            "cleaners": ["dry cleaning", "laundry service", "ironing"],
        },
    }

    # Add shop-specific keywords
    keywords["shop_name"] = shop_name
    keywords["specialty"] = specialty

    return keywords


def generate_all_prompts():
    """Generate prompts for all shops"""

    output_dir = "/Users/beers/Desktop/Sewing Ops/Assets"
    os.makedirs(output_dir, exist_ok=True)

    all_prompts = {}

    for shop_name, data in BIO_DATA.items():
        slug = (
            shop_name.lower()
            .replace(" ", "-")
            .replace("&", "")
            .replace("'", "")
            .replace("#", "")
            .replace(".", "")
        )

        all_prompts[shop_name] = {
            "shop_name": shop_name,
            "slug": slug,
            "theme_colors": data.get("colors", []),
            "image_prompts": generate_image_prompts(shop_name, data),
            "video_prompts": generate_video_prompts(shop_name, data),
            "midjourney_prompts": {
                k: generate_midjourney_prompt(shop_name, data, k)
                for k in ["logo", "hero", "about", "services"]
            },
            "heygen_script": generate_heygen_script(shop_name, data),
            "stock_keywords": get_stock_video_keywords(shop_name, data),
        }

    # Save to JSON
    with open(f"{output_dir}/all_prompts.json", "w") as f:
        json.dump(all_prompts, f, indent=2)

    # Generate markdown report
    generate_markdown_report(all_prompts, output_dir)

    return all_prompts


def generate_markdown_report(prompts, output_dir):
    """Generate a markdown report with all prompts"""

    md = """# Sewing Ops - Asset Generation Prompts

Generated: {date}

## How to Use This Guide

### For AI Images (Midjourney/DALL-E/Stable Diffusion)
Copy the prompts into your preferred AI image generator.

### For AI Videos (HeyGen/Kling/Pictory)
- Use the `heygen_script` for avatar videos
- Use the `video_prompts` for b-roll generation
- Download stock footage using the `stock_keywords`

### For Stock Footage
Use the keywords to search:
- pixabay.com/videos/search/
- mixkit.co/free-stock-video/
- videezy.com/free-video/

---

""".format(date=datetime.now().strftime("%Y-%m-%d"))

    for shop_name, data in sorted(prompts.items()):
        md += f"""## {shop_name}

**Theme Colors:** {", ".join(data.get("theme_colors", []))}

### Midjourney Prompts

| Asset | Prompt |
|-------|--------|
"""

        for asset, prompt in data.get("midjourney_prompts", {}).items():
            md += f"| {asset} | `{prompt}` |\n"

        md += f"""
### Video Scripts (HeyGen)

```
{data.get("heygen_script", "")}
```

### Stock Video Keywords
- Primary: {", ".join(data.get("stock_keywords", {}).get("primary", []))}
- Secondary: {", ".join(data.get("stock_keywords", {}).get("secondary", []))}

---

"""

    with open(f"{output_dir}/asset_prompts.md", "w") as f:
        f.write(md)

    print(f"✅ Generated prompts saved to: {output_dir}/")
    print(f"   - all_prompts.json")
    print(f"   - asset_prompts.md")


def download_stock_video(keyword, output_path, source="pixabay"):
    """Download stock video (requires user to visit site)"""

    urls = {
        "pixabay": f"https://pixabay.com/videos/search/{keyword.replace(' ', '%20')}/",
        "mixkit": f"https://mixkit.co/free-stock-video/{keyword.replace(' ', '%20')}/",
        "videezy": f"https://videezy.com/free-video/{keyword.replace(' ', '%20')}/",
    }

    print(f"🔗 Search {keyword} on:")
    for source_name, url in urls.items():
        print(f"   {source_name}: {url}")


if __name__ == "__main__":
    print("🎬 Sewing Ops - Asset Generation Pipeline")
    print("=" * 50)

    prompts = generate_all_prompts()

    print(f"\n📊 Generated prompts for {len(prompts)} shops")
    print("\nNext steps:")
    print("1. Open asset_prompts.md to see all prompts")
    print("2. Use Midjourney/DALL-E to generate images")
    print("3. Use HeyGen/Kling for video content")
    print("4. Download free stock footage from Pixabay/Mixkit")
