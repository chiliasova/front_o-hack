# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# auto — бэкенд, а если он не отвечает, демо-моки; mock — только моки; live — только бэкенд
ARG VITE_API_MODE=auto
ENV VITE_API_MODE=$VITE_API_MODE
RUN npm run build

# ---- serve ----
FROM nginxinc/nginx-unprivileged:1.27-alpine
# Адрес бэкенда внутри docker compose; можно переопределить переменной окружения
ENV BACKEND_URL=http://backend:8000
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
