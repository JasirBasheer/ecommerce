FROM node:18-alpine3.17

WORKDIR /usr/app

COPY package*.json ./

RUN npm install

COPY . .

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /usr/app
USER nodejs

EXPOSE 3000

CMD [ "npm", "start" ]