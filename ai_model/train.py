import torch
from torchvision import transforms
from dataset import MicroplasticDataset
from model import get_model

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

dataset = MicroplasticDataset(
    "dataset/images/train",
    "dataset/annotations/train",
    transforms=transforms.ToTensor()
)

loader = torch.utils.data.DataLoader(
    dataset,
    batch_size=2,
    shuffle=True,
    collate_fn=lambda x: tuple(zip(*x))
)

model = get_model(num_classes=2)
model.to(device)

optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)

for epoch in range(10):
    model.train()
    total_loss = 0

    for imgs, targets in loader:
        imgs = [img.to(device) for img in imgs]
        targets = [{k: v.to(device) for k, v in t.items()} for t in targets]

        losses = model(imgs, targets)
        loss = sum(loss for loss in losses.values())

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    print(f"Epoch {epoch+1} Loss: {total_loss:.3f}")

torch.save(model.state_dict(), "microplastic_detector.pth")
