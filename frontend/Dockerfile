FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Defaults match the non-Docker dev flow (direct to the backend on :4000, no
# /api prefix). docker-compose.yml overrides both with proxy-relative values.
# The /ws suffix is required, not decorative — the backend's WebSocketServer
# matches that exact path (WS_PATH in backend/src/realtime/ws-server.ts).
ARG VITE_API_BASE_URL=http://localhost:4000
ARG VITE_WS_URL=ws://localhost:4000/ws
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build

FROM nginx:alpine
# Replaces the stock default.conf, which has no history-API fallback — without
# this, deep links like /positions or /symbols/AAPL 404 on hard refresh.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
