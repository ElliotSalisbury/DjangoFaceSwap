FROM ubuntu:14.04

#install build essentials
RUN apt-get update && apt-get install -y \
    build-essential cmake git pkg-config curl \
    libjpeg8-dev libtiff4-dev libjasper-dev libpng12-dev libwebp-dev \
    libavcodec-dev libavformat-dev libswscale-dev libv4l-dev \
    libgtk2.0-dev \
    libatlas-base-dev gfortran \
    libboost-all-dev \
    python-dev python-pip \
    zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN cd /usr/local/bin \
	&& { [ -e easy_install ] || ln -s easy_install-* easy_install; } \
	&& ln -s idle3 idle \
	&& ln -s pydoc3 pydoc \
	&& ln -s python3 python \
	&& ln -s python3-config python-config

#copy the python app across
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ONBUILD COPY requirements.txt /usr/src/app/
ONBUILD RUN pip install --no-cache-dir -r requirements.txt

ONBUILD COPY . /usr/src/app

ADD ../../FaceSwapApp /usr/src/app/FaceSwapApp

# eos face fitting
#RUN git clone --recursive https://github.com/patrikhuber/eos.git -b devel &&
#mkdir build && cd build &&
#cmake -G "<your favourite generator>" ../eos -DCMAKE_INSTALL_PREFIX=../install/ &&
#make && make install &&
