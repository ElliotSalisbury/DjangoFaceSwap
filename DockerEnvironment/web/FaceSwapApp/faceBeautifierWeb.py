import numpy as np
import sys

from US10k.US10k import loadUS10k
from RateMe.RateMe import loadRateMe
from Beautifier.beautifier import beautifyIm, rateFace
from Beautifier.face3D.beautifier3D import beautifyIm3D, rateFace3D

US10k_2D_F = loadUS10k(type="2d", gender="F")
US10k_2D_M = loadUS10k(type="2d", gender="M")

# US10k_3D_F = loadUS10k(type="3d", gender="F")
# US10k_3D_M = loadUS10k(type="3d", gender="M")

RateMe_2D_F = loadRateMe(type="2d", gender="F")
RateMe_2D_M = loadRateMe(type="2d", gender="M")

# RateMe_3D_F = loadRateMe(type="3d", gender="F")
# RateMe_3D_M = loadRateMe(type="3d", gender="M")

def beautifyIm_Web(im, gender):
    if gender == "F":
        trainX, trainY, pca, gp = RateMe_2D_F
    elif gender == "M":
        trainX, trainY, pca, gp = RateMe_2D_M

    rating = rateFace(im, pca, gp)
    image = beautifyIm(im, pca, gp, trainX, trainY, method='KNN')
    return rating, image