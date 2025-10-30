FROM node:22
RUN apt-get update && apt-get install -y sqlite3
WORKDIR /app

RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
RUN node -e 'new require("better-sqlite3")(":memory:")'

COPY . .
RUN rm -rf .nuxt
RUN pnpm run postinstall
RUN pnpm run build

RUN mkdir -p /app/server/data
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]