import json
from django.core.exceptions import ObjectDoesNotExist
from FaceSwapApp.models import SwappedImage
from django.http import HttpResponse

def swap(request):
	imagesjson = request.REQUEST.get("imagesjson", "[]")
	images = json.loads(imagesjson)

	swapMap = {}
	for image in images:
		try:
			swapped = SwappedImage.objects.get(pk=image)
			swapMap[image] = swapped.swappedLink
		except ObjectDoesNotExist:
			swapMap[image] = "https://lh4.ggpht.com/wKrDLLmmxjfRG2-E-k5L5BUuHWpCOe4lWRF7oVs1Gzdn5e5yvr8fj-ORTlBF43U47yI=w300"

	reply = json.dumps(swapMap)
	return HttpResponse(reply, content_type="application/json")