from django.db import models

# Create your models here.
class ImageProcessingRequest(models.Model):
    date = models.DateTimeField(auto_now_add=True, blank=True)
    type = models.TextField()
    ip = models.GenericIPAddressField()

class UploadedImage(models.Model):
    filename = models.TextField()
    image = models.ImageField()
    request = models.ForeignKey(ImageProcessingRequest)