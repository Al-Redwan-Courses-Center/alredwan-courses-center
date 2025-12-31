FROM node:lts-alpine3.23 AS base
WORKDIR /app
COPY ./package*.json .
RUN npm ci
COPY . .

FROM base as dev
CMD [ "npm", "run", "dev" ]

FROM base AS build
RUN npm run build

FROM node:lts-alpine3.23 AS final
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone .
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD [ "node", "server.js" ]