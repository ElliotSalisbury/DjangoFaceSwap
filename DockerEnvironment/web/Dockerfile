FROM python:3.5

#install build essentials
RUN apt-get update && apt-get upgrade -y && \
apt-get install -y build-essential cmake git pkg-config

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
