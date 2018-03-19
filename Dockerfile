FROM phusion/baseimage

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y git build-essential nodejs

ADD . /app

WORKDIR /app

RUN rm -rf node_modules ipfs
RUN npm install
RUN npm run build

EXPOSE 8080
CMD node server.js
