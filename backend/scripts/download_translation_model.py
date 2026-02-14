#!/usr/bin/env python3
"""
Download translation model for offline translation
"""
import os
import sys
import requests
from pathlib import Path
from tqdm import tqdm


def download_file(url: str, destination: Path, description: str):
    """Download a file with progress bar"""
    if destination.exists():
        print(f"✓ {description} already exists")
        return

    print(f"Downloading {description}...")
    print(f"  URL: {url}")
    print(f"  Destination: {destination}")

    response = requests.get(url, stream=True)
    response.raise_for_status()

    total_size = int(response.headers.get('content-length', 0))

    with open(destination, 'wb') as f:
        with tqdm(total=total_size, unit='B', unit_scale=True, desc=description) as pbar:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    pbar.update(len(chunk))

    print(f"✓ Downloaded {description}")


def main():
    print("=" * 60)
    print("Translation Model Download")
    print("=" * 60)
    print()

    # Model directory - use environment variable or default to relative path
    models_path = os.getenv("MODELS_DIR", str(Path(__file__).parent.parent.parent / "data" / "models"))
    models_dir = Path(models_path)
    models_dir.mkdir(parents=True, exist_ok=True)

    print(f"Models directory: {models_dir}")
    print()

    # Download LiquidAI LFM2-350M-ENJP-MT model (GGUF Q4_K_M quantization - 229MB)
    model_url = "https://huggingface.co/LiquidAI/LFM2-350M-ENJP-MT-GGUF/resolve/main/LFM2-350M-ENJP-MT-Q4_K_M.gguf"
    model_path = models_dir / "LFM2-350M-ENJP-MT-Q4_K_M.gguf"

    try:
        download_file(model_url, model_path, "Translation Model (GGUF)")
    except Exception as e:
        print(f"✗ Failed to download model: {e}", file=sys.stderr)
        return 1

    print()
    print("=" * 60)
    print("Model download complete!")
    print("=" * 60)
    print()
    print(f"Model location: {model_path}")
    print(f"Model size: {model_path.stat().st_size / 1024 / 1024:.1f} MB")
    print()

    return 0


if __name__ == "__main__":
    sys.exit(main())
