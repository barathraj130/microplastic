import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import cv2
import numpy as np

# -----------------------------
# PATH & DEVICE
# -----------------------------
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ml_model", "microplastic_cnn.pth")
DEVICE = torch.device("cpu")

# -----------------------------
# LOAD MODEL (RESNET18)
# -----------------------------
model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, 2)

state = torch.load(MODEL_PATH, map_location=DEVICE)
model.load_state_dict(state)
model.to(DEVICE)
model.eval()

print("✅ ResNet18 Microplastic Model Loaded")

# -----------------------------
# IMAGE TRANSFORM
# -----------------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

# -----------------------------
# CORE PREDICTION FUNCTION
# -----------------------------
def _predict_tensor(img_tensor):
    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.softmax(outputs, dim=1)[0]
        confidence, pred = torch.max(probs, 0)

    label = "MICROPLASTIC" if pred.item() == 1 else "CLEAN WATER"
    return label, float(confidence)

# -----------------------------
# IMAGE FILE INFERENCE
# -----------------------------
def detect_microplastic_image(image_path):
    img = Image.open(image_path).convert("RGB")
    tensor = transform(img).unsqueeze(0).to(DEVICE)
    return _predict_tensor(tensor)

# -----------------------------
# VIDEO FRAME / LIVE STREAM INFERENCE
# -----------------------------
def detect_microplastic_frame(frame_bgr):
    """
    frame_bgr: OpenCV frame (BGR)
    """
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    img = Image.fromarray(frame_rgb)
    tensor = transform(img).unsqueeze(0).to(DEVICE)
    return _predict_tensor(tensor)

# -----------------------------
# VIDEO FILE INFERENCE
# -----------------------------
def detect_microplastic_video(video_path, sample_rate=10):
    """
    sample_rate: check 1 frame every N frames
    """
    cap = cv2.VideoCapture(video_path)
    detections = []
    frame_id = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_id % sample_rate == 0:
            label, conf = detect_microplastic_frame(frame)
            detections.append((label, conf))

        frame_id += 1

    cap.release()

    # Final decision = majority vote
    micro_count = sum(1 for d, _ in detections if d == "MICROPLASTIC")
    clean_count = len(detections) - micro_count

    final_label = "MICROPLASTIC" if micro_count > clean_count else "CLEAN WATER"
    avg_conf = np.mean([c for _, c in detections]) if detections else 0.0

    return final_label, float(avg_conf)
