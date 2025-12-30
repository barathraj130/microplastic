import cv2
import os
from ultralytics import YOLO

MODEL_PATH = 'yolo_model/weights/best.pt'
UPLOADS_DIR = 'uploads'

def diagnose_latest():
    files = [f for f in os.listdir(UPLOADS_DIR) if f.endswith(('.jpg', '.png'))]
    if not files:
        print("No uploads found.")
        return
    
    files.sort(key=lambda x: os.path.getmtime(os.path.join(UPLOADS_DIR, x)), reverse=True)
    img_path = os.path.join(UPLOADS_DIR, files[0])
    
    print(f"🔬 Diagnosing: {img_path}")
    model = YOLO(MODEL_PATH)
    img = cv2.imread(img_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    results = model(img_path, conf=0.001, verbose=False)
    
    for r in results:
        if r.boxes is not None:
            print(f"📊 Total Candidates: {len(r.boxes)}")
            for i, box in enumerate(r.boxes):
                conf = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                roi = gray[y1:y2, x1:x2]
                luma = roi.mean() if roi.size > 0 else 0
                if i < 20:
                    print(f"   [{i+1}] Score: {conf:.4f} | Luma: {luma:.1f}")
        else:
            print("🌑 No boxes found.")

if __name__ == "__main__":
    diagnose_latest()
