FROM python:3.5

#install build essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake git pkg-config curl \
    libjpeg-dev libtiff-dev libjasper-dev libpng-dev libwebp-dev \
    libavcodec-dev libavformat-dev libswscale-dev libv4l-dev \
    libgtk2.0-dev \
    libatlas-base-dev gfortran \
    libpq-dev python3-dev \
    libeigen3-dev \
    zip \
    libgflags-dev \
    libgoogle-glog-dev \
    libhdf5-serial-dev \
    libleveldb-dev \
    liblmdb-dev \
    libopencv-dev \
    libprotobuf-dev \
    libsnappy-dev \
    protobuf-compiler \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

#get the latest cmake
RUN wget "https://cmake.org/files/v3.8/cmake-3.8.2-Linux-x86_64.sh" && sh ./cmake-3.8.2-Linux-x86_64.sh --skip-license --prefix=/usr/local && \
export PATH=/usr/local/bin:$PATH

# Install Boost 1.64 with Python lib
WORKDIR "/opt"
RUN wget https://sourceforge.net/projects/boost/files/boost/1.64.0/boost_1_64_0.tar.bz2 && \
    tar --bzip2 -xf boost_1_64_0.tar.bz2 && \
    rm boost_1_64_0.tar.bz2

RUN cd boost_1_64_0/tools/build && \
    # Symlink the Python header files to the standard location.
    # This is important as the base image comes with custom Python 3.5 build
    # and thus the location of the header files is different.
    ln -s /usr/local/include/python3.5m /usr/local/include/python3.5 && \
    ./bootstrap.sh && \
    ./b2 install --prefix=/opt/boost_build && \
    ln -s /opt/boost_build/bin/b2 /usr/bin/b2 && \
    ln -s /opt/boost_build/bin/bjam /usr/bin/bjam && \
    cd /opt/boost_1_64_0 && \
    b2 install && \
    # Specify Python version explicitly as solution to https://github.com/boostorg/build/issues/194
    echo "using python : 3.5 ;" >> /etc/site-config.jam && \
    b2 --with-python toolset=gcc install
RUN ln -s /usr/local/lib/libboost_python3.so /usr/local/lib/libboost_python-py3.so

#install opencv
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
        -D PYTHON3_LIBRARY=/usr/local/lib/libpython3.so \
        -D PYTHON3_PACKAGES_PATH=/usr/local/lib/python3.5/site-packages \
        -D PYTHON3_NUMPY_INCLUDE_DIRS=/usr/local/lib/python3.5/site-packages/numpy/core/include \
        /usr/lib/opencv/opencv
RUN cd /usr/lib/opencv/build && \
    make && make install && \
    ldconfig

#install caffe
ENV CAFFE_ROOT=/opt/caffe
WORKDIR $CAFFE_ROOT
ENV CLONE_TAG=1.0

RUN git clone -b ${CLONE_TAG} --depth 1 https://github.com/BVLC/caffe.git .
RUN pip install --upgrade pip && \
    cd python && for req in $(cat requirements.txt) pydot; do pip install $req; done && cd ..
RUN pip install protobuf==3.0.0-alpha-3 && \
    pip install python-dateutil --upgrade
RUN mkdir build && cd build && \
    cmake -DCPU_ONLY=1 \
    -Dpython_version=3 \
    -DPYTHON_INCLUDE_DIR=/usr/local/include/python3.5/ \
    -DPYTHON_LIBRARY=/usr/local/lib/libpython3.so / \
    .. && \
    make -j"$(nproc)"

ENV PYCAFFE_ROOT $CAFFE_ROOT/python
ENV PYTHONPATH $PYCAFFE_ROOT:$PYTHONPATH
ENV PATH $CAFFE_ROOT/build/tools:$PYCAFFE_ROOT:$PATH
RUN echo "$CAFFE_ROOT/build/lib" >> /etc/ld.so.conf.d/caffe.conf && ldconfig

# eos face fitting
RUN mkdir -p /usr/lib/eos && cd /usr/lib/eos && \
    git clone --recursive https://github.com/ElliotSalisbury/eos.git

RUN mkdir /usr/lib/eos/build && mkdir /usr/lib/eos/install && cd /usr/lib/eos/build && \
    cmake -G "Unix Makefiles" /usr/lib/eos/eos -DCMAKE_INSTALL_PREFIX=../install/ -DEOS_GENERATE_PYTHON_BINDINGS=ON
RUN cd /usr/lib/eos/build && make && make install
RUN cp /usr/lib/eos/install/python/eos.cpython-35m-x86_64-linux-gnu.so /usr/local/lib/python3.5/site-packages


#install the python requirements
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY requirements.txt /usr/src/app/
RUN pip install --no-cache-dir -r requirements.txt

#install the python app and copy the necessary files over
RUN mkdir /usr/src/app/data && cd /usr/src/app/data && wget "http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2" && bzip2 -d shape_predictor_68_face_landmarks.dat.bz2

RUN mkdir /usr/src/app/cnn && mkdir /usr/src/app/cnn/CNN
COPY ./CNN /usr/src/app/cnn/CNN

RUN cd /usr/src/app && git clone https://github.com/ElliotSalisbury/FaceAnalysis.git && mv ./FaceAnalysis/Beautifier ./FaceAnalysis/US10k ./FaceAnalysis/RateMe .
COPY ./data/eos/bfm_small.bin /usr/lib/eos/install/share/bfm_small.bin
COPY ./data/eos/ibug_to_bfm_small.txt /usr/lib/eos/install/share/ibug_to_bfm_small.txt
COPY . /usr/src/app