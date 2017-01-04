from __future__ import absolute_import

from celery import shared_task

import cv2
import base64
import numpy as np

from FaceSwapApp.align import faceSwapImages, NoFaces
from FaceSwapApp.faceBeautifierWeb import beautifyIm_Web


def base64_to_image(imageb64):
    raw = base64.b64decode(imageb64.split(',')[1].encode('utf-8'))
    image = np.frombuffer(raw, dtype=np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)
    return image

def image_to_base64(image):
    jpgdata = cv2.imencode('.webp',image)[1]
    b64 = "data:image/webp;base64,"+base64.b64encode(jpgdata).decode('utf-8')
    return b64

@shared_task
def faceSwapTask(imageb64):
    try:
        image = base64_to_image(imageb64)
        swapped = faceSwapImages(image)
        replyb64 = image_to_base64(swapped)

        return replyb64
    except NoFaces as noFacesError:
        return None

@shared_task
def faceBeautificationTask(imageb64):
    try:
        image = base64_to_image(imageb64)
        swapped = beautifyIm_Web(image)
        replyb64 = image_to_base64(swapped)

        return replyb64
    except NoFaces as noFacesError:
        return None