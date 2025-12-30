import cv2
from ultralytics import YOLO
import sys
import os

def debug_image(img_path, model_path):
    print(f"🔍 Testing {img_path} with {model_path}")
    if not os.path.exists(model_path):
        print(f"❌ Model not found: {model_path}")
        return
    
    model = YOLO(model_path)
    results = model(img_path, conf=0.001, verbose=False)
    
    for r in results:
        if r.boxes is not None:
            print(f"📊 Found {len(r.boxes)} total candidates.")
            confs = [float(box.conf[0]) for box in r.boxes]
            confs.sort(reverse=True)
            print(f"📈 Top 20 confidence scores: {[round(c, 4) for c in confs[:20]]}")
            
            # Count those above typical thresholds
            print(f"🎯 Candidates above 0.35: {len([c for c in confs if c >= 0.35])}")
            print(f"🎯 Candidates above 0.20: {len([c for c in confs if c >= 0.20])}")
            print(f"🎯 Candidates above 0.05: {len([c for c in confs if c >= 0.05])}")
        else:
            print("🌑 No boxes found.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python debug_model.py <image_path>")
    else:
        # Get newest image from uploads just in case
        img_path = sys.argv[1]
        model_p = "yolo_model/weights/best.pt"
        debug_image(img_path, model_p)
