# 🎬 ComfyUI Setup Guide for Sewing Ops

## Quick Install (macOS/Linux)

```bash
# 1. Clone ComfyUI
cd ~
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# 2. Install dependencies
pip install -r requirements.txt

# 3. Download free models
# Option A: Run the download script
chmod +x download_models.sh
./download_models.sh

# Option B: Manual download (see below)
```

## Free Models to Download

| Model | Link | Use For |
|-------|------|---------|
| **Flux.1 Dev** | https://huggingface.co/black-forest-labs/FLUX.1-dev | Best quality, fast |
| **SDXL 1.0** | https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0 | Good quality, versatile |
| **Pony** | https://civitai.com/models/25774/pony | People, characters |
| **Juggernaut** | https://civitai.com/models/13338/juggernaut-xl | Photorealistic |

### Download Commands

```bash
cd ~/ComfyUI/models/checkpoints

# Flux (8GB - best quality)
curl -L -o flux1-dev-fp8.safetensors "https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/flux1-dev-fp8.safetensors"

# SDXL (~6GB)
curl -L -o sdxl.safetensors "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"

# VAE (for better colors)
cd ../vae
curl -L -o sdxl-vae.safetensors "https://huggingface.co/stabilityai/sdxl-vae/resolve/main/sdxl-vae-fp16.safetensors"
```

## Launch ComfyUI

```bash
cd ~/ComfyUI

# macOS (M1/M2/M3)
./run_metal.sh

# NVIDIA GPU (Linux/Windows)
./run_gpu.sh

# CPU only (slow)
./run_cpu.sh
```

Then open: **http://127.0.0.1:8188**

## Quick Workflow

1. Open ComfyUI in browser
2. Load the Basic workflow (default)
3. Enter prompt from `all_prompts.json`
4. Click "Queue Prompt"
5. Images save to `~/ComfyUI/output/`

## Batch Generation

Once ComfyUI is running:

```bash
cd /Users/beers/Desktop/Sewing\ Ops/Assets
python3 comfyui_generator.py
```

## Folder Structure

```
~/ComfyUI/
├── models/
│   ├── checkpoints/    # Put .safetensors here
│   ├── loras/          # LoRA models
│   └── vae/           # VAE models
├── output/            # Generated images go here
├── custom_nodes/      # Extra nodes
└── workflows/        # Save workflows here
```

## Alternative: Pinokio (Easier)

Pinokio is a one-click installer for AI apps:

1. Download: https://pinokio.computer/
2. Install ComfyUI from the app
3. Models auto-download

## Sewing Ops Prompts

Your prompts are ready at:
```
/Users/beers/Desktop/Sewing Ops/Assets/all_prompts.json
```

Each shop has:
- `midjourney_prompts.hero` - Main hero image
- `midjourney_prompts.logo` - Logo design
- `heygen_script` - Video narration script
