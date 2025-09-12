#!/bin/bash

# Скрипт для развертывания приложения из облачного реестра
# Использование: ./deploy.sh [environment]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    error "Docker не установлен или недоступен"
    exit 1
fi

# Проверка наличия docker-compose
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose не установлен или недоступен"
    exit 1
fi

# Определение окружения
ENVIRONMENT=${1:-prod}
ENV_FILE=".env.${ENVIRONMENT}"
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

log "Развертывание в окружении: $ENVIRONMENT"

# Проверка наличия файлов конфигурации
if [ ! -f "$ENV_FILE" ]; then
    error "Файл окружения $ENV_FILE не найден"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    error "Файл docker-compose $COMPOSE_FILE не найден"
    exit 1
fi

# Загрузка переменных окружения
log "Загрузка переменных окружения из $ENV_FILE"
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Проверка обязательных переменных
if [ -z "$DOCKER_USERNAME" ]; then
    error "Переменная DOCKER_USERNAME не установлена в $ENV_FILE"
    exit 1
fi

log "Docker Registry: ${DOCKER_REGISTRY:-docker.io}"
log "Docker Username: $DOCKER_USERNAME"
log "Backend Version: ${BACKEND_VERSION:-latest}"
log "Frontend Version: ${FRONTEND_VERSION:-latest}"

# Остановка существующих контейнеров
log "Остановка существующих контейнеров..."
docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE down || true

# Получение последних образов
log "Получение последних образов из реестра..."
docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE pull

# Запуск сервисов
log "Запуск сервисов..."
docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d

# Ожидание готовности сервисов
log "Ожидание готовности сервисов..."
sleep 10

# Проверка статуса сервисов
log "Проверка статуса сервисов..."
docker-compose -f $COMPOSE_FILE ps

# Проверка health checks
log "Проверка health checks..."
for i in {1..30}; do
    if docker-compose -f $COMPOSE_FILE ps | grep -q "healthy"; then
        success "Сервисы готовы к работе!"
        break
    fi
    if [ $i -eq 30 ]; then
        warning "Не все сервисы прошли health check за отведенное время"
        docker-compose -f $COMPOSE_FILE logs --tail=50
    fi
    sleep 5
done

# Вывод информации о доступе
log "Приложение развернуто и доступно по адресам:"
echo "  Frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo "  Backend API: http://localhost:${BACKEND_PORT:-8080}"
echo "  Database: localhost:${POSTGRES_PORT:-5432}"

# Полезные команды
log "Полезные команды для управления:"
echo "  Просмотр логов: docker-compose -f $COMPOSE_FILE logs -f"
echo "  Остановка: docker-compose -f $COMPOSE_FILE down"
echo "  Перезапуск: docker-compose -f $COMPOSE_FILE restart"
echo "  Статус: docker-compose -f $COMPOSE_FILE ps"

success "Развертывание завершено успешно!"