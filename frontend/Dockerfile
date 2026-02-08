FROM node:lts-alpine3.23 AS bootstrap
WORKDIR /app
RUN npm i -g pnpm

FROM bootstrap as dev
CMD ["npm", "run", "dev"]

FROM bootstrap as base
COPY ./package*.json ./pnpm-lock.yaml ./
# RUN npm ci
RUN pnpm install --frozen-lockfile
COPY . .

FROM base AS build
RUN npm run build

FROM node:lts-alpine3.23 AS final
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone .
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000

CMD [ "node", "server.js" ]