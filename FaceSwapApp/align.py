#!/usr/bin/python

# Copyright (c) 2015 Matthew Earl
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
#     The above copyright notice and this permission notice shall be included
#     in all copies or substantial portions of the Software.
#
#     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
#     OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
#     MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
#     NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
#     DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
#     OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
#     USE OR OTHER DEALINGS IN THE SOFTWARE.

"""
This is the code behind the Switching Eds blog post:

    http://matthewearl.github.io/2015/07/28/switching-eds-with-python/

See the above for an explanation of the code below.

To run the script you'll need to install dlib (http://dlib.net) including its
Python bindings, and OpenCV. You'll also need to obtain the trained model from
sourceforge:

    http://sourceforge.net/projects/dclib/files/dlib/v18.10/shape_predictor_68_face_landmarks.dat.bz2

Unzip with `bunzip2` and change `PREDICTOR_PATH` to refer to this file. The
script is run like so:

    ./faceswap.py <head image> <face image>

If successful, a file `output.jpg` will be produced with the facial features
from `<head image>` replaced with the facial features from `<face image>`.

"""

import cv2
import dlib
import numpy
import glob
import random
import os
from FaceSwapApp.settings import *

SCALE_FACTOR = 1
FEATHER_AMOUNT = 11
MAX_SIZE = 512

FACE_POINTS = list(range(17, 68))
MOUTH_POINTS = list(range(48, 61))
RIGHT_BROW_POINTS = list(range(17, 22))
LEFT_BROW_POINTS = list(range(22, 27))
RIGHT_EYE_POINTS = list(range(36, 42))
LEFT_EYE_POINTS = list(range(42, 48))
NOSE_POINTS = list(range(27, 35))
JAW_POINTS = list(range(0, 17))

# Points used to line up the images.
ALIGN_POINTS = (JAW_POINTS + LEFT_BROW_POINTS + RIGHT_EYE_POINTS + LEFT_EYE_POINTS +
                               RIGHT_BROW_POINTS + NOSE_POINTS + MOUTH_POINTS + FACE_POINTS)

# Points from the second image to overlay on the first. The convex hull of each
# element will be overlaid.
OVERLAY_POINTS = [
    # LEFT_EYE_POINTS + RIGHT_EYE_POINTS + LEFT_BROW_POINTS + RIGHT_BROW_POINTS,
    # NOSE_POINTS + MOUTH_POINTS,
    JAW_POINTS + LEFT_BROW_POINTS + RIGHT_BROW_POINTS,
]

# Amount of blur to use during colour correction, as a fraction of the
# pupillary distance.
COLOUR_CORRECT_BLUR_FRAC = 0.6

detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor(FACESWAP_SHAPEPREDICTOR_PATH)

class TooManyFaces(Exception):
    pass

class NoFaces(Exception):
    pass

def get_landmarks(im):
    rects = detector(im, 1)

    # if len(rects) > 1:
    #     raise TooManyFaces
    if len(rects) == 0:
        raise NoFaces

    landmarks = []
    for face in rects:
        landmarks.append(numpy.matrix([[p.x, p.y] for p in predictor(im, face).parts()]))

    return landmarks

def annotate_landmarks(im, landmarks):
    im = im.copy()
    for idx, point in enumerate(landmarks):
        pos = (point[0, 0], point[0, 1])
        cv2.putText(im, str(idx), pos,
                    fontFace=cv2.FONT_HERSHEY_SCRIPT_SIMPLEX,
                    fontScale=0.4,
                    color=(0, 0, 255))
        cv2.circle(im, pos, 3, color=(0, 255, 255))
    return im

def draw_convex_hull(im, points, color):
    points = cv2.convexHull(points)
    cv2.fillConvexPoly(im, points, color=color)

def get_face_mask(im, landmarks):
    height, width = im.shape[:2]
    mask = numpy.zeros((height, width, 3), dtype=numpy.float64)

    for group in OVERLAY_POINTS:
        draw_convex_hull(mask,
                         landmarks[group],
                         color=(1,1,1))

    mask = cv2.GaussianBlur(mask, (FEATHER_AMOUNT, FEATHER_AMOUNT), 0)

    return mask

def transformation_from_points(points1, points2):
    points1 = points1.astype(numpy.float64)
    points2 = points2.astype(numpy.float64)

    M, status = cv2.findHomography(points1, points2)
    return M

def read_im_and_landmarks(fname):
    im = cv2.imread(fname, cv2.IMREAD_COLOR)
    im = cv2.resize(im, (im.shape[1] * SCALE_FACTOR,
                         im.shape[0] * SCALE_FACTOR))
    s = get_landmarks(im)

    return im, s

def correct_colours(im1, im2, landmarks1):
    blur_amount = COLOUR_CORRECT_BLUR_FRAC * numpy.linalg.norm(
                              numpy.mean(landmarks1[LEFT_EYE_POINTS], axis=0) -
                              numpy.mean(landmarks1[RIGHT_EYE_POINTS], axis=0))
    blur_amount = int(blur_amount)
    if blur_amount % 2 == 0:
        blur_amount += 1
    im1_blur = cv2.GaussianBlur(im1, (blur_amount, blur_amount), 0)
    im2_blur = cv2.GaussianBlur(im2, (blur_amount, blur_amount), 0)

    # Avoid divide-by-zero errors.
    im2_blur[im2_blur <= 0.0] = 0.001

    return (im2 * im1_blur) / im2_blur

def getFaceDirection(landmarks):
    facePos = numpy.mean(landmarks[FACE_POINTS],0)
    nosePos = numpy.mean(landmarks[NOSE_POINTS],0)

    if nosePos[0,0] < facePos[0,0]:
        return -1
    else:
        return 1

def faceSwapImages(im1):
    im1 = ensureImageLessThanMax(im1)
    im1_all_landmarks = get_landmarks(im1)
    im1 = im1.astype(numpy.float64)

    for im1_face_landmarks in im1_all_landmarks:
        im2_direction, im2,im2_landmarks,im2_flipped,im2_landmarks_flipped = random.choice(FACESWAPS)

        #swap the face if theyre pointing the wrong direction
        im1_direction = getFaceDirection(im1_face_landmarks)
        if im2_direction != im1_direction:
            im2 = im2_flipped
            im2_landmarks = im2_landmarks_flipped

        M = transformation_from_points(im2_landmarks[ALIGN_POINTS],
                                       im1_face_landmarks[ALIGN_POINTS])

        mask = get_face_mask(im2, im2_landmarks)
        warped_mask = cv2.warpPerspective(mask,
                                          M,
                                          (im1.shape[1], im1.shape[0]))
        combined_mask = cv2.max(get_face_mask(im1, im1_face_landmarks), warped_mask)

        #warp onto im1 to try and reduce any color correction issues around the edge of im2
        warped_im2 = cv2.warpPerspective(im2,
                                         M,
                                         (im1.shape[1], im1.shape[0]),
                                         dst=im1.copy(),
                                         borderMode=cv2.BORDER_TRANSPARENT)

        warped_corrected_im2 = correct_colours(im1, warped_im2, im1_face_landmarks)

        im1 = im1 * (1.0 - combined_mask) + warped_corrected_im2 * combined_mask
    im1 = numpy.clip(im1, 0, 255, out=im1).astype(numpy.uint8)
    return im1

def ensureImageLessThanMax(im):
    height, width, depth = im.shape
    if height > MAX_SIZE or width > MAX_SIZE:

        if width > height:
            ratio = MAX_SIZE / float(width)
            width = MAX_SIZE
            height = int(height * ratio)
        else:
            ratio = MAX_SIZE / float(height)
            height = MAX_SIZE
            width = int(width * ratio)
        im = cv2.resize(im,(width,height))
    return im

FACESWAPS = []
for impath in glob.glob(os.path.join(FACESWAP_FOLDER_PATH,"*.jpg")):
    try:
        im = cv2.imread(impath)
        #im = ensureImageLessThanMax(im)

        landmarks = get_landmarks(im)[0]
        face_direction = getFaceDirection(landmarks)
        im_flipped = cv2.flip(im,1)
        landmarks_flipped = get_landmarks(im_flipped)[0]

        #convert to float64 first to avoid repeatedly doing it
        im = im.astype(numpy.float64)
        im_flipped = im_flipped.astype(numpy.float64)

        FACESWAPS.append((face_direction,im,landmarks,im_flipped,landmarks_flipped))
    except Exception as e:
        pass