FROM node:alpine

RUN mkdir /app

COPY ./app/* /app/

WORKDIR /app

RUN npm install

CMD [ "npm", "start" ]
