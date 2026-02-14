#!/usr/bin/env python3
"""
Download translation model for offline translation

Supports different quantization levels:
- Q4_0 (219MB) - Fastest, lowest quality
- Q4_K_M (229MB) - Good balance (default)
- Q5_K_M (260MB) - Better quality
- Q6_K (293MB) - High quality
- Q8_0 (379MB) - Very high quality
- F16 (711MB) - Half precision
- F32 (1.42GB) - Full precision
"""
import os
import sys
import argparse
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
    # Available quantizations with sizes
    QUANTIZATIONS = {
        "Q4_0": {"size": "219MB", "desc": "Fastest, lowest quality"},
        "Q4_K_M": {"size": "229MB", "desc": "Good balance (recommended)"},
        "Q5_K_M": {"size": "260MB", "desc": "Better quality"},
        "Q6_K": {"size": "293MB", "desc": "High quality"},
        "Q8_0": {"size": "379MB", "desc": "Very high quality"},
        "F16": {"size": "711MB", "desc": "Half precision"},
        "F32": {"size": "1.42GB", "desc": "Full precision"}
    }

    parser = argparse.ArgumentParser(
        description="Download LFM2-350M Japanese-English translation model",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Available quantizations:
{chr(10).join(f"  {q:8} - {info['size']:8} - {info['desc']}" for q, info in QUANTIZATIONS.items())}

Example:
  python3 download_translation_model.py Q4_K_M
  python3 download_translation_model.py Q8_0
"""
    )
    parser.add_argument(
        "quantization",
        nargs="?",
        default="Q4_K_M",
        choices=list(QUANTIZATIONS.keys()),
        help="Model quantization level (default: Q4_K_M)"
    )

    args = parser.parse_args()
    quant = args.quantization

    print("=" * 60)
    print("Translation Model Download")
    print("=" * 60)
    print()
    print(f"Quantization: {quant} ({QUANTIZATIONS[quant]['size']}) - {QUANTIZATIONS[quant]['desc']}")
    print()

    # Model directory - use environment variable or default to relative path
    models_path = os.getenv("MODELS_DIR", str(Path(__file__).parent.parent.parent / "data" / "models"))
    models_dir = Path(models_path)
    models_dir.mkdir(parents=True, exist_ok=True)

    print(f"Models directory: {models_dir}")
    print()

    # Download LiquidAI LFM2-350M-ENJP-MT model
    model_filename = f"LFM2-350M-ENJP-MT-{quant}.gguf"
    model_url = f"https://huggingface.co/LiquidAI/LFM2-350M-ENJP-MT-GGUF/resolve/main/{model_filename}"
    model_path = models_dir / model_filename

    try:
        download_file(model_url, model_path, f"Translation Model ({quant})")
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
    print(f"To use this model, update your docker-compose.yml llamacpp service")
    print(f"to use: /models/{model_filename}")
    print()

    return 0


if __name__ == "__main__":
    sys.exit(main())
