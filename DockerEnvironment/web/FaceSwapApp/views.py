from django.http import HttpResponse, HttpResponseServerError
from django.shortcuts import render_to_response
from FaceSwapApp.tasks import faceSwapTask, faceBeautificationTask
import json

FACE_SWAP = "0"
FACE_BEAUTIFICATION = "1"

TASKS = {FACE_SWAP: faceSwapTask,
         FACE_BEAUTIFICATION: faceBeautificationTask}

def index(request):
    return render_to_response('objctify/index.html')
def about(request):
    return render_to_response('objctify/about.html')

def upload(request):
    if request.method == 'POST':
        type = request.POST.get("type", FACE_SWAP)
        images = request.FILES.getlist('images')

        task = TASKS[type].apply_async((images,), expires=60 * 3)
        # result = TASKS[type](images)

        reply = {"type": type, "taskId":task.taskId,}# "result":result}

        return HttpResponse(json.dumps(reply), content_type="application/json")
    else:
        return HttpResponseServerError("Must Use POST")

def startImageProcessing(request):
    imageb64 = request.POST.get("imageb64", None)
    type = request.POST.get("taskType", FACE_SWAP)

    #we didnt get the uploaded image, return an error
    if imageb64 is None:
        return HttpResponseServerError("Image Upload Error")

    #send an image to be processed, but ignore the task if its taking longer than 3 minutes
    result = TASKS[type].apply_async((imageb64,), expires=60*3)

    return HttpResponse(result.id, content_type="text/plain")

def getSwap(request):
    taskId = request.GET.get("taskId", None)
    type = request.POST.get("type", FACE_SWAP)

    reply = {}

    if taskId:
        #get the results from celery
        result = TASKS[type].AsyncResult(taskId)
        reply["status"] = result.status

        #if the task has finished
        if reply["status"] == "SUCCESS":
            #get the image
            reply["image"] = result.get()
            #if no image has been returned (probably no faces)
            if reply["image"] is None:
                #return the task as failed, so that JS stops polling
                reply["status"] = "FAILURE"
        return HttpResponse(json.dumps(reply), content_type="application/json")

    return HttpResponseServerError("No TaskId")