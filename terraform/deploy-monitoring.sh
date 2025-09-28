#!/bin/bash

# Скрипт для развертывания системы мониторинга в Kubernetes кластере

set -e

echo "🚀 Начинаем развертывание системы мониторинга..."

# Проверяем подключение к кластеру
echo "📋 Проверяем подключение к Kubernetes кластеру..."
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Ошибка: Нет подключения к Kubernetes кластеру"
    echo "Убедитесь, что kubectl настроен и кластер доступен"
    exit 1
fi

echo "✅ Подключение к кластеру установлено"

# Применяем манифесты мониторинга
echo "📦 Применяем манифесты системы мониторинга..."
kubectl apply -f monitoring-manifests.yaml

# Ждем готовности подов
echo "⏳ Ожидаем готовности компонентов мониторинга..."

echo "  - Ожидаем готовности Prometheus..."
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s

echo "  - Ожидаем готовности Grafana..."
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s

# Получаем информацию о сервисах
echo "📊 Информация о развернутых сервисах:"
echo ""
echo "=== PROMETHEUS ==="
kubectl get svc prometheus -n monitoring
echo ""
echo "=== GRAFANA ==="
kubectl get svc grafana -n monitoring
kubectl get svc grafana-external -n monitoring
echo ""

# Получаем внешний IP для Grafana
echo "🌐 Получаем внешний доступ к Grafana..."
EXTERNAL_IP=""
while [ -z $EXTERNAL_IP ]; do
    echo "Ожидаем назначения внешнего IP..."
    EXTERNAL_IP=$(kubectl get svc grafana-external -n monitoring --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}")
    [ -z "$EXTERNAL_IP" ] && sleep 10
done

echo ""
echo "🎉 Система мониторинга успешно развернута!"
echo ""
echo "📊 Доступ к сервисам:"
echo "  Grafana (внешний): http://$EXTERNAL_IP:3000"
echo "  Grafana (внутренний): http://grafana.monitoring.svc.cluster.local:3000"
echo "  Prometheus (внутренний): http://prometheus.monitoring.svc.cluster.local:9090"
echo ""
echo "🔐 Учетные данные Grafana:"
echo "  Пользователь: admin"
echo "  Пароль: admin123"
echo ""
echo "📈 Доступные дашборды:"
echo "  - DevOps Application Monitoring (метрики приложения)"
echo "  - Kubernetes Infrastructure Monitoring (метрики инфраструктуры)"
echo ""
echo "🔍 Для просмотра логов компонентов используйте:"
echo "  kubectl logs -f deployment/prometheus -n monitoring"
echo "  kubectl logs -f deployment/grafana -n monitoring"
echo ""
echo "✨ Мониторинг готов к использованию!"