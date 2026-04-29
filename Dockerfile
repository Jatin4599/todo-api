FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci 

FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./
USER appuser
EXPOSE 4000
CMD ["node", "src/index.js"]