import json
from django.core.exceptions import ObjectDoesNotExist
from FaceSwapApp.models import SwappedImage
from django.http import HttpResponse, HttpResponseServerError
from align import faceSwapImages
import base64
import numpy as np
import cv2

def base64_to_image(imageb64):
	raw = base64.decodestring(imageb64.replace("data:image/png;",""))
	image = np.frombuffer(raw, dtype=np.uint8)
	image = cv2.imdecode(image, cv2.CV_LOAD_IMAGE_COLOR)
	return image

def image_to_base64(image):
	jpgdata = cv2.imencode('.jpg',image)[1]
	b64 = "data:image/jpg;base64,"+base64.encodestring(jpgdata)
	return b64

def swap(request):
	imageb64 = request.POST.get("imageb64", None)
	if imageb64 is None:
		return HttpResponseServerError()

	try:
		image = base64_to_image(imageb64.split(',')[1])
		swapped = faceSwapImages(image)
		replyb64 = image_to_base64(swapped)

		reply = json.dumps({"success":True, "image":replyb64})
	except Exception as e:
		reply = json.dumps({"success":False, "msg":e.message})

	return HttpResponse(reply, content_type="application/json")