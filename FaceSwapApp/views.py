from django.http import HttpResponse, HttpResponseServerError, JsonResponse
from tasks import faceSwapTask

def startSwap(request):
	imageb64 = request.POST.get("imageb64", None)
	if imageb64 is None:
		return HttpResponseServerError()

	result = faceSwapTask.delay(imageb64)

	return HttpResponse(result.id, content_type="text/plain")

def getSwap(request):
	taskId = request.GET.get("taskId", None)

	reply = {}

	if taskId:
		#get the results from celery
		result = faceSwapTask.AsyncResult(taskId)
		reply["status"] = result.status

		#if the task has finished
		if reply["status"] == "SUCCESS":
			#get the image
			reply["image"] = result.get()
			#if no image has been returned (probably no faces)
			if reply["image"] is None:
				#return the task as failed, so that JS stops polling
				reply["status"] = "FAILURE"
		return JsonResponse(reply)

	return HttpResponseServerError("No TaskId")