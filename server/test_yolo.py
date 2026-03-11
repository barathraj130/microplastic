import os
os.environ["YOLO_OFFLINE"] = "true"
from ultralytics import YOLO
import time
print("Loading YOLO...")
start = time.time()
path = "/Users/barathraj/Desktop/VS PROJECTS/Microplastic_Detection_System/ml_model/weights/best.pt"
model = YOLO(path)
print(f"YOLO loaded in {time.time() - start:.2f}s")
