# 1. Base stage
FROM node:lts-alpine3.23 AS base
WORKDIR /app
RUN corepack enable pnpm 

# 2. Dependencies stage 
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# 3. Local dev stage
FROM deps AS dev
COPY . .
CMD ["pnpm", "dev"]

# 4. Build stage (COPY is required here for production builds)
FROM deps AS build
COPY . .
RUN pnpm build

# 5. Production stage
FROM node:lts-alpine3.23 AS final
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

COPY --from=build /app/.next/standalone .
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
