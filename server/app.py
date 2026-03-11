
# ===================== FORCE OFFLINE MODE =====================
import os
import threading
os.environ["YOLO_OFFLINE"] = "true"
os.environ["ULTRALYTICS_SETTINGS"] = "false"
os.environ["ULTRALYTICS_HUB"] = "false"

# ===================== IMPORTS =====================
import uuid
import time
import json
from typing import List, Dict, Any, Optional, Tuple

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

# ===================== DEVICE =====================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"🚀 Detection Engine starting on {device}")

# ===================== LOAD YOLO =====================
if not os.path.isfile(YOLO_MODEL_PATH):
    raise FileNotFoundError("❌ YOLO model missing")

yolo_model = YOLO(YOLO_MODEL_PATH)
print("✅ YOLO loaded")

# ===================== LOAD CNN =====================
cnn_model = None
cnn_tf = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
])

if os.path.isfile(CNN_MODEL_PATH):
    cnn_model = models.resnet18(weights=None)
    cnn_model.fc = nn.Linear(cnn_model.fc.in_features, 2)
    cnn_model.load_state_dict(torch.load(CNN_MODEL_PATH, map_location=device, weights_only=True))
    cnn_model.to(device).eval()
    print("✅ CNN auditor loaded")
else:
    print("⚠️ CNN not found")

# ===================== FLASK =====================
app = Flask(__name__)
CORS(app)

# ===================== PARAMETERS =====================
YOLO_CONF = 0.25
CONF_THRESHOLD = 0.35
CNN_THRESHOLD = 0.75
LOCAL_CAM_ENABLED = True

# ===================== GLOBAL STATE =====================
# camera_id -> { "frame": np_array, "result": dict, "time": float }
camera_states = {}

def get_empty_state():
    return {
        "frame": None,
        "time": 0,
        "result": {
            "status": "Waiting",
            "detections": 0,
            "confidence": 0.0,
            "timestamp": int(time.time())
        }
    }

# ===================== DETECTION LOGIC =====================
def process_detection(frame):
    detections = 0
    max_conf = 0.0
    
    results = yolo_model(frame, conf=YOLO_CONF, verbose=False)
    for r in results:
        if not hasattr(r, 'boxes') or r.boxes is None:
            continue
        for box in r.boxes:
            conf = float(box.conf[0])
            if conf < CONF_THRESHOLD:
                continue
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            roi = frame[y1:y2, x1:x2]
            
            is_plastic, _ = validate_with_cnn(roi)
            if not is_plastic:
                continue
                
            detections += 1
            max_conf = max(max_conf, conf)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv2.putText(frame, f"P:{conf:.2f}", (x1, y1 - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
    return detections, max_conf, frame

# ===================== LOCAL CAMERA WORKER =====================
# Global camera variable for hardware control
camera_device = None

def get_camera_source():
    """Robust camera scanning: Tries to find the best available sensor (1, 2, 0)"""
    global camera_device
    if camera_device is None or not camera_device.isOpened():
        # SCANS 1, 2, 3 ONLY (External/Continuity/iPhone)
        # ❌ REMOVED 0 (Built-in Laptop Camera) to prevent accidental selfie view
        for idx in [1, 2, 3]:
            print(f"🔍 Attempting to link Hardware Node {idx}...")
            cap = cv2.VideoCapture(idx)
            if cap.isOpened():
                # Allow time to warm up
                time.sleep(1)
                ret, frame = cap.read()
                if ret:
                    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
                    camera_device = cap
                    print(f"✅ Hardware sensor linked at node {idx}")
                    return camera_device
            cap.release()
    return camera_device

def local_camera_worker():
    """Background AI Processor for the Hardware Sensor (Crack Detection Style)"""
    global LOCAL_CAM_ENABLED, camera_device, camera_states
    print(f"\n🚀 Starting Hardware AI Node Engine...")
    
    while True:
        if not LOCAL_CAM_ENABLED:
            if camera_device:
                camera_device.release()
                camera_device = None
            time.sleep(1)
            continue

        try:
            cap = get_camera_source()
            if cap:
                ret, frame = cap.read()
                if ret:
                    dets, conf, processed = process_detection(frame)
                    
                    res = {
                        "status": "Particle Anomaly Detected" if dets else "Clean Water",
                        "detections": int(dets),
                        "confidence": float(round(float(conf), 3)),
                        "timestamp": int(time.time()),
                        "source": "hardware_node"
                    }
                    
                    camera_states["hardware"] = {
                        "frame": processed,
                        "time": time.time(),
                        "result": res
                    }
                else:
                    time.sleep(0.5)
            else:
                time.sleep(1)
        except Exception as e:
            print(f"❌ Hardware Node Error: {e}")
            time.sleep(2)
            # CPU Relief (15-20 FPS)
            time.sleep(0.05)

# ===================== HISTORY =====================
def save_to_history(entry):
    history = []
    if os.path.isfile(HISTORY_FILE):
        with open(HISTORY_FILE) as f:
            try:
                history = json.load(f)
            except:
                history = []

    history.insert(0, entry)
    if len(history) > 50:
        history = history[:50]

    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)

# ===================== CNN VALIDATION =====================
def validate_with_cnn(roi_bgr):
    if cnn_model is None or roi_bgr.size == 0:
        return False, 0.0

    try:
        roi_rgb = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(roi_rgb)
        tensor = cnn_tf(pil_img).unsqueeze(0).to(device)

        if cnn_model is not None:
            with torch.no_grad():
                outputs = cnn_model(tensor)
                probs = torch.softmax(outputs, dim=1)[0]
                confidence = float(probs[1])

            return confidence >= CNN_THRESHOLD, confidence
        return False, 0.0

    except Exception as e:
        print("⚠️ CNN error:", e)
        return False, 0.0

# ===================== ROUTES =====================
@app.route("/")
def health():
    return jsonify({"status": "NIVORA AI Multi-Node API Online"})

@app.route("/api/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(STATIC_DIR, filename)

@app.route("/api/history")
def history():
    if os.path.isfile(HISTORY_FILE):
        with open(HISTORY_FILE) as f:
            return jsonify(json.load(f))
    return jsonify([])

@app.route("/api/result")
@app.route("/api/result/<cam_id>")
def result(cam_id="esp32"):
    state = camera_states.get(cam_id, get_empty_state())
    if "result" in state:
        return jsonify(state["result"])
    return jsonify(state)

# ===================== IMAGE UPLOAD =====================
@app.route("/api/upload", methods=["POST"])
def upload():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    uid = uuid.uuid4().hex
    input_path = os.path.join(UPLOAD_DIR, f"{uid}.jpg")
    file.save(input_path)

    img = cv2.imread(input_path)
    if img is None:
        return jsonify({"error": "Invalid image"}), 400

    dets, conf, processed = process_detection(img)

    out_name = f"result_{uid}.jpg"
    cv2.imwrite(os.path.join(STATIC_DIR, out_name), processed)

    res = {
        "status": "Particle Anomaly Detected" if dets else "Clean Water",
        "detections": int(dets),
        "confidence": float(round(float(conf), 3)),
        "image_url": f"/api/static/{out_name}",
        "timestamp": int(time.time()),
        "source": "manual_upload"
    }

    save_to_history(res)
    return jsonify(res)

import base64

@app.route("/api/analyze", methods=["POST"])
def analyze_base64():
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({"error": "No image data"}), 400
            
        b64_string = data['image']
        # Remove prefix if present: "data:image/jpeg;base64,..."
        if ',' in b64_string:
            b64_string = b64_string.split(',')[-1]
            
        img_data = base64.b64decode(b64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({"error": "Invalid image decoding"}), 400
            
        dets, conf, processed = process_detection(frame)
        
        res = {
            "status": "Particle Anomaly Detected" if dets else "Clean Water",
            "detections": int(dets),
            "confidence": float(round(float(conf), 3)),
            "timestamp": int(time.time()),
            "source": "iphone_webrtc"
        }
        
        # Also update the live state so the dashboard shows the latest process
        camera_states["iphone"] = {
            "frame": processed,
            "time": time.time(),
            "result": res
        }
        
        # Explicit remote link state to prevent hardware fallback
        camera_states["remote_linked"] = True
        
        return jsonify(res)
    except Exception as e:
        print(f"❌ Analyze Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/camera/local/start", methods=["POST"])
def start_local_camera():
    global LOCAL_CAM_ENABLED
    if not LOCAL_CAM_ENABLED:
        LOCAL_CAM_ENABLED = True
        threading.Thread(target=local_camera_worker, daemon=True).start()
        return jsonify({"status": "Local camera capture engine started."})
    return jsonify({"status": "Local camera already active."})

@app.route("/api/camera/local/stop", methods=["POST"])
def stop_local_camera():
    global LOCAL_CAM_ENABLED, camera_states
    LOCAL_CAM_ENABLED = False
    # Clear the frame to stop the stream
    if "hardware" in camera_states:
        camera_states["hardware"]["frame"] = None
    return jsonify({"status": "Local camera capture disabled. Hardware released."})

@app.route("/api/camera/local/status")
def local_camera_status():
    return jsonify({
        "active": LOCAL_CAM_ENABLED,
        "source": "iphone_node"
    })

# ===================== LEGACY VIDEO FEED =====================
@app.route("/api/video_feed")
def video_feed():
    """Direct MJPEG feed for the primary hardware sensor (Laptop/iPhone Webcam)"""
    def generate():
        while True:
            state = camera_states.get("hardware") 
            if state and state.get("frame") is not None:
                _, buf = cv2.imencode(".jpg", state["frame"])
                yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" +
                       buf.tobytes() + b"\r\n")
            else:
                placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(placeholder, "No External Hardware", (150, 240),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (100, 100, 100), 2)
                _, buf = cv2.imencode(".jpg", placeholder)
                yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" +
                       buf.tobytes() + b"\r\n")
            time.sleep(0.5)
    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")

# ===================== CAMERA FEED IN (POST) =====================
@app.route("/api/camera/frame", methods=["POST"])
@app.route("/api/camera/<cam_id>/frame", methods=["POST"])
def camera_frame(cam_id="esp32"):
    frame = cv2.imdecode(np.frombuffer(request.data, np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        return jsonify({"error": "Invalid frame"}), 400

    dets, conf, processed = process_detection(frame)

    res = {
        "status": "Particle Anomaly Detected" if dets else "Clean Water",
        "detections": int(dets),
        "confidence": float(round(float(conf), 3)),
        "timestamp": int(time.time()),
        "source": cam_id
    }

    camera_states[cam_id] = {
        "frame": processed,
        "time": time.time(),
        "result": res
    }

    return jsonify(res)

# ===================== LIVE STREAM OUT (GET) =====================
@app.route("/api/live")
@app.route("/api/live/<cam_id>")
def live(cam_id="esp32"):
    def generate():
        while True:
            state = camera_states.get(cam_id)
            if state and state.get("frame") is not None:
                _, buf = cv2.imencode(".jpg", state["frame"])
                frame_bytes = buf.tobytes()
                yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" +
                       frame_bytes + b"\r\n")
            else:
                # Yield a "Waiting for Node" placeholder
                placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(placeholder, f"Waiting for {cam_id}...", (150, 240),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                _, buf = cv2.imencode(".jpg", placeholder)
                yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" +
                       buf.tobytes() + b"\r\n")
            time.sleep(0.5) # Reduced frequency for placeholders

    return Response(generate(),
        mimetype="multipart/x-mixed-replace; boundary=frame")

# ===================== RUN =====================
if __name__ == "__main__":
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
         threading.Thread(target=local_camera_worker, daemon=True).start()

    print("\nNIVORA AI Platform Running")
    app.run(host="0.0.0.0", port=5000, debug=True)
