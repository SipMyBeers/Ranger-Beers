#!/usr/bin/env python3
"""
Batch generate hero images for all sewing shops via ComfyUI API.

Usage:
  python3 generate_all_heroes.py           # Generate all shops
  python3 generate_all_heroes.py "Jin Sewing" "Perfit"  # Generate specific shops
  python3 generate_all_heroes.py --list    # List all shops

Images are saved to ~/ComfyUI/output/ with prefix "hero_SHOPNAME_"
Then copy them to each shop's site/ folder.
"""
import json, urllib.request, sys, time, re, os

COMFYUI_URL = "http://127.0.0.1:8188"

SHOPS = [
    {"name": "Kim's #1 Sewing & Dry Cleaning", "prompt": "Modern website hero image for Kim's #1 Sewing & Dry Cleaning, Fort Bragg's #1 sewing shop, uniform setup, shaped berets, boot shining, warm inviting atmosphere, professional lighting, purple and gold accent colors, 4k professional photograph"},
    {"name": "Jin Sewing", "prompt": "Modern website hero image for Jin Sewing, professional sewing and alterations, military uniform specialist, warm inviting atmosphere, professional lighting, purple accent, skilled tailor working, 4k professional photograph"},
    {"name": "STAR Sewing & Cleaners", "prompt": "Modern website hero image for STAR Sewing & Cleaners, military uniform tailoring, alterations, express service, warm inviting atmosphere, professional lighting, purple and orange accents, 4k professional photograph"},
    {"name": "Monarch Cleaners", "prompt": "Modern website hero image for Monarch Cleaners, professional dry cleaning, military uniform care, wedding dress cleaning, warm inviting atmosphere, professional lighting, purple accents, 4k professional photograph"},
    {"name": "One Stop Sewing & Cleaning", "prompt": "Modern website hero image for One Stop Sewing & Cleaning, Fort Bragg military sewing, uniform setup, boot shining, warm inviting atmosphere, professional lighting, purple and green accents, 4k professional photograph"},
    {"name": "Otrebla's Tailoring", "prompt": "Modern website hero image for Otrebla's Tailoring, custom bespoke tailoring, tuxedo rentals, luxury atmosphere, professional lighting, brown and purple accents, elegant tailor shop, 4k professional photograph"},
    {"name": "Lee's Alterations & Sewing", "prompt": "Modern website hero image for Lee's Alterations & Sewing, wedding dress alterations, same day service, family owned, warm inviting atmosphere, professional lighting, purple and pink accents, 4k professional photograph"},
    {"name": "Sue's Sewing & Laundry", "prompt": "Modern website hero image for Sue's Sewing & Laundry, one-stop alterations, boot repair, military discounts, warm inviting atmosphere, professional lighting, purple and pink accents, 4k professional photograph"},
    {"name": "Nan's Cleaners", "prompt": "Modern website hero image for Nan's Cleaners, military uniform dry cleaning, army specialist, warm inviting atmosphere, professional lighting, purple and cyan accents, 4k professional photograph"},
    {"name": "Kim's Speedy Sewing Shop", "prompt": "Modern website hero image for Kim's Speedy Sewing Shop, fast alterations, wedding dresses, leather work, warm inviting atmosphere, professional lighting, purple and green accents, 4k professional photograph"},
    {"name": "Lee's Tailors", "prompt": "Modern website hero image for Lee's Tailors, professional tailoring and alterations, skilled craftsmanship, warm inviting atmosphere, professional lighting, purple and blue accents, 4k professional photograph"},
    {"name": "Pak Cleaners", "prompt": "Modern website hero image for Pak Cleaners, military and civilian tailoring, alterations, dry cleaning, warm inviting atmosphere, professional lighting, purple and gray accents, 4k professional photograph"},
    {"name": "Choi's Sewing & Cleaning", "prompt": "Modern website hero image for Choi's Sewing & Cleaning, dry cleaning, alterations, affordable prices, warm inviting atmosphere, professional lighting, purple and orange accents, 4k professional photograph"},
    {"name": "SAS Military Surplus", "prompt": "Modern website hero image for SAS Military Surplus, military surplus buy sell trade, tactical gear, army uniforms, warm inviting atmosphere, professional lighting, red and gold accents, 4k professional photograph"},
    {"name": "Lone Wolf Tactical", "prompt": "Modern website hero image for Lone Wolf Tactical, veteran owned tactical gear, military surplus, outdoor equipment, adventure themed, warm inviting atmosphere, professional lighting, orange and black accents, 4k professional photograph"},
    {"name": "NC Military Supplies", "prompt": "Modern website hero image for North Carolina Military Supplies, SF veteran owned, military supplies, wholesale, warm inviting atmosphere, professional lighting, green and gold accents, 4k professional photograph"},
    {"name": "Make It Fit", "prompt": "Modern website hero image for Make It Fit, custom alterations, perfect fit solutions, personalized service, warm inviting atmosphere, professional lighting, purple and pink accents, 4k professional photograph"},
    {"name": "Tina's Alterations", "prompt": "Modern website hero image for Tina's Alterations, expert alterations, personalized service, warm inviting atmosphere, professional lighting, purple and orange accents, 4k professional photograph"},
    {"name": "Perfit", "prompt": "Modern website hero image for Perfit, perfect fit alterations, precision tailoring, warm inviting atmosphere, professional lighting, purple and pink accents, 4k professional photograph"},
    {"name": "Sewing Sensations", "prompt": "Modern website hero image for Sewing Sensations, quality sewing and alterations, creative services, warm inviting atmosphere, professional lighting, purple and pink accents, 4k professional photograph"},
    {"name": "S & F Sewing And Alterations", "prompt": "Modern website hero image for S & F Sewing And Alterations, professional sewing services, family owned, warm inviting atmosphere, professional lighting, purple and blue accents, 4k professional photograph"},
    {"name": "T & S Cleaning", "prompt": "Modern website hero image for T & S Cleaning, cleaning and alteration services, embroidery, warm inviting atmosphere, professional lighting, purple and cyan accents, 4k professional photograph"},
    {"name": "T & T Tailor & Alterations", "prompt": "Modern website hero image for T & T Tailor & Alterations, professional tailoring, warm inviting atmosphere, professional lighting, purple and indigo accents, 4k professional photograph"},
    {"name": "Tailorite", "prompt": "Modern website hero image for Tailorite, professional tailoring services, quality craftsmanship, warm inviting atmosphere, professional lighting, purple and deep purple accents, 4k professional photograph"},
    {"name": "AAA Tailor Shop", "prompt": "Modern website hero image for AAA Tailor Shop, quality tailoring, top rated, warm inviting atmosphere, professional lighting, purple and gold accents, 4k professional photograph"},
    {"name": "Connie's Sewing Room", "prompt": "Modern website hero image for Connie's Sewing Room, personalized sewing services, creative touch, warm inviting atmosphere, professional lighting, purple and pink accents, 4k professional photograph"},
    {"name": "Final Stitch Alterations & Clothing", "prompt": "Modern website hero image for Final Stitch Alterations & Clothing, perfect finishing touches, alterations, warm inviting atmosphere, professional lighting, purple and orange accents, 4k professional photograph"},
    {"name": "Jan's Cleaners & Alterations", "prompt": "Modern website hero image for Jan's Cleaners & Alterations, full service cleaners, quick alterations, warm inviting atmosphere, professional lighting, purple and teal accents, 4k professional photograph"},
    {"name": "McMurray Fabrics", "prompt": "Modern website hero image for McMurray Fabrics, textile manufacturer, quality fabrics, wholesale, warm inviting atmosphere, professional lighting, purple and brown accents, 4k professional photograph"},
    {"name": "Minh's Alteration Shop", "prompt": "Modern website hero image for Minh's Alteration Shop, expert alterations, personalized tailoring, warm inviting atmosphere, professional lighting, purple and cyan accents, 4k professional photograph"},
    {"name": "Spotless Cleaners & Alterations", "prompt": "Modern website hero image for Spotless Cleaners & Alterations, cleaning and alteration specialists, thorough service, warm inviting atmosphere, professional lighting, purple and green accents, 4k professional photograph"},
    {"name": "Mary's Alterations", "prompt": "Modern website hero image for Mary's Alterations, formalwear specialist, wedding dresses, prom dresses, warm inviting atmosphere, professional lighting, purple and pink accents, 4k professional photograph"},
]


def sanitize_filename(name):
    return re.sub(r'[^a-zA-Z0-9]', '_', name).strip('_').lower()


def build_prompt(text, filename_prefix):
    return {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "flux1-dev-fp8.safetensors"}
        },
        "2": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": text, "clip": ["1", 1]}
        },
        "3": {
            "class_type": "EmptySD3LatentImage",
            "inputs": {"width": 1344, "height": 768, "batch_size": 1}
        },
        "5": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": "", "clip": ["1", 1]}
        },
        "4": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["5", 0],
                "latent_image": ["3", 0],
                "seed": 42,
                "steps": 20,
                "cfg": 1.0,
                "sampler_name": "euler",
                "scheduler": "sgm_uniform",
                "denoise": 1.0
            }
        },
        "6": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["4", 0], "vae": ["1", 2]}
        },
        "7": {
            "class_type": "SaveImage",
            "inputs": {"images": ["6", 0], "filename_prefix": filename_prefix}
        }
    }


def queue_prompt(prompt_data):
    data = json.dumps({"prompt": prompt_data}).encode()
    req = urllib.request.Request(
        f"{COMFYUI_URL}/prompt",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())


def wait_for_prompt(prompt_id, timeout=600):
    start = time.time()
    while time.time() - start < timeout:
        req = urllib.request.Request(f"{COMFYUI_URL}/history/{prompt_id}")
        resp = urllib.request.urlopen(req)
        history = json.loads(resp.read())
        if prompt_id in history:
            entry = history[prompt_id]
            status = entry.get("status", {})
            if status.get("status_str") == "error":
                print(f"  ERROR: {entry.get('status', {}).get('messages', 'unknown')}")
                return None
            if status.get("completed"):
                outputs = entry.get("outputs", {})
                for node_id, output in outputs.items():
                    if "images" in output:
                        return output["images"]
                return []
        time.sleep(5)
    print(f"  TIMEOUT after {timeout}s")
    return None


def main():
    if "--list" in sys.argv:
        for i, s in enumerate(SHOPS, 1):
            print(f"  {i:2d}. {s['name']}")
        return

    # Filter to specific shops if args provided
    filter_names = [a for a in sys.argv[1:] if not a.startswith("-")]
    if filter_names:
        shops = [s for s in SHOPS if s["name"] in filter_names]
        if not shops:
            print(f"No matching shops found. Use --list to see names.")
            return
    else:
        shops = SHOPS

    print(f"Generating hero images for {len(shops)} shop(s)...")
    print(f"Output: ~/ComfyUI/output/\n")

    for i, shop in enumerate(shops, 1):
        prefix = f"hero_{sanitize_filename(shop['name'])}"
        print(f"[{i}/{len(shops)}] {shop['name']}...")

        prompt_data = build_prompt(shop["prompt"], prefix)
        result = queue_prompt(prompt_data)

        if "error" in result:
            print(f"  Queue error: {result['error']}")
            continue

        prompt_id = result["prompt_id"]
        images = wait_for_prompt(prompt_id)

        if images:
            for img in images:
                print(f"  Saved: {img['filename']}")
        print()

    print("Done! Images are in ~/ComfyUI/output/")
    print("To copy to shop folders:")
    print('  for f in ~/ComfyUI/output/hero_*.png; do echo "$f"; done')


if __name__ == "__main__":
    main()
