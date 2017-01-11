FROM python:3.5

#install build essentials
RUN apt-get update && apt-get install -y \
    build-essential cmake git pkg-config curl \
    libjpeg-dev libtiff-dev libjasper-dev libpng-dev libwebp-dev \
    libavcodec-dev libavformat-dev libswscale-dev libv4l-dev \
    libgtk2.0-dev \
    libatlas-base-dev gfortran \
    libboost-all-dev \
    libpq-dev python3-dev \
    libeigen3-dev \
    zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

#get the latest cmake
RUN wget "https://cmake.org/files/v3.7/cmake-3.7.1-Linux-x86_64.sh" && sh ./cmake-3.7.1-Linux-x86_64.sh --skip-license --prefix=/usr/local && \
export PATH=/usr/local/bin:$PATH

#get opencv
RUN mkdir -p /usr/lib/opencv && cd /usr/lib/opencv && \
    git clone https://github.com/Itseez/opencv.git && \
    cd /usr/lib/opencv/opencv && git checkout 3.2.0
RUN cd /usr/lib/opencv && \
    git clone https://github.com/Itseez/opencv_contrib.git && \
    cd /usr/lib/opencv/opencv_contrib && git checkout 3.2.0
RUN pip install numpy
RUN mkdir -p /usr/lib/opencv/build && cd /usr/lib/opencv/build && \
    cmake -D CMAKE_BUILD_TYPE=RELEASE \
        -D CMAKE_INSTALL_PREFIX=/usr/local \
        -D INSTALL_C_EXAMPLES=ON \
        -D INSTALL_PYTHON_EXAMPLES=ON \
        -D OPENCV_EXTRA_MODULES_PATH=/usr/lib/opencv/opencv_contrib/modules \
        -D BUILD_EXAMPLES=ON \
        -D PYTHON3_EXECUTABLE=/usr/local/bin/python3.5 \
        -D PYTHON3_INCLUDE=/usr/local/include/python3.5/ \
        -D PYTHON3_LIBRARY=/usr/local/lib/libpython3.5.a \
        -D PYTHON3_PACKAGES_PATH=/usr/local/lib/python3.5/site-packages \
        -D PYTHON3_NUMPY_INCLUDE_DIRS=/usr/local/lib/python3.5/site-packages/numpy/core/include \
        /usr/lib/opencv/opencv
RUN cd /usr/lib/opencv/build && \
    make && make install && \
    ldconfig

# eos face fitting
RUN mkdir -p /usr/lib/eos && cd /usr/lib/eos && \
    git clone --recursive https://github.com/ElliotSalisbury/eos.git -b devel

RUN mkdir /usr/lib/eos/build && mkdir /usr/lib/eos/install && cd /usr/lib/eos/build && \
    cmake -G "Unix Makefiles" /usr/lib/eos/eos -DCMAKE_INSTALL_PREFIX=../install/ -DEOS_GENERATE_PYTHON_BINDINGS=ON
RUN cd /usr/lib/eos/build && make && make install
RUN cp /usr/lib/eos/install/python/eos.cpython-35m-x86_64-linux-gnu.so /usr/local/lib/python3.5/site-packages

#copy the python app across
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY requirements.txt /usr/src/app/
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir /usr/src/app/data && cd /usr/src/app/data && wget "http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2" && bzip2 -d shape_predictor_68_face_landmarks.dat.bz2

RUN cd /usr/src/app && git clone https://github.com/ElliotSalisbury/FaceAnalysis.git && mv ./FaceAnalysis/Beautifier ./FaceAnalysis/US10k ./FaceAnalysis/RateMe .
RUN python -m RateMe.RateMe
COPY . /usr/src/app