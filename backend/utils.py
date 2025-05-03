from pathlib import Path
import os


def get_image_paths():
    IMAGES_DIR = Path("images")
    image_paths = [str(file) for file in IMAGES_DIR.iterdir() if file.is_file() and file.suffix == ".jpeg"]
    return image_paths


def delete_image():
    IMAGES_DIR = Path("images")
    for file in IMAGES_DIR.iterdir():
        if file.is_file() and file.suffix == ".jpeg":
            os.remove(file)
