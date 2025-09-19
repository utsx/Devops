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

# Получение внешнего IP LoadBalancer
echo "🌐 Получение внешнего IP LoadBalancer..."
echo "Ожидание назначения внешнего IP (может занять до 5 минут)..."

# Ждем назначения внешнего IP (максимум 5 минут)
for i in {1..30}; do
    EXTERNAL_IP=$(kubectl get services -n devops-app devops-frontend-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    if [ "$EXTERNAL_IP" != "" ] && [ "$EXTERNAL_IP" != "null" ]; then
        echo "✅ LoadBalancer внешний IP получен: $EXTERNAL_IP"
        break
    fi
    echo "⏳ Ожидание LoadBalancer IP... ($i/30)"
    sleep 10
done

if [ "$EXTERNAL_IP" != "" ] && [ "$EXTERNAL_IP" != "null" ]; then
    echo "🌐 Приложение доступно: http://$EXTERNAL_IP"
    echo "🔍 Проверка доступности..."
    
    # Проверяем доступность frontend
    if curl -s -o /dev/null -w "%{http_code}" http://$EXTERNAL_IP | grep -q "200\|301\|302"; then
        echo "✅ Frontend доступен из интернета!"
        
        # Проверяем API через frontend
        echo "🔍 Проверка API через frontend..."
        if curl -s -o /dev/null -w "%{http_code}" http://$EXTERNAL_IP/api/actuator/health | grep -q "200"; then
            echo "✅ API доступно через frontend!"
        else
            echo "⚠️  API пока недоступно, но frontend работает. Backend может еще запускаться."
        fi
        
        echo "🎉 Откройте в браузере: http://$EXTERNAL_IP"
        echo "📋 API endpoint: http://$EXTERNAL_IP/api/actuator/health"
    else
        echo "⚠️  Frontend пока недоступен. Попробуйте через несколько минут."
    fi
else
    echo "⏳ LoadBalancer IP еще назначается. Проверьте позже командой:"
    echo "kubectl get services -n devops-app devops-frontend-service"
    echo ""
    echo "📋 Для диагностики:"
    echo "kubectl describe service devops-frontend-service -n devops-app"
    echo "kubectl get events -n devops-app | grep LoadBalancer"
fi

echo ""
echo "🎉 Развертывание завершено!"
echo ""
echo "📋 Полезные команды:"
echo "  kubectl get pods -n devops-app                    # Статус подов"
echo "  kubectl get services -n devops-app                # Статус сервисов"
echo "  kubectl logs -n devops-app -l app=devops-backend  # Логи backend"
echo "  kubectl logs -n devops-app -l app=devops-frontend # Логи frontend"
echo ""
echo "🔧 Для удаления ресурсов выполните:"
echo "  terraform destroy"