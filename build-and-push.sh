#!/bin/bash

# Скрипт для сборки и публикации мультиплатформенных Docker образов в облачный реестр
# Поддерживает сборку для AMD64 и ARM64 платформ
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

# Проверка наличия Docker buildx
if ! docker buildx version &> /dev/null; then
    error "Docker buildx недоступен. Обновите Docker до версии 19.03 или выше"
    exit 1
fi

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
log "Целевая платформа: linux/amd64"

# Настройка Docker buildx для мультиплатформенной сборки
setup_buildx() {
    log "Настройка Docker buildx для мультиплатформенной сборки..."
    
    # Создаем новый builder если не существует
    if ! docker buildx ls | grep -q "multiarch-builder"; then
        log "Создание нового buildx builder для мультиплатформенной сборки..."
        docker buildx create --name multiarch-builder --driver docker-container --use
        docker buildx inspect --bootstrap
    else
        log "Используем существующий buildx builder..."
        docker buildx use multiarch-builder
    fi
    
    success "Docker buildx настроен для мультиплатформенной сборки"
}

# Проверка авторизации в Docker Hub
check_docker_auth() {
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
}

# Сборка образа для AMD64 платформы
build_amd64_image() {
    local service=$1
    local context=$2
    
    log "Сборка образа для $service (AMD64)..."
    
    # Определяем платформу для сборки
    PLATFORM="linux/amd64"
    
    # Сборка и публикация образа
    docker buildx build \
        --platform $PLATFORM \
        --tag $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-$service:$VERSION \
        --tag $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-$service:latest \
        --push \
        $context
    
    success "Образ $service успешно собран для платформы: $PLATFORM"
}

# Настройка buildx
setup_buildx

# Проверка авторизации
check_docker_auth

# Сборка Backend образа
build_amd64_image "backend" "./backend"

# Сборка Frontend образа
build_amd64_image "frontend" "./frontend"

# Вывод информации об образах
log "Информация о созданных образах:"
echo "Backend:"
echo "  - $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:$VERSION (linux/amd64)"
echo "  - $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:latest (linux/amd64)"
echo "Frontend:"
echo "  - $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:$VERSION (linux/amd64)"
echo "  - $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:latest (linux/amd64)"

success "Все образы успешно собраны и опубликованы для AMD64 платформы!"

# Очистка buildx кэша (опционально)
read -p "Очистить buildx кэш для экономии места? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Очистка buildx кэша..."
    docker buildx prune -f
    success "Buildx кэш очищен"
fi

log "Для локального развертывания используйте:"
echo "  docker-compose up -d"
log "Для развертывания в облаке используйте:"
echo "  docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d"