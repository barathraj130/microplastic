import os

BASE = "datasets/underwater_plastic"

def clean(split):
    img_dir = os.path.join(BASE, split, "images")
    lbl_dir = os.path.join(BASE, split, "labels")

    removed = 0
    for lbl in os.listdir(lbl_dir):
        img_name = os.path.splitext(lbl)[0]
        img_found = False

        for ext in [".jpg", ".jpeg", ".png", ".JPG", ".PNG"]:
            if os.path.exists(os.path.join(img_dir, img_name + ext)):
                img_found = True
                break

        if not img_found:
            os.remove(os.path.join(lbl_dir, lbl))
            removed += 1

    print(f"✅ {split}: removed {removed} broken labels")

clean("train")
clean("valid")
