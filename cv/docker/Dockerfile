FROM node:10-alpine

RUN apk add --update

RUN apk add python3 \
    python3-dev \
    py-pip \
    build-base \
    git \
    openssh-client \
  && pip install virtualenv \
  && rm -rf /var/cache/apk/*

RUN apk --no-cache add pkgconfig autoconf automake libtool nasm build-base zlib-dev


RUN npm install -g gulp

WORKDIR /app
RUN npm set progress=false