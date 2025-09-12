# 🚀 Быстрый старт с облачным реестром Docker

## Шаг 1: Настройка

```bash
# 1. Настройте переменные окружения
cp .env.prod .env.prod.local
# Отредактируйте .env.prod.local:
# - DOCKER_USERNAME=ваш-username-в-docker-hub
# - POSTGRES_PASSWORD=безопасный-пароль

# 2. Авторизуйтесь в Docker Hub
docker login
```

## Шаг 2: Сборка и публикация

```bash
# Соберите и опубликуйте образы
./build-and-push.sh

# Или с конкретной версией
./build-and-push.sh v1.0.0
```

## Шаг 3: Развертывание

```bash
# Разверните приложение из реестра
./deploy.sh prod

# Проверьте статус
docker-compose -f docker-compose.prod.yml ps
```

## Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Database**: localhost:5432

## Полезные команды

```bash
# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f

# Остановка
docker-compose -f docker-compose.prod.yml down

# Обновление образов
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

📖 **Подробная документация**: [`DOCKER_REGISTRY_README.md`](DOCKER_REGISTRY_README.md:1)