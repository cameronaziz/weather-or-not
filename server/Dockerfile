# Multi-stage Dockerfile for both development and production

# Base stage
FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package-lock.json package.json ./
COPY server/package.json ./server/
RUN npm ci --only=production

# Development stage
FROM node:20-alpine AS development
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package-lock.json package.json ./
COPY server/package.json ./server/
RUN npm ci
ENV NODE_ENV=development
COPY . .
RUN npm rebuild better-sqlite3 --workspace=server
RUN mkdir -p ./data
EXPOSE 9876
CMD ["npm", "run", "dev:docker", "--workspace=server"]

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY . .
RUN npm rebuild better-sqlite3 --workspace=server
RUN npx tsc --project server
RUN mkdir -p ./data
EXPOSE 9876
CMD ["npm", "run", "start:docker", "--workspace=server"]