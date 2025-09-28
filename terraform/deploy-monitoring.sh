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

# Проверяем логи Prometheus на наличие ошибок прав доступа
echo "🔍 Проверяем корректность запуска Prometheus..."

# Проверяем события на Multi-Attach ошибки
if kubectl get events -n monitoring --field-selector reason=FailedAttachVolume | grep -q "Multi-Attach error"; then
    echo "🔧 Обнаружена проблема Multi-Attach, исправляем..."
    kubectl delete pod -l app=prometheus -n monitoring --force --grace-period=0
    sleep 10
    kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s
fi

PROMETHEUS_POD=$(kubectl get pods -n monitoring -l app=prometheus -o jsonpath='{.items[0].metadata.name}')
if [ ! -z "$PROMETHEUS_POD" ]; then
    echo "  - Проверяем логи Prometheus на ошибки..."
    if kubectl logs -n monitoring $PROMETHEUS_POD --tail=50 | grep -q "permission denied"; then
        echo "⚠️  Обнаружены ошибки прав доступа в Prometheus"
        echo "  - Перезапускаем Prometheus для применения SecurityContext..."
        kubectl rollout restart deployment/prometheus -n monitoring
        kubectl rollout status deployment/prometheus -n monitoring --timeout=300s
        echo "✅ Prometheus перезапущен с исправленными правами"
    else
        echo "✅ Prometheus запущен корректно без ошибок прав доступа"
    fi
fi

echo "  - Ожидаем готовности Grafana..."

# Проверяем события на Multi-Attach ошибки для Grafana
if kubectl get events -n monitoring --field-selector reason=FailedAttachVolume | grep -q "grafana.*Multi-Attach error"; then
    echo "🔧 Обнаружена проблема Multi-Attach для Grafana, исправляем..."
    kubectl delete pod -l app=grafana -n monitoring --force --grace-period=0
    sleep 10
fi

kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s

# Проверяем логи Grafana на наличие ошибок прав доступа
GRAFANA_POD=$(kubectl get pods -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}')
if [ ! -z "$GRAFANA_POD" ]; then
    echo "  - Проверяем логи Grafana на ошибки..."
    if kubectl logs -n monitoring $GRAFANA_POD --tail=50 | grep -q "Permission denied\|not writable\|can't create directory"; then
        echo "⚠️  Обнаружены ошибки прав доступа в Grafana"
        echo "  - Перезапускаем Grafana для применения SecurityContext..."
        kubectl rollout restart deployment/grafana -n monitoring
        kubectl rollout status deployment/grafana -n monitoring --timeout=300s
        echo "✅ Grafana перезапущена с исправленными правами"
    else
        echo "✅ Grafana запущена корректно без ошибок прав доступа"
    fi
fi

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

# Получаем информацию о доступе к Grafana
echo "🌐 Настройка доступа к Grafana..."

# Получаем IP узлов кластера
NODE_IPS=$(kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="ExternalIP")].address}')
if [ -z "$NODE_IPS" ]; then
    NODE_IPS=$(kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="InternalIP")].address}')
fi

echo ""
echo "🎉 Система мониторинга успешно развернута!"
echo ""
echo "📊 Доступ к сервисам:"
echo ""
echo "=== GRAFANA ==="
if [ ! -z "$NODE_IPS" ]; then
    for NODE_IP in $NODE_IPS; do
        echo "  NodePort: http://$NODE_IP:32000"
    done
else
    echo "  NodePort: http://NODE-IP:32000 (замените NODE-IP на IP узла кластера)"
fi
echo "  Port-forward: kubectl port-forward -n monitoring svc/grafana 3000:3000"
echo "  Затем откройте: http://localhost:3000"
echo ""
echo "=== PROMETHEUS ==="
echo "  Port-forward: kubectl port-forward -n monitoring svc/prometheus 9090:9090"
echo "  Затем откройте: http://localhost:9090"
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

# Финальная проверка работоспособности Prometheus
echo "🔧 Выполняем финальную проверку Prometheus..."
PROMETHEUS_POD=$(kubectl get pods -n monitoring -l app=prometheus -o jsonpath='{.items[0].metadata.name}')
if [ ! -z "$PROMETHEUS_POD" ]; then
    # Проверяем отсутствие ошибок в логах
    if kubectl logs -n monitoring $PROMETHEUS_POD --tail=20 | grep -q "permission denied\|panic\|Unable to create"; then
        echo "⚠️  Обнаружены ошибки в Prometheus. Проверьте логи:"
        echo "  kubectl logs -n monitoring $PROMETHEUS_POD"
    else
        echo "✅ Prometheus работает корректно без ошибок прав доступа"
    fi
    
    # Проверяем доступность API
    echo "  - Проверяем доступность Prometheus API..."
    kubectl port-forward -n monitoring svc/prometheus 9090:9090 &
    PORT_FORWARD_PID=$!
    sleep 5
    
    if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
        echo "✅ Prometheus API доступен и работает"
    else
        echo "⚠️  Prometheus API недоступен"
    fi
    
    # Останавливаем port-forward
    kill $PORT_FORWARD_PID 2>/dev/null || true
    sleep 2
fi

echo ""
echo "✨ Мониторинг готов к использованию!"
echo ""
echo "📋 Полезные команды для управления:"
echo ""
echo "=== ПРОВЕРКА СТАТУСА ==="
echo "  kubectl get pods -n monitoring"
echo "  kubectl get svc -n monitoring"
echo ""
echo "=== ПОЛУЧИТЬ IP УЗЛОВ ==="
echo "  kubectl get nodes -o wide"
echo ""
echo "=== БЫСТРЫЙ ДОСТУП К GRAFANA ==="
echo "  kubectl port-forward -n monitoring svc/grafana 3000:3000"
echo "  # Затем откройте: http://localhost:3000"
echo ""
echo "=== БЫСТРЫЙ ДОСТУП К PROMETHEUS ==="
echo "  kubectl port-forward -n monitoring svc/prometheus 9090:9090"
echo "  # Затем откройте: http://localhost:9090"
echo ""
echo "=== ИСПРАВЛЕНИЕ ПРОБЛЕМ ==="
echo "  ./fix-prometheus-permissions.sh"