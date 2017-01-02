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

# eos face fitting
#RUN mkdir -p /usr/lib/eos
#WORKDIR /usr/lib/eos
#RUN git clone --recursive https://github.com/patrikhuber/eos.git -b devel && \
#    mkdir build && cd build && \
#    cmake -G ../eos -DCMAKE_INSTALL_PREFIX=../install/ -DEOS_GENERATE_PYTHON_BINDINGS=ON
#    make && make install

#copy the python app across
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY requirements.txt /usr/src/app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /usr/src/app

