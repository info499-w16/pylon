FROM mhart/alpine-node:5.6

MAINTAINER Caleb Thorsteinson <caleb@thorsteinson.io>
LABEL description="Microservice Gateway" version="0.0.1"

# Set node to production mode so dev dependencies aren't added
ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package.json .
RUN npm install

# Copy over all source files
# Dockerignore should prevent adding npm modules
COPY . /usr/src/app

CMD ["npm", "start"]
