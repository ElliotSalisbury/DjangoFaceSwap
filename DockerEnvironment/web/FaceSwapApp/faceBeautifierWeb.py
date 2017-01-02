import numpy as np

from US10K import loadUS10KFacialFeatures, loadUS10KPCAGP
from beautifier import beautifyIm

us10kdf = loadUS10KFacialFeatures()

us10k_F = us10kdf.loc[us10kdf['gender'] == 'F']
us10k_M = us10kdf.loc[us10kdf['gender'] == 'M']

trainX_F = np.array(us10k_F["facefeatures"].as_matrix().tolist())
trainY_F = np.array(us10k_F["attractiveness"].as_matrix().tolist())

#load the GP that learnt attractiveness
us10kpca_F, us10kgp_F = loadUS10KPCAGP(type="2d", gender="F")
us10kpca_M, us10kgp_M = loadUS10KPCAGP(type="2d", gender="M")

def beautifyIm_Web(im):
    return beautifyIm(im, us10kpca_F, us10kgp_F, trainX_F, trainY_F, method='KNN')