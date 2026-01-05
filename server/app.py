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
import numpy as np
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
CONF_THRESHOLD = 0.10
YOLO_CONF = 0.05
CNN_THRESHOLD = 0.6
USE_CNN_VALIDATION = False
# ===================== GLOBAL VARIABLES =====================
latest_result = {
    "status": "Waiting",
    "detections": 0,
    "confidence": 0.0
}

# HTTP Camera method globals
latest_camera_frame = None
latest_frame_time = 0

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
    if cnn_model is None or roi_bgr.size == 0:
        return True, 1.0
    
    try:
        roi_rgb = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(roi_rgb)
        tensor = cnn_tf(pil_img).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = cnn_model(tensor)
            probs = torch.softmax(outputs, dim=1)[0]
            confidence = float(probs[1])
            is_plastic = confidence >= CNN_THRESHOLD
        
        return is_plastic, confidence
    except Exception as e:
        print(f"⚠️ CNN validation error: {e}")
        return True, 1.0

# ===================== ROUTES =====================
@app.route("/")
def health():
    return jsonify({"status": "NIVORA AI Detection API Online"})

@app.route("/api/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(STATIC_DIR, filename)

@app.route("/api/history", methods=["GET"])
def get_history():
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

        results = yolo_model(img, conf=YOLO_CONF, verbose=False)

        print(f"🔍 YOLO candidates:", len(results[0].boxes) if results[0].boxes else 0)

        for r in results:
            if r.boxes is None:
                continue

            for box in r.boxes:
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                roi = img[y1:y2, x1:x2]
                if roi.size == 0:
                    continue

                is_plastic = True
                cnn_conf = 1.0
                
                if USE_CNN_VALIDATION and cnn_model is not None:
                    is_plastic, cnn_conf = validate_with_cnn(roi)
                    print(f"📦 YOLO: {conf:.3f} | CNN: {cnn_conf:.3f} | Plastic: {is_plastic}")
                else:
                    print(f"📦 YOLO: {conf:.3f}")

                if conf >= CONF_THRESHOLD and is_plastic:
                    detections += 1
                    max_conf = max(max_conf, conf)
                    
                    cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    
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

        out_name = f"result_{uid}.jpg"
        cv2.imwrite(os.path.join(STATIC_DIR, out_name), img)

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

# ===================== HTTP CAMERA METHOD (NEW!) =====================
@app.route("/api/camera/frame", methods=["POST"])
def receive_camera_frame():
    """Receive camera frames from ESP32-CAM via HTTP POST"""
    global latest_camera_frame, latest_frame_time, latest_result
    
    try:
        image_data = request.data
        
        if not image_data:
            return jsonify({"error": "No image data"}), 400
        
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({"error": "Invalid image"}), 400
        
        detections = 0
        max_conf = 0.0
        
        results = yolo_model(frame, conf=YOLO_CONF, verbose=False)
        
        for r in results:
            if r.boxes is None:
                continue
            for box in r.boxes:
                conf = float(box.conf[0])
                if conf >= CONF_THRESHOLD:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    
                    is_plastic = True
                    if USE_CNN_VALIDATION and cnn_model is not None:
                        roi = frame[y1:y2, x1:x2]
                        is_plastic, _ = validate_with_cnn(roi)
                    
                    if is_plastic:
                        detections += 1
                        max_conf = max(max_conf, conf)
                        
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                        cv2.putText(frame, f"{conf:.2f}", (x1, y1-6),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        
        latest_result["status"] = "Microplastics Detected" if detections else "Clean Water"
        latest_result["detections"] = detections
        latest_result["confidence"] = round(max_conf, 3)
        
        latest_camera_frame = frame
        latest_frame_time = time.time()
        
        return jsonify({
            "status": "success",
            "detections": detections,
            "confidence": round(max_conf, 3)
        })
        
    except Exception as e:
        print(f"❌ Error receiving frame: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/live")
def live():
    """Stream using HTTP POST method from ESP32-CAM"""
    def generate_http():
        while True:
            if latest_camera_frame is not None and time.time() - latest_frame_time < 2.0:
                _, buffer = cv2.imencode('.jpg', latest_camera_frame)
                frame_bytes = buffer.tobytes()
                
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            else:
                blank = 255 * np.ones((480, 640, 3), dtype=np.uint8)
                if latest_camera_frame is None:
                    cv2.putText(blank, "Waiting for ESP32-CAM...", (120, 220),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
                    cv2.putText(blank, "Check Serial Monitor", (140, 270),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                else:
                    cv2.putText(blank, "Connection Lost", (180, 240),
                              cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                
                _, buffer = cv2.imencode('.jpg', blank)
                frame_bytes = buffer.tobytes()
                
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            time.sleep(0.1)
    
    return Response(generate_http(), mimetype='multipart/x-mixed-replace; boundary=frame')


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
    print(f"HTTP Camera Endpoint: /api/camera/frame")
    print(f"Live Stream: /live")
    print("="*60 + "\n")
    
    app.run(host="0.0.0.0", port=5000, debug=True)