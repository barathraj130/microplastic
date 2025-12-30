# ===================== FORCE OFFLINE MODE (CRITICAL) =====================
import os

os.environ["YOLO_OFFLINE"] = "true"
os.environ["ULTRALYTICS_SETTINGS"] = "false"
os.environ["ULTRALYTICS_HUB"] = "false"

# ===================== IMPORTS =====================
import uuid
import time
import json
import cv2

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from ultralytics import YOLO

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

# ===================== PATH SETUP =====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
STATIC_DIR = os.path.join(BASE_DIR, "static")
HISTORY_FILE = os.path.join(BASE_DIR, "history.json")

YOLO_MODEL_PATH = os.path.join(
    BASE_DIR, "yolo_model", "weights", "best.pt"
)

CNN_MODEL_PATH = os.path.join(
    os.path.dirname(BASE_DIR),
    "ml_model",
    "microplastic_cnn.pth"
)

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

# ===================== DEVICE =====================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"📦 Initializing Detection Engine (Device: {device})")

# ===================== STAGE 1: YOLO =====================
yolo_model = None
try:
    if not os.path.isfile(YOLO_MODEL_PATH):
        raise FileNotFoundError(f"YOLO model missing: {YOLO_MODEL_PATH}")

    yolo_model = YOLO(YOLO_MODEL_PATH)
    print("✅ YOLO model loaded (OFFLINE MODE)")
except Exception as e:
    print(f"❌ YOLO Load Error: {e}")
    yolo_model = None

# ===================== STAGE 2: CNN (OPTIONAL FILTER) =====================
cnn_model = None

cnn_transforms = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
])

try:
    if os.path.isfile(CNN_MODEL_PATH):
        cnn_model = models.resnet18(weights=None)
        cnn_model.fc = nn.Linear(cnn_model.fc.in_features, 2)
        cnn_model.load_state_dict(
            torch.load(CNN_MODEL_PATH, map_location=device)
        )
        cnn_model.to(device)
        cnn_model.eval()
        print("✅ CNN Auditor loaded")
    else:
        print("⚠️ CNN weights not found → YOLO-only mode")
except Exception as e:
    print(f"❌ CNN Load Error: {e}")
    cnn_model = None

# ===================== HISTORY =====================
def save_to_history(entry):
    try:
        history = []
        if os.path.isfile(HISTORY_FILE):
            with open(HISTORY_FILE, "r") as f:
                history = json.load(f)

        history.insert(0, entry)
        history = history[:50]

        with open(HISTORY_FILE, "w") as f:
            json.dump(history, f, indent=2)
    except Exception as e:
        print(f"🚨 History error: {e}")

# ===================== FLASK APP =====================
app = Flask(__name__)
CORS(app)

# ===================== DETECTION PARAMS =====================
CONF_THRESHOLD = 0.02
BRIGHTNESS_LIMIT = 150

# ===================== ROUTES =====================
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "Microplastic Detection API Online"}), 200


@app.route("/api/history", methods=["GET"])
def history():
    if os.path.isfile(HISTORY_FILE):
        with open(HISTORY_FILE, "r") as f:
            return jsonify(json.load(f))
    return jsonify([])


@app.route("/api/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(STATIC_DIR, filename)


@app.route("/upload", methods=["POST"])
def upload():
    if not yolo_model:
        return jsonify({"error": "YOLO model not loaded"}), 500

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    uid = uuid.uuid4().hex
    input_path = os.path.join(UPLOAD_DIR, f"{uid}.jpg")
    file.save(input_path)

    img = cv2.imread(input_path)
    if img is None:
        return jsonify({"error": "Invalid image"}), 400

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    detections = 0
    max_conf = 0.0

    try:
        results = yolo_model(input_path, conf=0.001, verbose=False)

        for r in results:
            if r.boxes is None:
                continue

            for box in r.boxes:
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                roi = gray[y1:y2, x1:x2]
                if roi.size == 0 or roi.mean() > BRIGHTNESS_LIMIT:
                    continue

                is_plastic = True

                if cnn_model:
                    crop = img[y1:y2, x1:x2]
                    if crop.size > 0:
                        crop_pil = Image.fromarray(
                            cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
                        )
                        tensor = cnn_transforms(crop_pil).unsqueeze(0).to(device)
                        with torch.no_grad():
                            out = cnn_model(tensor)
                            prob = torch.softmax(out, dim=1)[0][1].item()
                            is_plastic = prob > 0.5

                if conf >= CONF_THRESHOLD and is_plastic:
                    detections += 1
                    max_conf = max(max_conf, conf)
                    cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    cv2.putText(
                        img,
                        f"PLASTIC {conf:.2f}",
                        (x1, y1 - 6),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0, 0, 255),
                        2,
                    )

    except Exception as e:
        print(f"🚨 Inference error: {e}")

    status = "Microplastics Detected" if detections else "Clean Water"
    color = "danger" if detections else "safe"

    out_name = f"result_{uid}.jpg"
    cv2.imwrite(os.path.join(STATIC_DIR, out_name), img)

    response = {
        "status": status,
        "detections": detections,
        "confidence": round(max_conf, 3),
        "color": color,
        "image_url": f"/api/static/{out_name}",
        "timestamp": int(time.time()),
        "engine": "YOLOv8 + CNN" if cnn_model else "YOLOv8",
    }

    save_to_history(response)
    print(f"🏁 Scan Complete → {status} | Count: {detections}")

    return jsonify(response)

# ===================== RUN =====================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
