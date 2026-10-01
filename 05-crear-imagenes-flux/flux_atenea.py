"""
Generación de imágenes de ambientación vía Atenea (Falabella).
Llama directamente a la API de Atenea sin pasar por el proxy de Firebase.
"""

import os
import base64
import json
import requests
from atenea_auth import get_atenea_token, refresh_atenea_token

ATENEA_GENERATE_URL = "https://atenea.falabella.com/api/services/generate-content"
FALABELLA_CDN       = "https://media.falabella.com"


def get_falabella_image_b64(sku: str, store: str = "falabellaCO", index: int = 1) -> str | None:
    """Descarga la imagen de un SKU del CDN y la retorna en base64."""
    url = f"{FALABELLA_CDN}/{store}/{sku}_{index}/w=800,h=800,fit=pad"
    res = requests.get(url, timeout=20)
    if not res.ok:
        return None
    return base64.b64encode(res.content).decode("utf-8")


def generate_flux_image(
    access_token: str,
    images_b64: list[str],
    prompt: str = "",
    aspect_ratio: str = "1:1",
    image_size: str = "1K",
) -> list[dict]:
    """
    Llama a la API de Atenea para generar imágenes de ambientación.
    Retorna lista de dicts con 'mimeType' y 'data' (base64).
    """
    parts = [
        {"inlineData": {"data": img, "mimeType": "image/jpeg"}}
        for img in images_b64
        if img
    ]
    if prompt:
        parts.append({"text": prompt})

    payload = {
        "model": "gemini-3.1-flash-image",
        "contents": [{"parts": parts}],
        "config": {
            "imageConfig": {
                "aspectRatio": aspect_ratio,
                "imageSize": image_size,
            }
        },
    }

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    res = requests.post(ATENEA_GENERATE_URL, json={"payload": payload}, headers=headers, timeout=120)
    res.raise_for_status()
    data = res.json()

    results = []
    for candidate in data.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if "inlineData" in part:
                results.append(part["inlineData"])
    return results


def save_images(images: list[dict], output_dir: str = ".", prefix: str = "flux"):
    """Guarda las imágenes generadas en disco."""
    os.makedirs(output_dir, exist_ok=True)
    for i, img in enumerate(images):
        ext = img.get("mimeType", "image/webp").split("/")[-1]
        filename = os.path.join(output_dir, f"{prefix}_flux_{i + 1}.{ext}")
        with open(filename, "wb") as f:
            f.write(base64.b64decode(img["data"]))
        print(f"Guardado: {filename}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Genera imágenes de ambientación vía Atenea")
    parser.add_argument("sku", help="SKU del producto Falabella")
    parser.add_argument("--store", default="falabellaCO", choices=["falabellaCO", "falabellaCL", "falabellaPE"])
    parser.add_argument("--prompt", default="", help="Prompt adicional de ambientación")
    parser.add_argument("--aspect", default="1:1", help="Aspect ratio (ej: 1:1, 4:3, 16:9)")
    parser.add_argument("--size", default="1K", help="Tamaño de imagen (1K, 2K)")
    parser.add_argument("--qty", type=int, default=2, help="Cantidad de imágenes a generar")
    parser.add_argument("--output", default=".", help="Carpeta de salida")
    args = parser.parse_args()

    print(f"Autenticando con Atenea...")
    token_data = get_atenea_token()
    access_token = token_data["access_token"]

    print(f"Descargando imágenes del CDN para SKU {args.sku}...")
    images_b64 = []
    for i in range(1, 4):
        img = get_falabella_image_b64(args.sku, args.store, i)
        if img:
            images_b64.append(img)
            print(f"  Imagen {i}: OK")
        else:
            print(f"  Imagen {i}: no disponible")

    if not images_b64:
        print("No se encontraron imágenes para el SKU. Verifica el SKU y el store.")
        exit(1)

    print(f"Generando {args.qty} imagen(es)...")
    for n in range(args.qty):
        results = generate_flux_image(
            access_token, images_b64,
            prompt=args.prompt,
            aspect_ratio=args.aspect,
            image_size=args.size,
        )
        save_images(results, output_dir=args.output, prefix=args.sku)

    print("Listo.")
