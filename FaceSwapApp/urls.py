from django.conf.urls import patterns, url
from FaceSwapApp import views

urlpatterns = patterns('',
					   url(r'^swap$', views.swap, name='swap'),
)