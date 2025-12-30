# ===================== FORCE OFFLINE MODE =====================
import os
os.environ["YOLO_OFFLINE"] = "true"
os.environ["ULTRALYTICS_SETTINGS"] = "false"
os.environ["ULTRALYTICS_HUB"] = "false"

# ===================== IMPORTS =====================
import cv2
import time
from flask import Flask, Response, jsonify
from ultralytics import YOLO
import torch

# ===================== PATH SETUP =====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

YOLO_MODEL_PATH = os.path.join(
    BASE_DIR, "yolo_model", "weights", "best.pt"
)

# ===================== ESP32 STREAM =====================
# Use ONE of these (IP is safest)
ESP32_STREAM_URL = "http://172.31.111.202:81/stream"
# ESP32_STREAM_URL = "http://172.31.111.202:81/stream"

# ===================== PARAMS =====================
CONF_THRESHOLD = 0.02
BRIGHTNESS_LIMIT = 150

# ===================== INIT =====================
app = Flask(__name__)

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🚀 Live AI starting (Device: {device})")

if not os.path.isfile(YOLO_MODEL_PATH):
    raise FileNotFoundError(f"❌ YOLO model not found: {YOLO_MODEL_PATH}")

model = YOLO(YOLO_MODEL_PATH)

cap = cv2.VideoCapture(ESP32_STREAM_URL)
if not cap.isOpened():
    raise RuntimeError("❌ Cannot open ESP32-CAM stream")

latest_result = {
    "status": "Waiting",
    "detections": 0,
    "confidence": 0.0
}

# ===================== LIVE STREAM + DETECTION =====================
def generate_frames():
    global latest_result

    while True:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.1)
            continue

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        detections = 0
        max_conf = 0.0

        results = model(frame, conf=0.001, verbose=False)

        for r in results:
            if r.boxes is None:
                continue

            for box in r.boxes:
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                roi = gray[y1:y2, x1:x2]
                if roi.size == 0 or roi.mean() > BRIGHTNESS_LIMIT:
                    continue

                if conf >= CONF_THRESHOLD:
                    detections += 1
                    max_conf = max(max_conf, conf)

                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    cv2.putText(
                        frame,
                        f"PLASTIC {conf:.2f}",
                        (x1, y1 - 6),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0, 0, 255),
                        2,
                    )

        latest_result = {
            "status": "Microplastics Detected" if detections else "Clean Water",
            "detections": detections,
            "confidence": round(max_conf, 3),
        }

        _, buffer = cv2.imencode(".jpg", frame)
        frame_bytes = buffer.tobytes()

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + frame_bytes
            + b"\r\n"
        )

# ===================== ROUTES =====================
@app.route("/")
def health():
    return jsonify({"status": "Live Microplastic Detection Running"})

@app.route("/live")
def live():
    return Response(
        generate_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )

@app.route("/result")
def result():
    return jsonify(latest_result)

# ===================== RUN =====================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
