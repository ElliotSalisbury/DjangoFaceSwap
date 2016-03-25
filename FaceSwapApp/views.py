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

	image = base64_to_image(imageb64.split(',')[1])
	swapped = faceSwapImages(image)
	replyb64 = image_to_base64(swapped)

	# swapMap = {}
	# for image in images:
	# 	try:
	# 		swapped = SwappedImage.objects.get(pk=image)
	# 		swapMap[image] = swapped.swappedLink
	# 	except ObjectDoesNotExist:
	# 		swapMap[image] = "https://lh4.ggpht.com/wKrDLLmmxjfRG2-E-k5L5BUuHWpCOe4lWRF7oVs1Gzdn5e5yvr8fj-ORTlBF43U47yI=w300"
	# 		donaldImg = "static/FaceSwapApp/Donald/donald1.jpg"
	# 		cv2.im
	# 		faceSwapImages()

	reply = json.dumps({"image":replyb64})
	return HttpResponse(reply, content_type="application/json")