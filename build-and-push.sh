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

# Сборка Backend образа
log "Сборка Backend образа..."
docker build -t $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:$VERSION ./backend
docker tag $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:$VERSION $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:latest

# Сборка Frontend образа
log "Сборка Frontend образа..."
docker build -t $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:$VERSION ./frontend
docker tag $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:$VERSION $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:latest

# Публикация образов
log "Публикация Backend образа..."
docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:$VERSION
docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:latest

log "Публикация Frontend образа..."
docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:$VERSION
docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:latest

# Вывод информации об образах
log "Информация о созданных образах:"
echo "Backend:"
echo "  - $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:$VERSION"
echo "  - $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:latest"
echo "Frontend:"
echo "  - $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:$VERSION"
echo "  - $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:latest"

success "Все образы успешно собраны и опубликованы!"

# Очистка локальных образов (опционально)
read -p "Удалить локальные образы для экономии места? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Удаление локальных образов..."
    docker rmi $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:$VERSION || true
    docker rmi $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-backend:latest || true
    docker rmi $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:$VERSION || true
    docker rmi $DOCKER_REGISTRY/$DOCKER_USERNAME/devops-frontend:latest || true
    success "Локальные образы удалены"
fi

log "Для развертывания используйте:"
echo "  docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d"