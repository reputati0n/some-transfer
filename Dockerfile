FROM node:20-bookworm-slim

ARG APP_VERSION=v0.1.1

ENV NODE_ENV=production \
    APP_VERSION=${APP_VERSION}

LABEL org.opencontainers.image.title="Some Transfer" \
      org.opencontainers.image.version=${APP_VERSION}

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN mkdir -p /app/uploads /app/data \
    && chown -R node:node /app

EXPOSE 3000

CMD ["node", "server.js"]
