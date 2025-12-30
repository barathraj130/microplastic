import os
import cv2
from flask import Flask, render_template, request, send_from_directory
from inference import (
    detect_microplastic_image,
    detect_microplastic_video,
    detect_microplastic_frame
)

app = Flask(__name__)

BASE_DIR = os.path.dirname(__file__)
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
STATIC_DIR = os.path.join(BASE_DIR, "static")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

# -------------------------
# HOME PAGE
# -------------------------
@app.route("/")
def index():
    return render_template("index.html")

# -------------------------
# IMAGE / VIDEO UPLOAD
# -------------------------
@app.route("/upload", methods=["POST"])
def upload():
    file = request.files.get("file")
    if not file:
        return "No file", 400

    filepath = os.path.join(UPLOAD_DIR, file.filename)
    file.save(filepath)

    ext = file.filename.lower().split(".")[-1]

    if ext in ["jpg", "jpeg", "png"]:
        label, conf = detect_microplastic_image(filepath)

        output_path = os.path.join(STATIC_DIR, "output.jpg")
        img = cv2.imread(filepath)
        cv2.putText(
            img,
            f"{label} ({conf:.2f})",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),
            2,
        )
        cv2.imwrite(output_path, img)

    elif ext in ["mp4", "mov", "avi"]:
        label, conf = detect_microplastic_video(filepath)
        output_path = None

    else:
        return "Unsupported file", 400

    return {
        "label": label,
        "confidence": round(conf, 3),
        "image": "/static/output.jpg" if ext in ["jpg", "jpeg", "png"] else None
    }

# -------------------------
# LIVE STREAM (WEBCAM)
# -------------------------
@app.route("/live")
def live():
    cap = cv2.VideoCapture(0)

    ret, frame = cap.read()
    cap.release()

    if not ret:
        return "Camera error", 500

    label, conf = detect_microplastic_frame(frame)

    cv2.putText(
        frame,
        f"{label} ({conf:.2f})",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 0, 255),
        2,
    )

    output_path = os.path.join(STATIC_DIR, "live.jpg")
    cv2.imwrite(output_path, frame)

    return {
        "label": label,
        "confidence": round(conf, 3),
        "image": "/static/live.jpg"
    }

# -------------------------
if __name__ == "__main__":
    app.run(debug=True)
