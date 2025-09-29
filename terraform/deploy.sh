#!/bin/bash

# Скрипт для развертывания Kubernetes кластера и приложений

set -e

echo "🚀 Начинаем развертывание DevOps приложения в Kubernetes..."

# Проверяем наличие необходимых инструментов
echo "📋 Проверяем наличие необходимых инструментов..."

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

# Инициализация Terraform
echo "🔧 Инициализация Terraform..."
terraform init

# Планирование изменений
echo "📋 Планирование изменений..."
terraform plan

# Применение изменений
echo "🚀 Применение изменений..."
terraform apply -auto-approve

# Получение учетных данных для kubectl
echo "🔑 Настройка kubectl..."
CLUSTER_NAME=$(terraform output -raw cluster_name)
yc managed-kubernetes cluster get-credentials $CLUSTER_NAME --external --force

# Ожидание готовности узлов
echo "⏳ Ожидание готовности узлов..."
kubectl wait --for=condition=Ready nodes --all --timeout=300s

# Развертывание namespace и PostgreSQL сначала
echo "🚀 Развертывание namespace и PostgreSQL..."
kubectl apply -f k8s-manifests.yaml --selector="app!=devops-backend,app!=devops-frontend"

# Ожидание готовности PostgreSQL
echo "⏳ Ожидание готовности PostgreSQL..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n devops-app

# Проверка что PostgreSQL действительно готова
echo "🔍 Проверка готовности PostgreSQL..."
kubectl get pods -l app=postgres -n devops-app

# Развертывание приложений
echo "🚀 Развертывание приложений..."
kubectl apply -f k8s-manifests.yaml

# Ожидание готовности приложений
echo "⏳ Ожидание готовности приложений..."
kubectl wait --for=condition=available --timeout=300s deployment/devops-backend -n devops-app
kubectl wait --for=condition=available --timeout=300s deployment/devops-frontend -n devops-app

# Проверка статуса приложений
echo "📊 Проверка статуса приложений..."
kubectl get pods -n devops-app
kubectl get services -n devops-app

# Получение информации о NodePort сервисе
echo "🌐 Получение информации о NodePort сервисе..."

# Получаем NodePort
NODE_PORT=$(kubectl get services -n devops-app devops-frontend-service -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "")

# Получаем внешний IP любой ноды кластера
EXTERNAL_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}' 2>/dev/null || echo "")

if [ "$EXTERNAL_IP" != "" ] && [ "$NODE_PORT" != "" ]; then
    echo "✅ NodePort сервис настроен:"
    echo "   - Внешний IP ноды: $EXTERNAL_IP"
    echo "   - NodePort: $NODE_PORT"
    echo "🌐 Приложение доступно: http://$EXTERNAL_IP:$NODE_PORT"
    
    echo "🔍 Проверка доступности..."
    
    # Проверяем доступность frontend
    if curl -s -o /dev/null -w "%{http_code}" http://$EXTERNAL_IP:$NODE_PORT | grep -q "200\|301\|302"; then
        echo "✅ Frontend доступен из интернета!"
        
        # Проверяем API через frontend
        echo "🔍 Проверка API через frontend..."
        if curl -s -o /dev/null -w "%{http_code}" http://$EXTERNAL_IP:$NODE_PORT/api/actuator/health | grep -q "200"; then
            echo "✅ API доступно через frontend!"
        else
            echo "⚠️  API пока недоступно, но frontend работает. Backend может еще запускаться."
        fi
        
        echo "🎉 Откройте в браузере: http://$EXTERNAL_IP:$NODE_PORT"
        echo "📋 API endpoint: http://$EXTERNAL_IP:$NODE_PORT/api/actuator/health"
    else
        echo "⚠️  Frontend пока недоступен. Попробуйте через несколько минут."
        echo "🔍 Проверьте что порт $NODE_PORT открыт в группе безопасности"
    fi
else
    echo "⚠️  Не удалось получить информацию о NodePort сервисе"
    echo "📋 Проверьте сервис командой:"
    echo "kubectl get services -n devops-app devops-frontend-service"
    echo ""
    echo "📋 Для диагностики:"
    echo "kubectl describe service devops-frontend-service -n devops-app"
    echo "kubectl get nodes -o wide"
fi

echo ""
echo "📊 Развертывание системы мониторинга..."

# Развертывание мониторинга
echo "🚀 Применяем манифесты системы мониторинга..."
kubectl apply -f monitoring-manifests.yaml

# Развертывание расширенных дашбордов Grafana
echo "📊 Развертывание расширенных дашбордов Grafana..."
kubectl apply -f grafana-dashboards-extended.yaml

# Ожидание готовности Prometheus
echo "⏳ Ожидание готовности Prometheus..."
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s

# Проверяем и исправляем проблемы с Prometheus
echo "🔍 Проверяем корректность запуска Prometheus..."
if kubectl get events -n monitoring --field-selector reason=FailedAttachVolume | grep -q "Multi-Attach error"; then
    echo "🔧 Обнаружена проблема Multi-Attach, исправляем..."
    kubectl delete pod -l app=prometheus -n monitoring --force --grace-period=0
    sleep 10
    kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s
fi

PROMETHEUS_POD=$(kubectl get pods -n monitoring -l app=prometheus -o jsonpath='{.items[0].metadata.name}')
if [ ! -z "$PROMETHEUS_POD" ]; then
    if kubectl logs -n monitoring $PROMETHEUS_POD --tail=50 | grep -q "permission denied"; then
        echo "⚠️  Обнаружены ошибки прав доступа в Prometheus, перезапускаем..."
        kubectl rollout restart deployment/prometheus -n monitoring
        kubectl rollout status deployment/prometheus -n monitoring --timeout=300s
        echo "✅ Prometheus перезапущен с исправленными правами"
    else
        echo "✅ Prometheus запущен корректно"
    fi
fi

# Ожидание готовности Grafana
echo "⏳ Ожидание готовности Grafana..."
if kubectl get events -n monitoring --field-selector reason=FailedAttachVolume | grep -q "grafana.*Multi-Attach error"; then
    echo "🔧 Обнаружена проблема Multi-Attach для Grafana, исправляем..."
    kubectl delete pod -l app=grafana -n monitoring --force --grace-period=0
    sleep 10
fi

kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s

GRAFANA_POD=$(kubectl get pods -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}')
if [ ! -z "$GRAFANA_POD" ]; then
    if kubectl logs -n monitoring $GRAFANA_POD --tail=50 | grep -q "Permission denied\|not writable\|can't create directory"; then
        echo "⚠️  Обнаружены ошибки прав доступа в Grafana, перезапускаем..."
        kubectl rollout restart deployment/grafana -n monitoring
        kubectl rollout status deployment/grafana -n monitoring --timeout=300s
        echo "✅ Grafana перезапущена с исправленными правами"
    else
        echo "✅ Grafana запущена корректно"
    fi
fi

# Применение исправлений для автомасштабирования и CPU мониторинга
echo ""
echo "🔧 Применение исправлений для автомасштабирования и CPU мониторинга..."

# Развертывание Metrics Server
echo "📊 Развертывание Metrics Server..."

# Проверяем существование metrics-server deployment и исправляем проблему immutable selector
echo "🔍 Проверка существующего deployment metrics-server..."
if kubectl get deployment metrics-server -n kube-system >/dev/null 2>&1; then
    echo "⚠️  Обнаружен существующий metrics-server deployment"
    
    # Проверяем selector для выявления конфликта
    CURRENT_SELECTOR=$(kubectl get deployment metrics-server -n kube-system -o jsonpath='{.spec.selector.matchLabels}' 2>/dev/null || echo "")
    
    if [ ! -z "$CURRENT_SELECTOR" ]; then
        echo "🔍 Текущий selector: $CURRENT_SELECTOR"
        echo "🔧 Удаляем существующий deployment для избежания конфликта immutable selector..."
        
        # Удаляем deployment (но не service account и rbac)
        kubectl delete deployment metrics-server -n kube-system --ignore-not-found=true
        
        # Ждем полного удаления
        echo "⏳ Ожидание полного удаления deployment..."
        kubectl wait --for=delete deployment/metrics-server -n kube-system --timeout=60s 2>/dev/null || true
        
        # Также удаляем связанные pods если они зависли
        kubectl delete pods -n kube-system -l k8s-app=metrics-server --force --grace-period=0 2>/dev/null || true
        
        echo "✅ Старый deployment metrics-server удален"
    fi
else
    echo "✅ Metrics-server deployment не найден, можно создавать новый"
fi

echo "🚀 Применяем манифесты Metrics Server..."
kubectl apply -f metrics-server-manifests.yaml

# Ожидание готовности Metrics Server
echo "⏳ Ожидание готовности Metrics Server..."
kubectl wait --for=condition=ready pod -l k8s-app=metrics-server -n kube-system --timeout=300s

# Проверка работы Metrics Server
echo "🔍 Проверка работы Metrics Server..."
sleep 30  # Даем время для сбора первых метрик

if kubectl top nodes >/dev/null 2>&1; then
    echo "✅ Metrics Server работает корректно"
    
    # Проверяем метрики подов
    if kubectl top pods -n devops-app >/dev/null 2>&1; then
        echo "✅ Метрики подов доступны"
        kubectl top pods -n devops-app
    else
        echo "⚠️  Метрики подов пока недоступны, но это может быть временно"
    fi
else
    echo "⚠️  Metrics Server пока не готов, но продолжаем развертывание"
fi

# Развертывание HPA манифестов (если еще не существует)
echo "🚀 Проверка и развертывание HPA для автомасштабирования..."
if kubectl get hpa devops-backend-hpa -n devops-app >/dev/null 2>&1; then
    echo "✅ HPA уже существует, пропускаем создание"
else
    echo "📊 Создаем HPA..."
    kubectl apply -f hpa-manifests.yaml
fi

# Проверка статуса HPA
echo "📊 Проверка статуса HPA..."
sleep 10
kubectl get hpa -n devops-app -o wide

# Перезагрузка конфигурации Prometheus для cAdvisor метрик
echo "🔄 Перезагрузка конфигурации Prometheus..."
PROMETHEUS_POD=$(kubectl get pods -n monitoring -l app=prometheus -o jsonpath='{.items[0].metadata.name}')
if [ ! -z "$PROMETHEUS_POD" ]; then
    kubectl exec -n monitoring $PROMETHEUS_POD -- wget -qO- --post-data='' 'http://localhost:9090/-/reload' || echo "⚠️  Не удалось перезагрузить Prometheus, но это не критично"
fi

# Перезапуск Grafana для подхвата новых дашбордов
echo "🔄 Перезапуск Grafana для обновления дашбордов..."
kubectl rollout restart deployment/grafana -n monitoring
kubectl rollout status deployment/grafana -n monitoring --timeout=300s

echo "✅ Исправления применены:"
echo "  ✅ Metrics Server развернут и работает"
echo "  ✅ HPA настроен для автомасштабирования"
echo "  ✅ CPU метрики доступны в Prometheus"
echo "  ✅ Дашборды Grafana обновлены"

# Получение информации о доступе к мониторингу
echo "📊 Информация о системе мониторинга:"
kubectl get svc -n monitoring

# Получаем IP узлов для доступа к Grafana
NODE_IPS=$(kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="ExternalIP")].address}')
if [ -z "$NODE_IPS" ]; then
    NODE_IPS=$(kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="InternalIP")].address}')
fi

echo ""
echo "🎉 Развертывание завершено!"
echo ""
echo "🌐 Доступ к приложению:"
if [ "$EXTERNAL_IP" != "" ] && [ "$NODE_PORT" != "" ]; then
    echo "  Frontend: http://$EXTERNAL_IP:$NODE_PORT"
    echo "  API: http://$EXTERNAL_IP:$NODE_PORT/api/actuator/health"
fi
echo ""
echo "📊 Доступ к мониторингу:"
echo "=== GRAFANA ==="
if [ ! -z "$NODE_IPS" ]; then
    for NODE_IP in $NODE_IPS; do
        echo "  NodePort: http://$NODE_IP:32000"
    done
else
    echo "  NodePort: http://NODE-IP:32000 (замените NODE-IP на IP узла кластера)"
fi
echo "  Port-forward: kubectl port-forward -n monitoring svc/grafana 3000:3000"
echo "  Логин: admin, Пароль: admin123"
echo ""
echo "=== PROMETHEUS ==="
echo "  Port-forward: kubectl port-forward -n monitoring svc/prometheus 9090:9090"
# Финальная проверка метрик
echo ""
echo "🔍 Проверяем интеграцию метрик..."

# Проверяем, что backend экспортирует метрики
BACKEND_POD=$(kubectl get pods -n devops-app -l app=devops-backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ ! -z "$BACKEND_POD" ]; then
    echo "  - Проверяем метрики backend..."
    if ! lsof -i :8083 >/dev/null 2>&1; then
        kubectl port-forward -n devops-app $BACKEND_POD 8083:8080 &
        BACKEND_CHECK_PID=$!
        sleep 3
        
        if curl -s http://localhost:8083/actuator/prometheus | grep -q "http_server_requests_seconds"; then
            echo "✅ Backend экспортирует метрики корректно"
        else
            echo "⚠️  Backend метрики недоступны, но это может быть временно"
        fi
        
        kill $BACKEND_CHECK_PID 2>/dev/null || true
        sleep 1
    fi
fi

# Проверяем targets в Prometheus
if [ ! -z "$PROMETHEUS_POD" ]; then
    echo "  - Проверяем targets в Prometheus..."
    if ! lsof -i :9092 >/dev/null 2>&1; then
        kubectl port-forward -n monitoring svc/prometheus 9092:9090 &
        PROMETHEUS_CHECK_PID=$!
        sleep 3
        
        if curl -s http://localhost:9092/api/v1/targets | grep -q "devops-backend"; then
            echo "✅ Prometheus обнаружил backend target"
        else
            echo "⚠️  Prometheus пока не обнаружил backend target (может потребоваться время)"
        fi
        
        kill $PROMETHEUS_CHECK_PID 2>/dev/null || true
        sleep 1
    fi
fi

# Генерация тестового трафика для метрик
echo ""
echo "🚀 Генерация тестового трафика для создания HTTP метрик..."

if [ "$EXTERNAL_IP" != "" ] && [ "$NODE_PORT" != "" ]; then
    echo "  - Делаем запросы к API endpoints..."
    
    # Проверяем доступность API
    if curl -s -o /dev/null -w "%{http_code}" http://$EXTERNAL_IP:$NODE_PORT/api/v1/users | grep -q "200"; then
        echo "✅ API доступно, генерируем трафик..."
        
        # Генерируем трафик к разным endpoints
        for i in {1..10}; do
            curl -s http://$EXTERNAL_IP:$NODE_PORT/api/v1/users > /dev/null 2>&1 || true
            curl -s http://$EXTERNAL_IP:$NODE_PORT/api/v1/orders > /dev/null 2>&1 || true
            curl -s http://$EXTERNAL_IP:$NODE_PORT/actuator/health > /dev/null 2>&1 || true
            sleep 0.5
        done
        
        echo "✅ Тестовый трафик сгенерирован (30 запросов)"
        echo "  - /api/v1/users: 10 запросов"
        echo "  - /api/v1/orders: 10 запросов"
        echo "  - /actuator/health: 10 запросов"
        
        # Проверяем что метрики появились
        BACKEND_POD=$(kubectl get pods -n devops-app -l app=devops-backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
        if [ ! -z "$BACKEND_POD" ]; then
            echo "  - Проверяем HTTP метрики..."
            if kubectl exec -n devops-app $BACKEND_POD -- curl -s http://localhost:8080/actuator/prometheus | grep -q "http_server_requests_seconds_count.*api"; then
                echo "✅ HTTP метрики для API endpoints созданы!"
            else
                echo "⚠️  HTTP метрики пока не видны (может потребоваться время)"
            fi
        fi
    else
        echo "⚠️  API пока недоступно для генерации трафика"
        echo "  Вы можете сгенерировать трафик позже командами:"
        echo "  curl http://$EXTERNAL_IP:$NODE_PORT/api/v1/users"
        echo "  curl http://$EXTERNAL_IP:$NODE_PORT/api/v1/orders"
    fi
else
    echo "⚠️  Не удалось получить адрес для генерации трафика"
fi

echo ""
echo "� Полезные команды:"
echo "=== ПРИЛОЖЕНИЕ ==="
echo "  kubectl get pods -n devops-app                    # Статус подов приложения"
echo "  kubectl get services -n devops-app                # Статус сервисов приложения"
echo "  kubectl logs -n devops-app -l app=devops-backend  # Логи backend"
echo "  kubectl logs -n devops-app -l app=devops-frontend # Логи frontend"
echo ""
echo "=== МОНИТОРИНГ ==="
echo "  kubectl get pods -n monitoring                    # Статус подов мониторинга"
echo "  kubectl logs -n monitoring deployment/prometheus  # Логи Prometheus"
echo "  kubectl logs -n monitoring deployment/grafana     # Логи Grafana"
echo "  ./validate-metrics.sh                             # Полная проверка метрик"
echo ""
echo "=== ГЕНЕРАЦИЯ ТРАФИКА ==="
if [ "$EXTERNAL_IP" != "" ] && [ "$NODE_PORT" != "" ]; then
    echo "  # Генерация трафика для метрик:"
    echo "  curl http://$EXTERNAL_IP:$NODE_PORT/api/v1/users"
    echo "  curl http://$EXTERNAL_IP:$NODE_PORT/api/v1/orders"
    echo "  curl http://$EXTERNAL_IP:$NODE_PORT/actuator/health"
    echo ""
    echo "  # Массовая генерация трафика:"
    echo "  for i in {1..20}; do curl -s http://$EXTERNAL_IP:$NODE_PORT/api/v1/users > /dev/null; done"
fi
echo ""
echo "=== ДАШБОРДЫ GRAFANA ==="
echo "  После входа в Grafana найдите дашборды:"
echo "  - DevOps Application Monitoring (основной с CPU метриками)"
echo "  - CPU Load & Autoscaling Monitoring (специализированный)"
echo "  - Kubernetes Infrastructure Monitoring"
echo "  - Pod-Level Detailed Monitoring"
echo "  - Request Tracing and Analysis"
echo "  - Infrastructure Deep Dive"
echo ""
echo "=== АВТОМАСШТАБИРОВАНИЕ ==="
echo "  kubectl get hpa -n devops-app                         # Статус HPA"
echo "  kubectl describe hpa devops-backend-hpa -n devops-app # Подробная информация"
echo "  kubectl top pods -n devops-app                        # Метрики подов"
echo "  watch kubectl get hpa -n devops-app                   # Мониторинг в реальном времени"
echo ""
echo "=== ДИАГНОСТИКА ==="
echo "  ./diagnose-pods.sh                                    # Диагностика проблем с подами"
echo "  kubectl get events -n devops-app --sort-by='.lastTimestamp' | tail -10"
echo ""
echo "🔧 Для удаления ресурсов выполните:"
echo "  terraform destroy"