from django.contrib import admin

from DockerEnvironment.web.FaceSwapApp.models import SwappedImage


# Register your models here.
class SwappedImageAdmin(admin.ModelAdmin):
	list_display = ('originalLink','swappedLink')

admin.site.register(SwappedImage, SwappedImageAdmin)