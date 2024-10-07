FROM node:20.15.0

WORKDIR /frontend

COPY . .

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]