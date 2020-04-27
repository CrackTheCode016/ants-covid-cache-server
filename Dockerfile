FROM node:10-alpine
WORKDIR /app
COPY ./package.json ./
RUN npm install
COPY . .
RUN rm -rf ./node_modules/ants-protocol-sdk/test
RUN rm -rf ./node_modules/@types/mocha
RUN npm run build

CMD ["node", "dist/main"]