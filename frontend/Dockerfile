# Многоэтапная сборка для React приложения
FROM node:18-alpine AS build

# Установка рабочей директории
WORKDIR /app

# Копирование package.json
COPY package.json ./

# Настройка npm для ускорения установки
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 3 && \
    npm config set fetch-retry-factor 10 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000

# Установка зависимостей
RUN npm install --no-audit --no-fund --loglevel=error

# Копирование исходного кода
COPY src/ ./src/
COPY public/ ./public/
COPY tsconfig.json ./

# Сборка приложения для продакшена
RUN npm run build

# Финальный образ с nginx
FROM nginx:alpine

# Удаление стандартной конфигурации nginx
RUN rm -rf /usr/share/nginx/html/*

# Копирование собранного приложения
COPY --from=build /app/build /usr/share/nginx/html

# Копирование конфигурации nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открытие порта
EXPOSE 80

# Команда запуска nginx
CMD ["nginx", "-g", "daemon off;"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1