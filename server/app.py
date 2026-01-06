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
import requests

from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS
from ultralytics import YOLO

# ===================== SUPABASE CONFIG =====================
SUPABASE_URL = "https://smfemgegowwcdrwqhrlb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZmVtZ2Vnb3d3Y2Ryd3FocmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MjU0NjcsImV4cCI6MjA4MzIwMTQ2N30.byE7TrR6-qGffaQp5jmJVFTo6LAE8DzBob-TT2bKm0s"
BUCKET_NAME = "camera-frames"

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

# ===================== DOWNLOAD MODEL FROM SUPABASE =====================
def download_model_from_supabase():
    """Download YOLO model from Supabase if not present"""
    if not os.path.isfile(YOLO_MODEL_PATH):
        print("📥 Downloading YOLO model from Supabase...")
        os.makedirs(os.path.dirname(YOLO_MODEL_PATH), exist_ok=True)
        
        url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/best.pt"
        
        try:
            response = requests.get(url, stream=True, timeout=60)
            
            if response.status_code == 200:
                total_size = int(response.headers.get('content-length', 0))
                print(f"📦 Model size: {total_size / (1024*1024):.1f} MB")
                
                with open(YOLO_MODEL_PATH, 'wb') as f:
                    downloaded = 0
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            percent = (downloaded / total_size) * 100
                            print(f"\r⬇️  {percent:.1f}%", end='')
                
                print("\n✅ Model downloaded successfully!")
            else:
                raise Exception(f"Failed to download model: HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ Error downloading model: {e}")
            raise

# Download model before loading
download_model_from_supabase()

print("YOLO PATH:", YOLO_MODEL_PATH)
print("YOLO EXISTS:", os.path.isfile(YOLO_MODEL_PATH))

# ===================== DEVICE =====================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"🚀 Detection Engine starting (Device: {device})")

# ===================== LOAD YOLO =====================
if not os.path.isfile(YOLO_MODEL_PATH):
    raise FileNotFoundError(f"❌ YOLO model missing: {YOLO_MODEL_PATH}")

yolo_model = YOLO(YOLO_MODEL_PATH)
print("✅ YOLO loaded")

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
    print("✅ CNN loaded")
else:
    print("⚠️ CNN not found → YOLO only")

# ===================== FLASK APP =====================
app = Flask(__name__)
CORS(app)

# ===================== PARAMS =====================
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

latest_camera_frame = None
latest_frame_time = 0

# ===================== SUPABASE FUNCTIONS =====================
def fetch_frame_from_supabase():
    """Fetch latest frame from Supabase Storage"""
    try:
        url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/latest.jpg?t={int(time.time())}"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            nparr = np.frombuffer(response.content, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return frame
        return None
    except:
        return None

def process_frame_with_yolo(frame):
    """Process frame with YOLO"""
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
                detections += 1
                max_conf = max(max_conf, conf)
                
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(frame, f"{conf:.2f}", (x1, y1-6),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
    
    return frame, detections, max_conf

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
            return jsonify(json.load(f))
    return jsonify([])

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

        processed, detections, max_conf = process_frame_with_yolo(img)

        out_name = f"result_{uid}.jpg"
        cv2.imwrite(os.path.join(STATIC_DIR, out_name), processed)

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
        print("❌ ERROR:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/live")
def live():
    """Stream from Supabase"""
    global latest_camera_frame, latest_frame_time, latest_result
    
    def generate():
        while True:
            frame = fetch_frame_from_supabase()
            
            if frame is not None:
                processed, detections, max_conf = process_frame_with_yolo(frame)
                
                latest_result["status"] = "Microplastics Detected" if detections else "Clean Water"
                latest_result["detections"] = detections
                latest_result["confidence"] = round(max_conf, 3)
                
                _, buffer = cv2.imencode('.jpg', processed)
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            else:
                blank = 255 * np.ones((480, 640, 3), dtype=np.uint8)
                cv2.putText(blank, "Waiting for ESP32-CAM...", (120, 220),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
                _, buffer = cv2.imencode('.jpg', blank)
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            
            time.sleep(1)
    
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route("/result")
def result():
    return jsonify(latest_result)

if __name__ == "__main__":
    print("\n" + "="*60)
    print("NIVORA AI Detection Platform")
    print("="*60)
    print(f"Supabase: {SUPABASE_URL}")
    print(f"Live Stream: /live")
    print("="*60 + "\n")
    
    app.run(host="0.0.0.0", port=5000, debug=True)
