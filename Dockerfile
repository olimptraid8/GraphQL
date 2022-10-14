FROM node:12.18.4
WORKDIR /usr/src/app
COPY ./server/package*.json ./
RUN npm install
COPY ./server .
EXPOSE 4000
CMD [ "node", "src/index.js" ]
