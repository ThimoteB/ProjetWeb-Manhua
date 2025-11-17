FROM node:22
RUN apt-get update && apt-get install -y sqlite3 python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN rm -rf .nuxt
RUN npm run postinstall
RUN npm run build

RUN mkdir -p /app/server/data
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]