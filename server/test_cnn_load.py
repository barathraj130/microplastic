import torch
import torch.nn as nn
from torchvision import models

def test_load():
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 2)
    
    path = '../ml_model/microplastic_cnn.pth'
    try:
        model.load_state_dict(torch.load(path, map_location='cpu'))
        model.eval()
        print("✅ CNN Model loaded successfully (ResNet18 architecture)")
    except Exception as e:
        print(f"❌ Failed to load CNN model: {e}")

if __name__ == "__main__":
    test_load()
