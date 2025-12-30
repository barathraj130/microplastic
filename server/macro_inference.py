from ultralytics import YOLO
import cv2

model = YOLO("../yolo_model/macroplastic.pt")

def macro_frame(frame):
    res = model(frame)[0]
    detected = False
    conf = 0.0

    for box in res.boxes:
        detected = True
        conf = max(conf, float(box.conf[0]))
        x1,y1,x2,y2 = map(int, box.xyxy[0])
        cv2.rectangle(frame,(x1,y1),(x2,y2),(0,0,255),2)

    return detected, round(conf,3), frame
