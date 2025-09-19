#!/bin/bash

# Скрипт для сборки и публикации Docker образов в облачный реестр
# Использование: ./build-and-push.sh [version]

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

# Настройка Docker buildx для мультиплатформенной сборки
setup_buildx() {
    log "Настройка Docker buildx для мультиплатформенной сборки..."
    
    # Проверяем, доступен ли buildx
    if ! docker buildx version &> /dev/null; then
        error "Docker buildx недоступен. Обновите Docker до версии 19.03 или выше"
        exit 1
    fi
    
    # Создаем новый builder если не существует
    if ! docker buildx ls | grep -q "multiarch"; then
        log "Создание нового buildx builder..."
        docker buildx create --name multiarch --driver docker-container --use
        docker buildx inspect --bootstrap
    else
        log "Используем существующий buildx builder..."
        docker buildx use multiarch
    fi
    
    success "Docker buildx настроен"
}

# Загрузка переменных окружения
if [ -f .env.prod ]; then
    log "Загрузка переменных окружения из .env.prod"
    set -a  # автоматически экспортировать все переменные
    source .env.prod
    set +a  # отключить автоматический экспорт
else
    warning "Файл .env.prod не найден, используются значения по умолчанию"
fi

# Установка версии
VERSION=${1:-latest}
BACKEND_VERSION=${VERSION}
FRONTEND_VERSION=${VERSION}
DOCKER_USERNAME=${DOCKER_USERNAME:-your-dockerhub-username}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-docker.io}

# Проверка корректности загрузки переменных
if [ "$DOCKER_USERNAME" = "your-dockerhub-username" ]; then
    error "DOCKER_USERNAME не установлен! Проверьте файл .env.prod"
    exit 1
fi

log "Версия образов: $VERSION"
log "Docker Registry: $DOCKER_REGISTRY"
log "Docker Username: $DOCKER_USERNAME"

# Проверка авторизации в Docker Hub
log "Проверка авторизации в Docker Registry..."
if ! docker info | grep -q "Username"; then
    warning "Не авторизованы в Docker Registry. Выполните: docker login"
    read -p "Хотите авторизоваться сейчас? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker login $DOCKER_REGISTRY
    else
        error "Авторизация необходима для публикации образов"
        exit 1
    fi
fi

# Настройка buildx
setup_buildx

# Определяем платформы для сборки
PLATFORMS="linux/amd64,linux/arm64"
log "Целевые платформы: $PLATFORMS"

# Сборка и публикация Backend образа
log "Сборка и публикация Backend образа для мультиплатформ..."
docker buildx build \
    --platform $PLATFORMS \
    --tag $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:$VERSION \
    --tag $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:latest \
    --push \
    ./backend

# Сборка и публикация Frontend образа
log "Сборка и публикация Frontend образа для мультиплатформ..."
docker buildx build \
    --platform $PLATFORMS \
    --tag $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:$VERSION \
    --tag $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:latest \
    --push \
    ./frontend

# Вывод информации об образах
log "Информация о созданных образах:"
echo "Backend:"
echo "  - $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:$VERSION"
echo "  - $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:latest"
echo "Frontend:"
echo "  - $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:$VERSION"
echo "  - $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:latest"

success "Все образы успешно собраны и опубликованы!"

# Очистка buildx кэша (опционально)
read -p "Очистить buildx кэш для экономии места? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Очистка buildx кэша..."
    docker buildx prune -f
    success "Buildx кэш очищен"
fi

log "Для развертывания используйте:"
echo "  docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d"