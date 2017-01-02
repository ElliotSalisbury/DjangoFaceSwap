from django.conf import settings

FACESWAP_FOLDER_PATH = getattr(settings, 'FACESWAP_FOLDER_PATH', "/home/ubuntu/faces/")
FACESWAP_SHAPEPREDICTOR_PATH = getattr(settings, 'FACESWAP_SHAPEPREDICTOR_PATH', "/home/ubuntu/faces/shape_predictor_68_face_landmarks.dat")