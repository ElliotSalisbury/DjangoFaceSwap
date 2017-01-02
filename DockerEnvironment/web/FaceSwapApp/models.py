from django.db import models

# Create your models here.
class SwappedImage(models.Model):
	originalLink = models.TextField(primary_key=True)
	swappedLink = models.TextField()