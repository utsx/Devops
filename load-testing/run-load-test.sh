#!/bin/bash

# Скрипт для запуска нагрузочного тестирования с мониторингом HPA
# Использует Yandex.Tank для генерации нагрузки

set -e

echo "🚀 Запуск нагрузочного тестирования с мониторингом автомасштабирования"
echo "=================================================================="

# Проверяем наличие yandex-tank
if ! command -v yandex-tank &> /dev/null; then
    echo "❌ Yandex.Tank не найден."
    echo "📋 Установите Yandex.Tank:"
    echo "   pip install yandextank"
    echo "   # или"
    echo "   docker pull yandex/yandex-tank"
    exit 1
fi

# Проверяем наличие kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl не найден. Установите kubectl для мониторинга HPA."
    exit 1
fi

# Проверяем доступность приложения
APP_URL="http://89.169.142.28:32757"
echo "🔍 Проверка доступности приложения: $APP_URL"

if ! curl -s -o /dev/null -w "%{http_code}" "$APP_URL/actuator/health" | grep -q "200"; then
    echo "⚠️  Приложение недоступно. Проверьте что Kubernetes кластер запущен."
    echo "📋 Для запуска: cd terraform && ./deploy.sh"
    exit 1
fi

echo "✅ Приложение доступно"

# Получаем текущее состояние HPA
echo ""
echo "📊 Текущее состояние HPA перед тестированием:"
cd ../terraform
kubectl get hpa -n devops-app -o wide
kubectl get pods -n devops-app -l app=devops-backend

echo ""
echo "🎯 Запускаем мониторинг HPA в фоновом режиме..."

# Запускаем мониторинг HPA в фоне
(
    echo "Time,CPU%,Memory%,Replicas" > hpa_monitoring.csv
    while true; do
        TIMESTAMP=$(date '+%H:%M:%S')
        HPA_DATA=$(kubectl get hpa devops-backend-hpa -n devops-app -o jsonpath='{.status.currentMetrics[0].resource.current.averageUtilization},{.status.currentMetrics[1].resource.current.averageUtilization},{.status.currentReplicas}' 2>/dev/null || echo "0,0,1")
        echo "$TIMESTAMP,$HPA_DATA" >> hpa_monitoring.csv
        echo "[$TIMESTAMP] HPA: CPU=${HPA_DATA%,*}%, Memory=${HPA_DATA#*,}, Replicas=${HPA_DATA##*,}"
        sleep 10
    done
) &

MONITOR_PID=$!

# Переходим в директорию load-testing
cd ../load-testing

echo ""
echo "🚀 Запуск Yandex.Tank..."
echo "📋 Профиль нагрузки:"
echo "   - 0-5мин: плавное увеличение с 1 до 50 RPS"
echo "   - 5-10мин: постоянная нагрузка 50 RPS"  
echo "   - 10-13мин: увеличение до 100 RPS"
echo "   - 13-15мин: максимальная нагрузка 100 RPS"
echo ""
echo "🌐 Web-интерфейс Tank: http://localhost:8080"
echo ""

# Запуск yandex-tank
if command -v docker &> /dev/null; then
    echo "🐳 Запуск через Docker..."
    docker run -v $(pwd):/var/loadtest -v $(pwd)/scenarios:/var/loadtest/scenarios --net host -it yandex/yandex-tank
else
    echo "💻 Запуск напрямую..."
    yandex-tank load.yaml
fi

# Останавливаем мониторинг
echo ""
echo "🛑 Останавливаем мониторинг..."
kill $MONITOR_PID 2>/dev/null || true

# Финальная проверка состояния
cd ../terraform
echo ""
echo "📊 Финальное состояние HPA после тестирования:"
kubectl get hpa -n devops-app -o wide
kubectl get pods -n devops-app -l app=devops-backend

echo ""
echo "📈 Результаты мониторинга сохранены в: terraform/hpa_monitoring.csv"
echo "📊 Результаты Tank сохранены в: load-testing/"

echo ""
echo "🎉 Нагрузочное тестирование завершено!"
