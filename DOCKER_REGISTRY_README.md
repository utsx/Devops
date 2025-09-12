н# 🐳 Развертывание приложения из облачного реестра Docker

Руководство по сборке, публикации и развертыванию Docker образов в облачном реестре.

## 📋 Обзор

Данное руководство описывает процесс:
1. Сборки Docker образов для backend и frontend
2. Публикации образов в облачный реестр (Docker Hub)
3. Развертывания приложения из опубликованных образов

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    Облачный реестр                         │
│                   (Docker Hub)                             │
├─────────────────────────────────────────────────────────────┤
│  📦 devops-backend:latest    📦 devops-frontend:latest     │
│  📦 devops-backend:v1.0.0    📦 devops-frontend:v1.0.0    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   (React)       │    │  (Spring Boot)  │    │   (Database)    │
│   Port: 3000    │◄──►│   Port: 8080    │◄──►│   Port: 5432    │
│   nginx:alpine  │    │   openjdk:21    │    │ postgres:16     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Структура файлов

```
.
├── docker-compose.yaml          # Локальная разработка (сборка из исходников)
├── docker-compose.prod.yml      # Продакшен (образы из реестра)
├── .env.prod                    # Переменные окружения для продакшена
├── build-and-push.sh           # Скрипт сборки и публикации образов
├── deploy.sh                   # Скрипт развертывания из реестра
├── backend/
│   └── Dockerfile              # Dockerfile для backend
├── frontend/
│   └── Dockerfile              # Dockerfile для frontend
└── DOCKER_REGISTRY_README.md   # Данное руководство
```

## 🚀 Быстрый старт

### 1. Подготовка

```bash
# Клонировать репозиторий
git clone <repository-url>
cd Devops

# Настроить переменные окружения
cp .env.prod .env.prod.local
# Отредактировать .env.prod.local с вашими настройками
```

### 2. Настройка Docker Hub

```bash
# Авторизация в Docker Hub
docker login

# Или для других реестров
docker login your-registry.com
```

### 3. Сборка и публикация образов

```bash
# Сборка и публикация с версией latest
./build-and-push.sh

# Сборка и публикация с конкретной версией
./build-and-push.sh v1.0.0
```

### 4. Развертывание

```bash
# Развертывание в продакшене
./deploy.sh prod

# Или вручную
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## ⚙️ Конфигурация

### Переменные окружения (.env.prod)

```env
# Docker Registry настройки
DOCKER_REGISTRY=docker.io                    # Реестр (docker.io, ghcr.io, etc.)
DOCKER_USERNAME=your-dockerhub-username      # Ваш username в реестре

# Версии образов
BACKEND_VERSION=latest                       # Версия backend образа
FRONTEND_VERSION=latest                      # Версия frontend образа

# Порты приложений
FRONTEND_PORT=3000                          # Порт для frontend
BACKEND_PORT=8080                           # Порт для backend
POSTGRES_PORT=5432                          # Порт для PostgreSQL

# База данных
POSTGRES_DB=postgres                        # Имя базы данных
POSTGRES_USER=postgres                      # Пользователь БД
POSTGRES_PASSWORD=your-secure-password      # Пароль БД (измените!)
```

### Docker Compose для продакшена

Файл [`docker-compose.prod.yml`](docker-compose.prod.yml:1) использует образы из реестра вместо локальной сборки:

```yaml
services:
  backend:
    image: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/devops-backend:${BACKEND_VERSION}
    # ... остальная конфигурация
  
  frontend:
    image: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/devops-frontend:${FRONTEND_VERSION}
    # ... остальная конфигурация
```

## 🛠️ Команды управления

### Сборка и публикация

```bash
# Сборка и публикация образов
./build-and-push.sh [version]

# Примеры:
./build-and-push.sh                    # latest версия
./build-and-push.sh v1.0.0            # конкретная версия
./build-and-push.sh $(date +%Y%m%d)   # версия по дате
```

### Развертывание

```bash
# Развертывание из реестра
./deploy.sh [environment]

# Примеры:
./deploy.sh prod                       # продакшен окружение
./deploy.sh staging                    # staging окружение
```

### Ручное управление

```bash
# Получение образов из реестра
docker-compose -f docker-compose.prod.yml pull

# Запуск сервисов
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Остановка сервисов
docker-compose -f docker-compose.prod.yml down

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f

# Проверка статуса
docker-compose -f docker-compose.prod.yml ps
```

## 🔧 Настройка различных реестров

### Docker Hub (по умолчанию)

```env
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=your-dockerhub-username
```

### GitHub Container Registry

```env
DOCKER_REGISTRY=ghcr.io
DOCKER_USERNAME=your-github-username
```

```bash
# Авторизация в GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u your-github-username --password-stdin
```

### Amazon ECR

```env
DOCKER_REGISTRY=123456789012.dkr.ecr.us-west-2.amazonaws.com
DOCKER_USERNAME=AWS
```

```bash
# Авторизация в Amazon ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-west-2.amazonaws.com
```

### Azure Container Registry

```env
DOCKER_REGISTRY=myregistry.azurecr.io
DOCKER_USERNAME=myregistry
```

```bash
# Авторизация в Azure Container Registry
az acr login --name myregistry
```

## 🔒 Безопасность

### Рекомендации для продакшена

1. **Используйте сильные пароли**
```env
POSTGRES_PASSWORD=very-secure-password-with-special-chars-123!
```

2. **Используйте конкретные версии образов**
```env
BACKEND_VERSION=v1.0.0
FRONTEND_VERSION=v1.0.0
```

3. **Ограничьте сетевой доступ**
```yaml
networks:
  app-network:
    driver: bridge
    internal: true  # Только внутренняя сеть
```

4. **Используйте secrets для паролей**
```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt
```

## 📊 Мониторинг и логирование

### Проверка состояния

```bash
# Статус всех сервисов
docker-compose -f docker-compose.prod.yml ps

# Health checks
docker-compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Использование ресурсов
docker stats
```

### Логи

```bash
# Все логи
docker-compose -f docker-compose.prod.yml logs

# Логи конкретного сервиса
docker-compose -f docker-compose.prod.yml logs -f backend

# Последние 100 строк логов
docker-compose -f docker-compose.prod.yml logs --tail=100
```

## 🚨 Troubleshooting

### Частые проблемы

#### 1. Ошибка авторизации в реестре
```bash
Error response from daemon: unauthorized: authentication required
```

**Решение:**
```bash
docker login
# или для других реестров
docker login your-registry.com
```

#### 2. Образ не найден
```bash
Error response from daemon: pull access denied for username/image
```

**Решение:**
- Проверьте правильность `DOCKER_USERNAME` в `.env.prod`
- Убедитесь, что образы опубликованы: `docker search username/devops`

#### 3. Порты заняты
```bash
Error starting userland proxy: listen tcp 0.0.0.0:8080: bind: address already in use
```

**Решение:**
```bash
# Найти процесс, использующий порт
lsof -i :8080

# Изменить порт в .env.prod
BACKEND_PORT=8081
```

#### 4. Проблемы с базой данных
```bash
# Проверить подключение к БД
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "SELECT version();"

# Пересоздать volume с данными
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

## 🔄 CI/CD интеграция

### GitHub Actions

```yaml
name: Build and Deploy
on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        run: |
          export DOCKER_USERNAME=${{ secrets.DOCKER_USERNAME }}
          ./build-and-push.sh ${GITHUB_REF#refs/tags/}
```

### GitLab CI

```yaml
stages:
  - build
  - deploy

build:
  stage: build
  script:
    - docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
    - ./build-and-push.sh $CI_COMMIT_TAG

deploy:
  stage: deploy
  script:
    - ./deploy.sh prod
  only:
    - tags
```

## 📚 Дополнительные ресурсы

- [Docker Hub документация](https://docs.docker.com/docker-hub/)
- [Docker Compose документация](https://docs.docker.com/compose/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Amazon ECR документация](https://docs.aws.amazon.com/ecr/)
- [Azure Container Registry](https://docs.microsoft.com/en-us/azure/container-registry/)

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose -f docker-compose.prod.yml logs -f`
2. Проверьте статус сервисов: `docker-compose -f docker-compose.prod.yml ps`
3. Убедитесь в правильности переменных окружения в `.env.prod`
4. Проверьте доступность образов в реестре
5. Убедитесь в корректности авторизации в Docker реестре

---

**Примечание:** Замените `your-dockerhub-username` на ваш реальный username в Docker Hub или другом реестре.