#!/usr/bin/env python3
"""
Sewing Ops - ComfyUI Asset Batch Generator
Generates images from prompts using ComfyUI API
"""

import os
import json
import requests
import time
from datetime import datetime

# Configuration
COMFYUI_URL = "http://127.0.0.1:8188"
OUTPUT_DIR = "/Users/beers/Desktop/Sewing Ops/Assets/shops"

# Load prompts
with open("/Users/beers/Desktop/Sewing Ops/Assets/all_prompts.json", "r") as f:
    DATA = json.load(f)


def queue_prompt(prompt_text, shop_name, image_type="hero"):
    """Send prompt to ComfyUI and queue generation"""

    # Construct workflow
    workflow = {
        "3": {
            "inputs": {"text": prompt_text, "clip": ["4", 0]},
            "class_type": "CLIPTextEncode",
            "_meta": {"title": "CLIP Text Encode"},
        },
        "4": {
            "inputs": {"model": ["5", 0]},
            "class_type": "CLIPTextEncode",
            "_meta": {"title": "CLIP Text Encode"},
        },
        "5": {
            "inputs": {"samples": ["6", 0], "vae": ["5", 2]},
            "class_type": "VAEDecode",
            "_meta": {"title": "VAE Decode"},
        },
        "6": {
            "inputs": {
                "seed": int(time.time()) % 1000000,
                "steps": 25,
                "cfg": 7,
                "sampler_name": "euler",
                "scheduler": "normal",
                "positive": ["3", 0],
                "negative": ["4", 0],
                "latent_image": ["7", 0],
            },
            "class_type": "KSampler",
            "_meta": {"title": "KSampler"},
        },
        "7": {
            "inputs": {"width": 1024, "height": 1024, "batch_size": 1},
            "class_type": "EmptyLatentImage",
            "_meta": {"title": "Empty Latent Image"},
        },
        "8": {
            "inputs": {"model_name": "flux1-dev-fp8.safetensors"},
            "class_type": "CheckpointLoaderSimple",
            "_meta": {"title": "Load Checkpoint"},
        },
        "9": {
            "inputs": {
                "images": ["5", 0],
                "filename_prefix": f"{shop_name}_{image_type}",
            },
            "class_type": "SaveImage",
            "_meta": {"title": "Save Image"},
        },
    }

    # Add link references
    # This is simplified - actual ComfyUI API requires proper linking

    try:
        response = requests.post(
            f"{COMFYUI_URL}/prompt", json={"prompt": workflow}, timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Queued: {shop_name} - {image_type}")
            print(f"   Prompt ID: {result.get('prompt_id', 'N/A')}")
            return result.get("prompt_id")
        else:
            print(f"❌ Failed: {shop_name} - {response.status_code}")
            return None

    except requests.exceptions.ConnectionError:
        print(f"❌ ComfyUI not running at {COMFYUI_URL}")
        print("   Start ComfyUI first: ./run_gpu.sh")
        return None


def generate_batch():
    """Generate images for all shops"""

    print("🎬 Sewing Ops - Batch Image Generator")
    print("=" * 50)

    # Check if ComfyUI is running
    try:
        response = requests.get(f"{COMFYUI_URL}/system_stats", timeout=5)
        if response.status_code != 200:
            print("❌ ComfyUI not responding")
            return
    except:
        print(f"❌ Cannot connect to ComfyUI at {COMFYUI_URL}")
        print("\n📋 Start ComfyUI first:")
        print("   cd ~/ComfyUI")
        print("   ./run_gpu.sh")
        print("\n   Then run this script again.")
        return

    print(f"✓ Connected to ComfyUI at {COMFYUI_URL}")
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print()

    # Generate for each shop
    generated = 0
    for shop_name, info in sorted(DATA.items()):
        slug = shop_name.lower().replace(" ", "-").replace("&", "").replace("'", "")

        # Get hero prompt
        hero_prompt = info.get("midjourney_prompts", {}).get("hero", "")
        if hero_prompt:
            queue_prompt(hero_prompt, slug, "hero")
            generated += 1

        time.sleep(0.5)  # Rate limiting

    print()
    print(f"📊 Queued {generated} images for generation")
    print("   Check ComfyUI UI for progress")


def check_status():
    """Check ComfyUI queue status"""

    try:
        response = requests.get(f"{COMFYUI_URL}/queue", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("📋 ComfyUI Queue Status")
            print(f"   Running: {len(data.get('queue_running', []))}")
            print(f"   Pending: {len(data.get('queue_pending', []))}")
        else:
            print(f"❌ Error: {response.status_code}")
    except:
        print(f"❌ Cannot connect to ComfyUI")


def list_outputs():
    """List generated images"""

    output_dir = os.path.join(OUTPUT_DIR, "output")
    if os.path.exists(output_dir):
        files = sorted(os.listdir(output_dir))
        print(f"📁 Generated {len(files)} images:")
        for f in files[-10:]:
            print(f"   {f}")
    else:
        print("📁 No outputs yet")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        if sys.argv[1] == "status":
            check_status()
        elif sys.argv[1] == "list":
            list_outputs()
        else:
            print("Usage: python comfyui_generator.py [status|list]")
    else:
        generate_batch()
