from django.conf.urls import patterns, url

from FaceSwapApp import views

urlpatterns = patterns('',
                       url(r'^$', views.index, name='home'),
                       url(r'^$', views.index, name='about'),
                       url(r'^uploadImage$', views.upload, name='upload'),

                       url(r'^api/startProcess$', views.startImageProcessing, name='api_StartProcess'),
                       url(r'^api/getResults$', views.getSwap, name='api_GetResults'),
                       )