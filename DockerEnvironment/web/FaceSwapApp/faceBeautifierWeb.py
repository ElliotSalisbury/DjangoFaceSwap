import numpy as np
import sys

from US10k.US10k import loadUS10kFacialFeatures, loadUS10kPCAGP
from Beautifier.beautifier import beautifyIm, rateFace

us10kdf = loadUS10kFacialFeatures()

us10k_F = us10kdf.loc[us10kdf['gender'] == 'F']
us10k_M = us10kdf.loc[us10kdf['gender'] == 'M']

trainX_F = np.array(us10k_F["facefeatures"].as_matrix().tolist())
trainY_F = np.array(us10k_F["attractiveness"].as_matrix().tolist())
trainX_M = np.array(us10k_M["facefeatures"].as_matrix().tolist())
trainY_M = np.array(us10k_M["attractiveness"].as_matrix().tolist())

#load the GP that learnt attractiveness
us10kpca_F, us10kgp_F = loadUS10kPCAGP(type="2d", gender="F")
us10kpca_M, us10kgp_M = loadUS10kPCAGP(type="2d", gender="M")

def beautifyIm_Web(im, gender):
    if gender == "F":
        trainX, trainY = trainX_F, trainY_F
        pca, gp = us10kpca_F, us10kgp_F
    elif gender == "M":
        trainX, trainY = trainX_M, trainY_M
        pca, gp = us10kpca_M, us10kgp_M

    rating = rateFace(im, pca, gp) * 2
    image = beautifyIm(im, pca, gp, trainX, trainY, method='KNN')
    return rating, image