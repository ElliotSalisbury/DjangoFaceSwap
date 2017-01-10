from django.http import HttpResponse, HttpResponseServerError
from django.shortcuts import render_to_response
from django.db import transaction
from FaceSwapApp.tasks import faceSwapTask, faceBeautificationTask
from FaceSwapApp.models import ImageProcessingRequest, UploadedImage
from ipware.ip import get_ip
import json

FACE_SWAP = "0"
FACE_BEAUTIFICATION = "1"

TASKS = {FACE_SWAP: faceSwapTask,
         FACE_BEAUTIFICATION: faceBeautificationTask}

# @transaction.atomic()
def save_upload_request(request, type, images, task):
    ipr = ImageProcessingRequest(ip=get_ip(request), type=type)
    ipr.save()
    uis = []
    for image in images:
        ui = UploadedImage(image=image, filename=image.name, request=ipr)
        uis.append(ui)
    UploadedImage.objects.bulk_create(uis)

    return ipr, uis

def index(request):
    return render_to_response('objctify/index.html')
def about(request):
    return render_to_response('objctify/about.html')

def upload(request):
    if request.method == 'POST':
        type = request.POST.get("type", FACE_SWAP)
        gender = request.POST.get("gender", "F")
        images = request.FILES.getlist('images')

        IPR, UIs = save_upload_request(request, type, images, TASKS[type])
        UIids = [ui.id for ui in UIs]

        result = TASKS[type].apply_async((UIids, gender), expires=60 * 3)
        request.session["taskId"] = result.task_id

        reply = {"type": type, "taskId":result.task_id,}# "result":result}

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
    type = request.GET.get("type", FACE_SWAP)

    reply = {"taskId":taskId, "type":type}

    if taskId == -1 and 'taskId' in request.session:
        taskId = request.session["taskId"]

    if taskId and taskId != -1:
        #get the results from celery
        result = TASKS[type].AsyncResult(taskId)
        reply["status"] = result.status

        if result.status == "FAILURE":
            reply["error"] = str(result.result)
        elif result.status == "SUCCESS":
            #get the results
            reply["result"] = result.get()
            #if no image has been returned (probably no faces)
            if reply["result"] is None:
                #return the task as failed, so that JS stops polling
                reply["status"] = "FAILURE"
                reply["error"] = "No image was returned from the processing task."
        return HttpResponse(json.dumps(reply), content_type="application/json")

    return HttpResponseServerError("No TaskId")