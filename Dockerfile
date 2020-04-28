FROM node:10-alpine
WORKDIR /app

# Set timezone
ENV TZ=America/New_York
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY ./package.json ./

RUN npm install
COPY . .
RUN rm -rf ./node_modules/ants-protocol-sdk/test
RUN rm -rf ./node_modules/@types/mocha
RUN npm run build



CMD ["node", "dist/main"]