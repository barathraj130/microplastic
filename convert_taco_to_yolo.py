import json
import os
import shutil
import random
from tqdm import tqdm

# =========================
# CONFIG
# =========================

# 🔴 Correct TACO path (confirmed by you)
TACO_DATA = "datasets/TACO/data"


# Output YOLO dataset
OUTPUT = "yolo_model/datasets/taco_yolo"

TRAIN_SPLIT = 0.8

# Only plastic-related classes
PLASTIC_CLASSES = [
    "Plastic bag",
    "Plastic bottle",
    "Plastic container",
    "Plastic film",
    "Plastic wrapper",
    "Plastic cup"
]

# =========================
# CREATE YOLO FOLDERS
# =========================

os.makedirs(f"{OUTPUT}/images/train", exist_ok=True)
os.makedirs(f"{OUTPUT}/images/val", exist_ok=True)
os.makedirs(f"{OUTPUT}/labels/train", exist_ok=True)
os.makedirs(f"{OUTPUT}/labels/val", exist_ok=True)

# =========================
# LOAD COCO ANNOTATIONS
# =========================

with open(f"{TACO_DATA}/annotations.json", "r") as f:
    coco = json.load(f)

# Map category_id → class_index
categories = {}
class_id_map = {}

for c in coco["categories"]:
    if c["name"] in PLASTIC_CLASSES:
        class_id_map[c["id"]] = len(categories)
        categories[c["id"]] = c["name"]

print("✅ Plastic classes used:")
for k, v in categories.items():
    print(f"{class_id_map[k]} → {v}")

# Image lookup
images = {img["id"]: img for img in coco["images"]}

# Collect annotations per image
annotations = {}
for ann in coco["annotations"]:
    if ann["category_id"] in categories:
        annotations.setdefault(ann["image_id"], []).append(ann)

image_ids = list(annotations.keys())
random.shuffle(image_ids)

split_index = int(len(image_ids) * TRAIN_SPLIT)

# =========================
# BBOX CONVERSION
# =========================

def convert_bbox(bbox, img_w, img_h):
    x, y, w, h = bbox
    return (
        (x + w / 2) / img_w,
        (y + h / 2) / img_h,
        w / img_w,
        h / img_h
    )

# =========================
# CONVERSION LOOP
# =========================

for i, img_id in enumerate(tqdm(image_ids, desc="Converting TACO → YOLO")):
    img = images[img_id]
    anns = annotations[img_id]

    src_img = os.path.join(TACO_DATA, img["file_name"])
    if not os.path.exists(src_img):
        continue

    subset = "train" if i < split_index else "val"

    # Copy image
    dst_img = f"{OUTPUT}/images/{subset}/{os.path.basename(src_img)}"
    shutil.copy(src_img, dst_img)

    # Write label file
    label_file = os.path.splitext(os.path.basename(src_img))[0] + ".txt"
    label_path = f"{OUTPUT}/labels/{subset}/{label_file}"

    with open(label_path, "w") as lf:
        for ann in anns:
            cls_id = class_id_map[ann["category_id"]]
            x, y, w, h = convert_bbox(
                ann["bbox"], img["width"], img["height"]
            )
            lf.write(f"{cls_id} {x:.6f} {y:.6f} {w:.6f} {h:.6f}\n")

print("\n✅ TACO → YOLO conversion completed successfully")
print(f"📁 Dataset saved at: {OUTPUT}")
