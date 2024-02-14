FROM node:20-alpine AS base

FROM base AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*json tsconfig.json src ./

RUN npm ci && \
    npm run build && \
    npm prune --production

FROM unit:node20 as unit
WORKDIR /www

COPY --from=builder --chown=unit:unit /app/node_modules /www/node_modules
COPY --from=builder --chown=unit:unit /app/dist /www/dist
COPY etc/config /docker-entrypoint.d

RUN npm install -g --unsafe-perm unit-http && \
 npm link unit-http && \
 mkdir -p /www/static && \
 chown -R unit:unit /www/static/ && \
 chmod +x /www/dist/index.js