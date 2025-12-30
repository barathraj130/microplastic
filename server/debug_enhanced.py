import cv2
import numpy as np
from ultralytics import YOLO
import sys
import os

def debug_enhanced(img_path, model_path):
    print(f"🧪 Testing ENHANCED {img_path} with {model_path}")
    if not os.path.exists(model_path):
        print(f"❌ Model not found: {model_path}")
        return
    
    img = cv2.imread(img_path)
    if img is None:
        print("❌ Image load failed")
        return

    # --- ENHANCEMENT ---
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_channel, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l_channel)
    limg = cv2.merge((cl, a, b))
    enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    gaussian_blur = cv2.GaussianBlur(enhanced, (0, 0), 3)
    enhanced = cv2.addWeighted(enhanced, 1.5, gaussian_blur, -0.5, 0)
    
    cv2.imwrite("debug_enhanced.jpg", enhanced)
    
    model = YOLO(model_path)
    results = model("debug_enhanced.jpg", conf=0.001, verbose=False)
    
    names = model.names
    for r in results:
        if r.boxes is not None:
            print(f"📊 Found {len(r.boxes)} total candidates.")
            for i, box in enumerate(r.boxes):
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                if i < 15:
                    print(f"   [Top {i+1}] Score: {conf:.4f} | Class: {cls} ({names[cls]})")
        else:
            print("🌑 No boxes found.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python debug_enhanced.py <image_path>")
    else:
        debug_enhanced(sys.argv[1], "yolo_model/weights/best.pt")
