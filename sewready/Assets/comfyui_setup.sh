#!/bin/bash
# ComfyUI Setup for Sewing Ops Asset Pipeline
# Run this to install and configure ComfyUI with free models

echo "🎬 ComfyUI Setup for Sewing Ops"
echo "================================"

# Detect OS
OS="$(uname -s)"
case "$OS" in
    Linux*)     OS_NAME="linux";;
    Darwin*)    OS_NAME="macos";;
    CYGWIN*)    OS_NAME="windows";;
    MINGW*)     OS_NAME="windows";;
    *)          OS_NAME="unknown";;
esac

echo "Detected OS: $OS_NAME"

# Set install directory
COMFY_DIR="$HOME/ComfyUI"
echo "Install directory: $COMFY_DIR"

# Check for GPU
if command -v nvidia-smi &> /dev/null; then
    echo "✓ NVIDIA GPU detected"
    GPU="nvidia"
elif [ "$OS_NAME" = "macos" ] && sysctl -n machdep.cpu.brand_string | grep -q "Apple"; then
    echo "✓ Apple Silicon detected (M1/M2/M3)"
    GPU="apple"
else
    echo "⚠ No GPU detected - will use CPU (slow)"
    GPU="cpu"
fi

# Create directory
mkdir -p "$COMFY_DIR"
cd "$COMFY_DIR"

# Clone ComfyUI if not exists
if [ ! -d ".git" ]; then
    echo "📥 Cloning ComfyUI..."
    git clone https://github.com/comfyanonymous/ComfyUI.git .
else
    echo "✓ ComfyUI already installed"
fi

# Create models directory structure
mkdir -p models/checkpoints
mkdir -p models/loras
mkdir -p models/vae
mkdir -p models/embeddings
mkdir -p custom_nodes

echo "✓ Created model directories"

# Create download script for free models
cat > download_models.sh << 'EOF'
#!/bin/bash
# Download free Stable Diffusion models

echo "📥 Downloading free models..."

MODELS_DIR="./models/checkpoints"

# Flux (free, very good quality)
echo "Downloading Flux..."
curl -L -o "$MODELS_DIR/flux1-dev-fp8.safetensors" \
    "https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/flux1-dev-fp8.safetensors" 2>&1 | tail -5

# SDXL (free, good quality)
echo "Downloading SDXL..."
curl -L -o "$MODELS_DIR/sdxl_base.safetensors" \
    "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors" 2>&1 | tail -5

# Pony (good for people/characters)
echo "Downloading Pony..."
curl -L -o "$MODELS_DIR/pony.safetensors" \
    "https://huggingface.co/jthashimoto/ponyDiffusionV6Interp/resolve/main/ponyDiffusionV6Based_v6.safetensors" 2>&1 | tail -5

# VAE (for better colors)
echo "Downloading VAE..."
mkdir -p models/vae
curl -L -o "models/vae/sdxl-vae.safetensors" \
    "https://huggingface.co/stabilityai/sdxl-vae/resolve/main/sdxl-vae-fp16.safetensors" 2>&1 | tail -5

echo "✅ Models downloaded!"
ls -lh models/checkpoints/
EOF

chmod +x download_models.sh

# Create workspace for Sewing Ops
mkdir -p "$HOME/SewingOpsAssets"

# Create the asset generation workflow
cat > "$HOME/SewingOpsAssets/sewing_ops_workflow.json" << 'EOF'
{
  "nodes": [
    {
      "id": 1,
      "type": "TextPrompt",
      "pos": [50, 100],
      "size": [400, 200],
      "flags": {},
      "order": 0,
      "mode": 0,
      "outputs": [
        {"name": "prompt", "type": "STRING", "links": [10], "slot_index": 0}
      ],
      "properties": {"Node name for S&R": "TextPrompt"},
      "widgets_values": ["Modern website hero image for {shop_name}, {specialty}, warm inviting atmosphere, professional lighting, {color} accent color"]
    },
    {
      "id": 2,
      "type": "LoadCheckpoint",
      "pos": [50, 350],
      "size": [300, 100],
      "flags": {},
      "order": 1,
      "mode": 0,
      "outputs": [
        {"name": "model", "type": "MODEL", "links": [11]},
        {"name": "clip", "type": "CLIP", "links": [12]},
        {"name": "vae", "type": "VAE", "links": [13]}
      ],
      "widgets_values": ["flux1-dev-fp8.safetensors"]
    },
    {
      "id": 3,
      "type": "CLIPTextEncode",
      "pos": [400, 100],
      "size": [300, 200],
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [
        {"name": "clip", "type": "CLIP", "link": 12}
      ],
      "outputs": [
        {"name": "CONDITIONING", "type": "CONDITIONING", "links": [14]}
      ],
      "widgets_values": ["{prompt}"]
    },
    {
      "id": 4,
      "type": "EmptySD3Latent",
      "pos": [400, 350],
      "size": [200, 100],
      "flags": {},
      "order": 3,
      "mode": 0,
      "outputs": [
        {"name": "LATENT", "type": "LATENT", "links": [15]}
      ],
      "widgets_values": [1024, 1024, 1]
    },
    {
      "id": 5,
      "type": "KSampler",
      "pos": [650, 200],
      "size": [300, 300],
      "flags": {},
      "order": 4,
      "mode": 0,
      "inputs": [
        {"name": "model", "type": "MODEL", "link": 11},
        {"name": "positive", "type": "CONDITIONING", "link": 14},
        {"name": "negative", "type": "CONDITIONING", "link": 14},
        {"name": "latent", "type": "LATENT", "link": 15}
      ],
      "outputs": [
        {"name": "LATENT", "type": "LATENT", "links": [16]}
      ],
      "widgets_values": [20, 7, "euler", "normal", 1.0]
    },
    {
      "id": 6,
      "type": "VAEDecode",
      "pos": [1000, 200],
      "size": [200, 100],
      "flags": {},
      "order": 5,
      "mode": 0,
      "inputs": [
        {"name": "samples", "type": "LATENT", "link": 16},
        {"name": "vae", "type": "VAE", "link": 13}
      ],
      "outputs": [
        {"name": "IMAGE", "type": "IMAGE", "links": [17]}
      ]
    },
    {
      "id": 7,
      "type": "SaveImage",
      "pos": [1250, 200],
      "size": [300, 400],
      "flags": {},
      "order": 6,
      "mode": 0,
      "inputs": [
        {"name": "images", "type": "IMAGE", "link": 17}
      ],
      "widgets_values": ["{shop_name}_hero"]
    }
  ],
  "links": [
    [10, 1, 0, 3, 0, "STRING"],
    [11, 2, 0, 5, 0, "MODEL"],
    [12, 2, 1, 3, 1, "CLIP"],
    [13, 2, 2, 6, 1, "VAE"],
    [14, 3, 0, 5, 2, "CONDITIONING"],
    [15, 4, 0, 5, 3, "LATENT"],
    [16, 5, 0, 6, 0, "LATENT"],
    [17, 6, 0, 7, 0, "IMAGE"]
  ],
  "groups": [],
  "config": {},
  "extra": {
    "ds": {
      "scale": 1.0,
      "offset": [0, 0]
    }
  },
  "version": 0.4
}
EOF

echo ""
echo "✅ ComfyUI Setup Complete!"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Download models:"
echo "   cd $COMFY_DIR"
echo "   ./download_models.sh"
echo ""
echo "2. Launch ComfyUI:"
echo "   cd $COMFY_DIR"
echo "   ./run_$GPU.bat   # Windows"
echo "   # OR"
echo "   ./run_gpu.sh    # Mac/Linux"
echo ""
echo "3. Open browser to:"
echo "   http://127.0.0.1:8188"
echo ""
echo "4. Load workflow:"
echo "   $HOME/SewingOpsAssets/sewing_ops_workflow.json"
echo ""
echo "5. Put your prompts in:"
echo "   $HOME/SewingOpsAssets/prompts/"
echo ""
