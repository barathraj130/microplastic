import numpy as np

def extract_patches(gray, size=32, stride=16):
    patches = []
    positions = []

    h, w = gray.shape

    for y in range(0, h - size, stride):
        for x in range(0, w - size, stride):
            patch = gray[y:y+size, x:x+size]
            patches.append(patch)
            positions.append((x, y))

    return patches, positions
