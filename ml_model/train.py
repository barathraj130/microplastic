import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader

# -------------------------
# PATH
# -------------------------
DATASET_DIR = "dataset"

POSITIVE_FOLDERS = [
    "PE", "PE_with_dust",
    "PS", "PS_with_dust",
    "PHA", "PHA_with_dust",
    "microplastic", "mixed"
]

NEGATIVE_FOLDERS = [
    "clean", "bubble", "none", "LEPD_with_dust"
]

# -------------------------
# TRANSFORMS
# -------------------------
transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
])

# -------------------------
# CUSTOM DATASET
# -------------------------
class MicroplasticDataset(torch.utils.data.Dataset):
    def __init__(self):
        self.samples = []

        for folder in POSITIVE_FOLDERS:
            path = os.path.join(DATASET_DIR, folder)
            for img in os.listdir(path):
                self.samples.append((os.path.join(path, img), 1))

        for folder in NEGATIVE_FOLDERS:
            path = os.path.join(DATASET_DIR, folder)
            for img in os.listdir(path):
                self.samples.append((os.path.join(path, img), 0))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = datasets.folder.default_loader(img_path)
        image = transform(image)
        return image, label

dataset = MicroplasticDataset()
loader = DataLoader(dataset, batch_size=16, shuffle=True)

# -------------------------
# MODEL
# -------------------------
model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, 2)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

# -------------------------
# TRAINING
# -------------------------
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.0001)

for epoch in range(10):
    model.train()
    total_loss = 0

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    print(f"Epoch {epoch+1}: Loss = {total_loss:.4f}")

# -------------------------
# SAVE MODEL
# -------------------------
torch.save(model.state_dict(), "microplastic_cnn.pth")
print("✅ Training complete, model saved")
