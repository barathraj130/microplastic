# ===================== FORCE OFFLINE MODE =====================
import os
os.environ["YOLO_OFFLINE"] = "true"
os.environ["ULTRALYTICS_SETTINGS"] = "false"
os.environ["ULTRALYTICS_HUB"] = "false"

# ===================== IMPORTS =====================
import uuid
import time
import json
import cv2
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS
from ultralytics import YOLO

# ===================== PATH SETUP =====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
STATIC_DIR = os.path.join(BASE_DIR, "static")
HISTORY_FILE = os.path.join(BASE_DIR, "history.json")

# 🔴 IMPORTANT FIX — model is OUTSIDE server folder
ROOT_DIR = os.path.dirname(BASE_DIR)

YOLO_MODEL_PATH = os.path.join(ROOT_DIR, "ml_model", "weights", "best.pt")
CNN_MODEL_PATH  = os.path.join(ROOT_DIR, "ml_model", "microplastic_cnn.pth")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

print("YOLO PATH:", YOLO_MODEL_PATH)
print("YOLO EXISTS:", os.path.isfile(YOLO_MODEL_PATH))

# ===================== DEVICE =====================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"🚀 Detection Engine starting (Device: {device})")

# ===================== LOAD YOLO =====================
if not os.path.isfile(YOLO_MODEL_PATH):
    raise FileNotFoundError(f"❌ YOLO model missing: {YOLO_MODEL_PATH}")

yolo_model = YOLO(YOLO_MODEL_PATH)
print("✅ YOLO loaded (offline)")

# ===================== LOAD CNN (OPTIONAL) =====================
cnn_model = None
cnn_tf = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
])

if os.path.isfile(CNN_MODEL_PATH):
    cnn_model = models.resnet18(weights=None)
    cnn_model.fc = nn.Linear(cnn_model.fc.in_features, 2)
    cnn_model.load_state_dict(
        torch.load(CNN_MODEL_PATH, map_location=device, weights_only=False)
    )
    cnn_model.to(device).eval()
    print("✅ CNN auditor loaded")
else:
    print("⚠️ CNN not found → YOLO only")

# ===================== FLASK APP =====================
app = Flask(__name__)
CORS(app)

# ===================== PARAMS (CONFIGURABLE) =====================
CONF_THRESHOLD = 0.15       # Accept detections with 15%+ confidence (lowered)
YOLO_CONF = 0.05            # YOLO initial detection threshold (lowered)
CNN_THRESHOLD = 0.6         # CNN validation threshold (if enabled)
USE_CNN_VALIDATION = False  # Set to True to enable CNN double-check

# ===================== HISTORY =====================
def save_to_history(entry):
    history = []
    if os.path.isfile(HISTORY_FILE):
        with open(HISTORY_FILE) as f:
            history = json.load(f)

    history.insert(0, entry)
    history[:] = history[:50]

    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)

# ===================== CNN VALIDATION =====================
def validate_with_cnn(roi_bgr):
    """
    Validate detection with CNN classifier
    Returns (is_plastic: bool, confidence: float)
    """
    if cnn_model is None or roi_bgr.size == 0:
        return True, 1.0  # If no CNN, accept all
    
    try:
        # Convert BGR to RGB
        roi_rgb = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(roi_rgb)
        
        # Transform and predict
        tensor = cnn_tf(pil_img).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = cnn_model(tensor)
            probs = torch.softmax(outputs, dim=1)[0]
            confidence = float(probs[1])  # Probability of being plastic
            is_plastic = confidence >= CNN_THRESHOLD
        
        return is_plastic, confidence
    except Exception as e:
        print(f"⚠️ CNN validation error: {e}")
        return True, 1.0  # On error, accept detection

# ===================== ROUTES =====================
@app.route("/")
def health():
    return jsonify({"status": "NIVORA AI Detection API Online"})

@app.route("/api/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(STATIC_DIR, filename)

@app.route("/api/history", methods=["GET"])
def get_history():
    """Return detection history"""
    if os.path.isfile(HISTORY_FILE):
        with open(HISTORY_FILE) as f:
            history = json.load(f)
        return jsonify(history)
    return jsonify([])

# ===================== IMAGE UPLOAD =====================
@app.route("/upload", methods=["POST"])
def upload():
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        uid = uuid.uuid4().hex
        input_path = os.path.join(UPLOAD_DIR, f"{uid}.jpg")
        file.save(input_path)

        img = cv2.imread(input_path)
        if img is None:
            return jsonify({"error": "Invalid image"}), 400

        detections = 0
        max_conf = 0.0

        # Run YOLO detection
        results = yolo_model(img, conf=YOLO_CONF, verbose=False)

        print(f"🔍 YOLO candidates:", len(results[0].boxes) if results[0].boxes else 0)

        for r in results:
            if r.boxes is None:
                continue

            for box in r.boxes:
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                # Extract ROI
                roi = img[y1:y2, x1:x2]
                if roi.size == 0:
                    continue

                # Validate with CNN if enabled
                is_plastic = True
                cnn_conf = 1.0
                
                if USE_CNN_VALIDATION and cnn_model is not None:
                    is_plastic, cnn_conf = validate_with_cnn(roi)
                    print(f"📦 YOLO: {conf:.3f} | CNN: {cnn_conf:.3f} | Plastic: {is_plastic}")
                else:
                    print(f"📦 YOLO: {conf:.3f}")

                # Accept if passes both thresholds
                if conf >= CONF_THRESHOLD and is_plastic:
                    detections += 1
                    max_conf = max(max_conf, conf)
                    
                    # Draw bounding box
                    cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    
                    # Add label
                    label = f"PLASTIC {conf:.2f}"
                    if USE_CNN_VALIDATION:
                        label = f"P:{conf:.2f}|C:{cnn_conf:.2f}"
                    
                    cv2.putText(
                        img,
                        label,
                        (x1, y1 - 6),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0, 0, 255),
                        2,
                    )
                    print("✅ Accepted detection")

        # Save result image
        out_name = f"result_{uid}.jpg"
        cv2.imwrite(os.path.join(STATIC_DIR, out_name), img)

        # Create response
        response = {
            "status": "Microplastics Detected" if detections else "Clean Water",
            "detections": detections,
            "confidence": round(max_conf, 3),
            "color": "danger" if detections else "safe",
            "image_url": f"/api/static/{out_name}",
            "timestamp": int(time.time()),
        }

        save_to_history(response)
        return jsonify(response)

    except Exception as e:
        print("❌ UPLOAD ERROR:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ===================== LIVE ESP32 STREAM =====================
ESP32_STREAM_URL = "http://10.63.103.202:81/stream"
cap = None

latest_result = {
    "status": "Waiting",
    "detections": 0,
    "confidence": 0.0
}

def get_cap():
    global cap
    if cap is None or not cap.isOpened():
        print("🔄 Connecting to ESP32 stream...")
        cap = cv2.VideoCapture(ESP32_STREAM_URL, cv2.CAP_FFMPEG)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    return cap

def generate_frames():
    global latest_result

    while True:
        cap = get_cap()
        ret, frame = cap.read()

        if not ret:
            time.sleep(0.1)
            continue

        detections = 0
        max_conf = 0.0

        # Run YOLO on frame
        results = yolo_model(frame, conf=YOLO_CONF, verbose=False)

        for r in results:
            if r.boxes is None:
                continue
            for box in r.boxes:
                conf = float(box.conf[0])
                
                # Apply threshold
                if conf >= CONF_THRESHOLD:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    
                    # Optional CNN validation for live stream
                    is_plastic = True
                    if USE_CNN_VALIDATION and cnn_model is not None:
                        roi = frame[y1:y2, x1:x2]
                        is_plastic, _ = validate_with_cnn(roi)
                    
                    if is_plastic:
                        detections += 1
                        max_conf = max(max_conf, conf)
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                        cv2.putText(
                            frame,
                            f"{conf:.2f}",
                            (x1, y1 - 6),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5,
                            (0, 0, 255),
                            2,
                        )

        latest_result["status"] = "Microplastics Detected" if detections else "Clean Water"
        latest_result["detections"] = detections
        latest_result["confidence"] = round(max_conf, 3)

        _, buffer = cv2.imencode(".jpg", frame)
        yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"

@app.route("/live")
def live():
    return Response(generate_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame")

@app.route("/result")
def result():
    return jsonify(latest_result)

# ===================== RUN =====================
if __name__ == "__main__":
    print("\n" + "="*60)
    print("NIVORA AI Detection Platform")
    print("="*60)
    print(f"YOLO Confidence Threshold: {YOLO_CONF}")
    print(f"Final Confidence Threshold: {CONF_THRESHOLD}")
    print(f"CNN Validation: {'ENABLED' if USE_CNN_VALIDATION else 'DISABLED'}")
    if USE_CNN_VALIDATION:
        print(f"CNN Threshold: {CNN_THRESHOLD}")
    print("="*60 + "\n")
    
    app.run(host="0.0.0.0", port=5000, debug=True)