import os
import torch
from PIL import Image

class MicroplasticDataset(torch.utils.data.Dataset):
    def __init__(self, img_dir, ann_dir, transforms=None):
        self.img_dir = img_dir
        self.ann_dir = ann_dir
        self.transforms = transforms
        self.images = os.listdir(img_dir)

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_path = os.path.join(self.img_dir, self.images[idx])
        ann_path = os.path.join(
            self.ann_dir,
            self.images[idx].replace(".jpg", ".txt")
        )

        image = Image.open(img_path).convert("RGB")
        boxes, labels = [], []

        if os.path.exists(ann_path):
            with open(ann_path) as f:
                for line in f:
                    x1, y1, x2, y2, cls = map(int, line.split())
                    boxes.append([x1, y1, x2, y2])
                    labels.append(cls + 1)

        target = {
            "boxes": torch.tensor(boxes, dtype=torch.float32),
            "labels": torch.tensor(labels, dtype=torch.int64)
        }

        if self.transforms:
            image = self.transforms(image)

        return image, target
