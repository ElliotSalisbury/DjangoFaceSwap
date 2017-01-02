from django.conf.urls import patterns, url

from DockerEnvironment.web.FaceSwapApp import views

urlpatterns = patterns('',
                       url(r'^startSwap$', views.startImageProcessing, name='startSwap'),
                       url(r'^getSwap$', views.getSwap, name='getSwap'),
                       )