#!/bin/bash

# Главный скрипт для полного развертывания DevOps приложения
# Собирает образы, загружает в Docker Hub и разворачивает в Kubernetes

set -e

echo "🚀 Полное развертывание DevOps приложения"
echo "=========================================="

# Проверяем наличие необходимых инструментов
echo "📋 Проверяем наличие необходимых инструментов..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker не найден. Установите Docker."
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform не найден. Установите Terraform."
    exit 1
fi

if ! command -v yc &> /dev/null; then
    echo "❌ Yandex Cloud CLI не найден. Установите yc CLI."
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl не найден. Установите kubectl."
    exit 1
fi

echo "✅ Все необходимые инструменты найдены"

# Проверяем авторизацию в Docker Hub
echo ""
echo "🔐 Проверяем авторизацию в Docker Hub..."
if ! docker info | grep -q "Username"; then
    echo "⚠️  Не авторизованы в Docker Hub. Выполните: docker login"
    read -p "Продолжить без проверки авторизации? (y/n): " continue_without_auth
    if [[ $continue_without_auth != "y" && $continue_without_auth != "Y" ]]; then
        echo "❌ Развертывание отменено"
        exit 1
    fi
else
    echo "✅ Авторизация в Docker Hub подтверждена"
fi

# Сборка и загрузка образов
echo ""
echo "📦 Сборка и загрузка образов в Docker Hub..."

# Сборка backend
echo "🔨 Сборка backend образа..."
cd backend
docker build -t utsx/devops-backend:latest .
echo "📤 Загрузка backend образа в Docker Hub..."
docker push utsx/devops-backend:latest
cd ..

# Сборка frontend
echo "🔨 Сборка frontend образа..."
cd frontend
docker build -t utsx/devops-frontend:latest .
echo "📤 Загрузка frontend образа в Docker Hub..."
docker push utsx/devops-frontend:latest
cd ..

echo "✅ Образы успешно собраны и загружены в Docker Hub"

# Переходим в директорию terraform и запускаем развертывание
echo ""
echo "🚀 Запуск развертывания Kubernetes кластера и приложений..."
cd terraform

# Проверяем наличие terraform.tfvars
if [ ! -f "terraform.tfvars" ]; then
    echo "⚠️  Файл terraform.tfvars не найден"
    echo "📋 Создайте файл terraform.tfvars на основе terraform.tfvars.example:"
    echo "   cp terraform.tfvars.example terraform.tfvars"
    echo "   # Отредактируйте terraform.tfvars с вашими параметрами"
    echo ""
    read -p "Продолжить развертывание? (y/n): " continue_deploy
    if [[ $continue_deploy != "y" && $continue_deploy != "Y" ]]; then
        echo "❌ Развертывание отменено"
        exit 1
    fi
fi

# Запускаем развертывание
./deploy.sh

echo ""
echo "🎉 Полное развертывание завершено!"
echo ""
echo "📋 Что было развернуто:"
echo "  ✅ Backend образ собран и загружен в Docker Hub"
echo "  ✅ Frontend образ собран и загружен в Docker Hub"
echo "  ✅ Kubernetes кластер создан в Yandex Cloud"
echo "  ✅ PostgreSQL база данных развернута"
echo "  ✅ Backend и Frontend приложения развернуты"
echo "  ✅ Система мониторинга (Prometheus + Grafana) развернута"
echo "  ✅ Расширенные дашборды Grafana настроены"
echo "  ✅ HTTP метрики сгенерированы тестовым трафиком"
echo "  ✅ Metrics Server для сбора метрик ресурсов развернут"
echo "  ✅ HorizontalPodAutoscaler (HPA) для автомасштабирования настроен"
echo "  ✅ Автомасштабирование при 15% CPU / 70% Memory активировано"
echo "  ✅ CPU мониторинг в Grafana настроен и работает"
echo "  ✅ cAdvisor метрики контейнеров доступны"
echo "  ✅ Readiness probe исправлен для стабильной работы подов"
echo ""
echo "🌐 Доступ к приложению и мониторингу см. выше ⬆️"
echo ""
echo "📋 Полезные команды:"
echo "  cd terraform && kubectl get pods -n devops-app     # Статус приложения"
echo "  cd terraform && kubectl get pods -n monitoring     # Статус мониторинга"
echo "  cd terraform && ./validate-metrics.sh              # Проверка метрик"
echo "  cd terraform && ./update-images.sh                 # Обновление образов"
echo ""
echo "🔄 Автомасштабирование:"
echo "  kubectl get hpa -n devops-app                      # Статус HPA"
echo "  kubectl describe hpa devops-backend-hpa -n devops-app  # Подробная информация HPA"
echo "  kubectl top pods -n devops-app                     # Метрики подов"
echo "  ./check-hpa-status.sh                              # Быстрая проверка статуса HPA"
echo "  ./test-autoscaling.sh                              # Полное тестирование автомасштабирования"
echo "  ./force-scale-down-test.sh                         # Тестирование масштабирования вниз"
echo "  watch kubectl get hpa devops-backend-hpa -n devops-app # Мониторинг HPA в реальном времени"
echo ""
echo "🔧 Для удаления всех ресурсов:"
echo "  cd terraform && terraform destroy"