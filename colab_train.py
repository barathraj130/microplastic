# 1. Install dependencies (Uncomment this line when running in Google Colab)
# !pip install ultralytics

import os
from ultralytics import YOLO

# 2. Define Dataset Path (Update this after uploading your dataset)
# Your dataset should have this structure:
# dataset/
#   images/
#     train/
#     val/
#   labels/
#     train/
#     val/
#   data.yaml

# Create a data.yaml file
yaml_content = """
train: /content/dataset/images/train
val: /content/dataset/images/val

nc: 1
names: ['microplastic']
"""

with open("data.yaml", "w") as f:
    f.write(yaml_content)

# 3. Initialize YOLOv11 or YOLOv8 (using v11 for latest performance)
model = YOLO("yolo11n.pt") 

# 4. Train the model
# Using 2 lakh+ images, you might want to start with a subset or run for fewer epochs initially.
# 2 lakh images is huge, so set 'workers' and 'batch' according to GPU memory.
results = model.train(
    data="data.yaml",
    epochs=50,
    imgsz=640,
    batch=32,
    device=0, # Use GPU
    name="microplastic_model"
)

# 5. Export the trained model
model.export(format="onnx")

print("Training finished. Check the 'runs' folder for best.pt weights.")
