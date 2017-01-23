from django.conf.urls import url

from FaceSwapApp import views

urlpatterns = [url(r'^$', views.index, name='home'),
               url(r'^about$', views.about, name='about'),
               url(r'^author$', views.author, name='author'),
               url(r'^uploadImage$', views.upload, name='upload'),

               url(r'^3D/AverageFaces$', views.averageFaces, name='averageFaces'),
               url(r'^3D/morphFaces$', views.morphFaces, name='morphFaces'),

               url(r'^api/startProcess$', views.startImageProcessing, name='api_StartProcess'),
               url(r'^api/getResults$', views.getSwap, name='api_GetResults'),
               ]