from US10k.US10k import loadUS10k
from RateMe.RateMe import loadRateMe
from Beautifier.beautifier import beautifyIm, rateFace
from Beautifier.face3D.beautifier3D import beautifyIm3D, rateFace3D
from Beautifier.faceCNN.beautifierCNN import getWebResults

# US10k_2D_F = loadUS10k(type="2d", gender="F")
# US10k_2D_M = loadUS10k(type="2d", gender="M")
#
# US10k_3D_F = loadUS10k(type="3d", gender="F")
# US10k_3D_M = loadUS10k(type="3d", gender="M")

RateMe_2D_F = loadRateMe(type="2d", gender="F", server=True)
RateMe_2D_M = loadRateMe(type="2d", gender="M", server=True)

RateMe_3D_F = loadRateMe(type="3d", gender="F", server=True)
RateMe_3D_M = loadRateMe(type="3d", gender="M", server=True)

*_, predictor_CNN_F = loadRateMe(type="cnn", gender="F", server=True)
*_, predictor_CNN_M = loadRateMe(type="cnn", gender="M", server=True)

def beautifyIm_Web(im, gender):
    if gender == "F":
        trainX, trainY, pca, gp = RateMe_2D_F
        trainX3D, trainY3D, pca3D, gp3D = RateMe_3D_F
    elif gender == "M":
        trainX, trainY, pca, gp = RateMe_2D_M
        trainX3D, trainY3D, pca3D, gp3D = RateMe_3D_M

    rating = rateFace(im, pca, gp)
    # image = beautifyIm(im, pca, gp, trainX, trainY, method='KNN')
    image = beautifyIm3D(im, pca3D, gp3D, trainX3D, trainY3D, method='GP')
    return rating, image

def beautifyIm_Web_CNN(im, gender):
    if gender == "F":
        predictor = predictor_CNN_F
    elif gender == "M":
        predictor = predictor_CNN_M

    return getWebResults(im, predictor)

if __name__ == "__main__":
    import cv2
    import json
    imageIs = [0,1,7,8,22,15,24,9,34,33]
    for index, im_i in enumerate(imageIs):
        gender = "F"
        if index %2 == 0:
            gender = "M"

        filepath = "C:\\Users\\ellio\\PycharmProjects\\FaceSwap\\DockerEnvironment\\web\\static\\img\\beautyisdataful\\examples\\{}_1.jpg".format(im_i)
        im = cv2.imread(filepath)
        results = beautifyIm_Web_CNN(im, gender)

        output = "\t\t{result: {\n\t\t\timages: [{\n\t\t\t\toriginal: \"{% static 'img/beautyisdataful/examples/"+str(im_i)+"_1.jpg' %}\",\n\t\t\t\tresults: "+json.dumps(results)+"\n\t\t\t}]\n\t\t}},"
        print(output)
