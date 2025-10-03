# frontend/Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci || npm install

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend ./
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_BASE=https://partner.covenanttechnology.net/api
ENV NEXT_PUBLIC_HEADER_AUTH=disabled
ENV NEXT_PUBLIC_APP_VERSION=1.0.0
RUN npm run build || echo "Build step skipped if not configured"

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production     NEXT_TELEMETRY_DISABLED=1     PORT=3000
COPY --from=build /app .
EXPOSE 3000
CMD ["npm", "run", "start"]
