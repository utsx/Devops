# 🐳 Docker развертывание системы отслеживания покупок

Полное руководство по развертыванию приложения в Docker контейнерах.

## 📋 Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   (React)       │    │  (Spring Boot)  │    │   (Database)    │
│   Port: 3000    │◄──►│   Port: 8080    │◄──►│   Port: 5432    │
│   nginx:alpine  │    │   openjdk:21    │    │ postgres:16     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Быстрый старт

### Предварительные требования

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB свободной оперативной памяти
- 2GB свободного места на диске

### Запуск всех сервисов

```bash
# Клонировать репозиторий
git clone <repository-url>
cd Devops

# Запустить все сервисы
docker-compose up -d

# Проверить статус сервисов
docker-compose ps

# Просмотреть логи
docker-compose logs -f
```

### Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Database**: localhost:5432

## 🔧 Конфигурация сервисов

### PostgreSQL Database
```yaml
postgres:
  image: postgres:16
  ports: ["5432:5432"]
  environment:
    POSTGRES_DB: postgres
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
```

### Spring Boot Backend
```yaml
backend:
  build: .
  ports: ["8080:8080"]
  environment:
    SPRING_PROFILES_ACTIVE: docker
    SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/postgres
```

### React Frontend
```yaml
frontend:
  build: ./frontend
  ports: ["3000:80"]
  depends_on: [backend]
```

## 📁 Структура Docker файлов

```
.
├── Dockerfile                          # Backend Dockerfile
├── .dockerignore                       # Backend Docker ignore
├── docker-compose.yaml                 # Основная конфигурация
├── frontend/
│   ├── Dockerfile                      # Frontend Dockerfile
│   ├── .dockerignore                   # Frontend Docker ignore
│   └── nginx.conf                      # Nginx конфигурация
└── src/main/resources/
    └── application-docker.properties   # Spring Boot конфигурация для Docker
```

## 🛠 Команды управления

### Основные команды

```bash
# Запуск всех сервисов
docker-compose up -d

# Остановка всех сервисов
docker-compose down

# Перезапуск сервисов
docker-compose restart

# Просмотр логов
docker-compose logs -f [service-name]

# Масштабирование сервиса
docker-compose up -d --scale backend=2
```

### Сборка и обновление

```bash
# Пересборка всех образов
docker-compose build

# Пересборка конкретного сервиса
docker-compose build backend

# Обновление и перезапуск
docker-compose up -d --build
```

### Управление данными

```bash
# Создание резервной копии БД
docker-compose exec postgres pg_dump -U postgres postgres > backup.sql

# Восстановление БД
docker-compose exec -T postgres psql -U postgres postgres < backup.sql

# Очистка volumes
docker-compose down -v
```

## 🔍 Мониторинг и отладка

### Health Checks

Все сервисы имеют встроенные health checks:

```bash
# Проверка статуса всех сервисов
docker-compose ps

# Детальная информация о health checks
docker inspect <container-name> | grep -A 10 Health
```

### Логи и отладка

```bash
# Просмотр логов всех сервисов
docker-compose logs

# Логи конкретного сервиса
docker-compose logs -f backend

# Подключение к контейнеру
docker-compose exec backend bash
docker-compose exec postgres psql -U postgres

# Просмотр ресурсов
docker stats
```

### Endpoints для мониторинга

- **Backend Health**: http://localhost:8080/actuator/health
- **Frontend Health**: http://localhost:3000/health
- **Database**: Проверка через health check в docker-compose

## 🚨 Troubleshooting

### Частые проблемы

#### 1. Порты заняты
```bash
# Проверить занятые порты
netstat -tulpn | grep :3000
netstat -tulpn | grep :8080
netstat -tulpn | grep :5432

# Остановить конфликтующие сервисы
sudo systemctl stop postgresql
sudo systemctl stop nginx
```

#### 2. Недостаточно памяти
```bash
# Проверить использование памяти
docker stats

# Увеличить лимиты в docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
```

#### 3. Проблемы с сетью
```bash
# Проверить Docker сети
docker network ls
docker network inspect devops_app-network

# Пересоздать сеть
docker-compose down
docker network prune
docker-compose up -d
```

#### 4. Проблемы с базой данных
```bash
# Проверить подключение к БД
docker-compose exec postgres psql -U postgres -c "SELECT version();"

# Проверить таблицы
docker-compose exec postgres psql -U postgres -c "\dt"

# Пересоздать БД
docker-compose down -v
docker-compose up -d
```

## 🔒 Безопасность

### Рекомендации для продакшена

1. **Изменить пароли по умолчанию**
```yaml
environment:
  POSTGRES_PASSWORD: ${DB_PASSWORD}
```

2. **Использовать secrets**
```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt
```

3. **Ограничить сетевой доступ**
```yaml
networks:
  app-network:
    driver: bridge
    internal: true
```

4. **Настроить SSL/TLS**
```yaml
frontend:
  volumes:
    - ./ssl:/etc/nginx/ssl:ro
```

## 📊 Производительность

### Оптимизация

1. **Многоэтапная сборка** - уже реализована в Dockerfile
2. **Кэширование слоев** - используется в .dockerignore
3. **Минимальные базовые образы** - alpine версии
4. **Health checks** - для быстрого обнаружения проблем

### Мониторинг ресурсов

```bash
# Использование ресурсов
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Размер образов
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

## 🔄 CI/CD интеграция

### GitHub Actions пример

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          docker-compose pull
          docker-compose up -d --build
```

## 📝 Переменные окружения

### Backend (.env файл)
```env
SPRING_PROFILES_ACTIVE=docker
DB_HOST=postgres
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:8080/api/v1
```

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose logs -f`
2. Проверьте health checks: `docker-compose ps`
3. Проверьте сетевое подключение между контейнерами
4. Убедитесь, что все порты свободны
5. Проверьте доступное место на диске и память

## 📚 Дополнительные ресурсы

- [Docker Compose документация](https://docs.docker.com/compose/)
- [Spring Boot Docker guide](https://spring.io/guides/gs/spring-boot-docker/)
- [React Docker deployment](https://create-react-app.dev/docs/deployment/#docker)
- [PostgreSQL Docker hub](https://hub.docker.com/_/postgres)