FROM node:alpine

# Create app directory
RUN mkdir -p /build
WORKDIR /build

# to make npm test run only once non-interactively
ENV CI=true

# Install dependencies
RUN npm install -g serve

# Bundle app source
COPY ./build /build

EXPOSE 5000

# defined in package.json
CMD [ "serve", "-s /build" ]
