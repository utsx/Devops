# Простое развертывание DevOps приложения в Kubernetes

Упрощенная конфигурация Terraform для развертывания Kubernetes кластера в Яндекс.Облаке с приложениями из Docker Hub.

## Что развертывается

- **Kubernetes кластер** в Yandex Cloud
- **Frontend**: React приложение из образа `utsx/devops-frontend:latest`
- **Backend**: Spring Boot приложение из образа `utsx/devops-backend:latest`
- **PostgreSQL**: База данных для backend
- **NodePort** для внешнего доступа

## Быстрый старт

### 1. Установите необходимые инструменты

```bash
# Yandex Cloud CLI
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
yc init

# Terraform
brew install terraform  # macOS
# или скачайте с https://terraform.io/downloads

# kubectl
brew install kubectl    # macOS
```

### 2. Настройте переменные

Отредактируйте файл `terraform.tfvars`:

```hcl
# Обязательные параметры
yandex_token     = "ваш-oauth-токен"
yandex_cloud_id  = "ваш-cloud-id"
yandex_folder_id = "ваш-folder-id"

# SSH ключ (замените на свой)
ssh_public_key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH3vKMnXEDmroTNHyGDNyN8AfZB/naf2ai6SukPpXaXE user@host"
```

### 3. Разверните одной командой

```bash
./deploy.sh
```

Или вручную:

```bash
# 1. Создайте кластер
terraform init
terraform apply -auto-approve

# 2. Настройте kubectl
yc managed-kubernetes cluster get-credentials devops-k8s-cluster --external --force

# 3. Разверните приложения
kubectl apply -f k8s-manifests.yaml

# 4. Проверьте статус
kubectl get pods -n devops-app
kubectl get services -n devops-app
```

### 4. Получите URL приложения

```bash
# Проверить статус NodePort сервиса
kubectl get services -n devops-app devops-frontend-service

# Получить NodePort
NODE_PORT=$(kubectl get service devops-frontend-service -n devops-app -o jsonpath='{.spec.ports[0].nodePort}')

# Получить внешний IP ноды
EXTERNAL_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}')
echo "Frontend доступен по адресу: http://$EXTERNAL_IP:$NODE_PORT"

# Проверить доступность frontend
curl -I http://$EXTERNAL_IP:$NODE_PORT

# Проверить API через frontend
curl http://$EXTERNAL_IP:$NODE_PORT/api/actuator/health
```

Откройте в браузере: `http://EXTERNAL-IP:NODE-PORT`

**Проверка API:**
- Frontend: `http://EXTERNAL-IP:NODE-PORT`
- API через frontend: `http://EXTERNAL-IP:NODE-PORT/api/actuator/health`

## Архитектура

```
Internet
    ↓
NodePort (Frontend Service)
    ↓
Frontend Pods (utsx/devops-frontend:latest)
    ↓ /api/*
Backend Pods (utsx/devops-backend:latest)
    ↓
PostgreSQL Pod
```

## Основные компоненты

### Kubernetes кластер
- **Версия**: 1.30
- **Узлы**: 2 узла standard-v3 (2 CPU, 4GB RAM)
- **Сеть**: Автоматически созданная VPC

### Приложения
- **Frontend**: 1 реплика, порт 80, NodePort (32757)
- **Backend**: 1 реплика, порт 8080, ClusterIP
- **Namespace**: devops-app

## Полезные команды

```bash
# Статус приложений
kubectl get pods -n devops-app
kubectl get services -n devops-app

# Логи
kubectl logs -l app=devops-frontend -n devops-app
kubectl logs -l app=devops-backend -n devops-app

# Масштабирование
kubectl scale deployment devops-frontend --replicas=3 -n devops-app

# Обновление образа
kubectl set image deployment/devops-frontend frontend=utsx/devops-frontend:v2.0 -n devops-app

# Перезапуск
kubectl rollout restart deployment/devops-frontend -n devops-app

# Интерактивное обновление образов (рекомендуется)
./update-images.sh
```

## Обновление образов

После загрузки новых образов в Docker Hub используйте:

```bash
# Интерактивный скрипт обновления
./update-images.sh

# Или вручную:
kubectl set image deployment/devops-backend backend=utsx/devops-backend:latest -n devops-app
kubectl set image deployment/devops-frontend frontend=utsx/devops-frontend:latest -n devops-app

# Принудительный перезапуск (если тег не изменился)
kubectl rollout restart deployment/devops-backend -n devops-app
kubectl rollout restart deployment/devops-frontend -n devops-app
```

Подробное руководство: [UPDATE_IMAGES.md](UPDATE_IMAGES.md)

## Получение учетных данных Yandex Cloud

```bash
# OAuth токен
yc iam create-token

# ID облака и папки
yc resource-manager cloud list
yc resource-manager folder list
```

## Структура файлов

```
terraform/
├── main.tf              # Основная конфигурация
├── variables.tf         # Переменные
├── outputs.tf           # Выходные данные
├── versions.tf          # Версии провайдеров
├── terraform.tfvars     # Ваши настройки
├── k8s-manifests.yaml   # Манифесты приложений
├── deploy.sh            # Скрипт развертывания
├── update-images.sh     # Скрипт обновления образов
├── UPDATE_IMAGES.md     # Руководство по обновлению образов
└── README.md            # Эта документация
```

## Troubleshooting

### Поды не запускаются (ContainerCreating)
```bash
# Подробная информация о поде
kubectl describe pod <pod-name> -n devops-app

# События в namespace
kubectl get events -n devops-app --sort-by='.lastTimestamp'

# Проверить ConfigMap
kubectl get configmap frontend-nginx-config -n devops-app -o yaml

# Проверить доступность образов
kubectl get pods -n devops-app -o jsonpath='{.items[*].spec.containers[*].image}'

# Логи контейнера (если запустился)
kubectl logs <pod-name> -n devops-app

# Проверить ресурсы узлов
kubectl describe nodes
```

### InitContainer ждет PostgreSQL
Если backend поды показывают "Initialized: False", проверьте:
```bash
# Статус PostgreSQL
kubectl get pods -l app=postgres -n devops-app

# Логи initContainer
kubectl logs <backend-pod-name> -c wait-for-postgres -n devops-app

# Логи PostgreSQL
kubectl logs -l app=postgres -n devops-app

# Проверка сетевого подключения
kubectl exec -it <backend-pod-name> -c wait-for-postgres -n devops-app -- nslookup postgres
kubectl exec -it <backend-pod-name> -c wait-for-postgres -n devops-app -- ping postgres
```

### Проблемы с сетью между подами
```bash
# Проверить endpoints
kubectl get endpoints -n devops-app

# Проверить сервисы
kubectl get services -n devops-app

# Тест подключения из другого пода
kubectl run test-pod --image=postgres:15-alpine -n devops-app --rm -it -- pg_isready -h postgres -p 5432
```

### NodePort недоступен
```bash
# Проверить статус NodePort сервиса
kubectl describe service devops-frontend-service -n devops-app

# Проверить что NodePort настроен
kubectl get service devops-frontend-service -n devops-app -o yaml

# Проверить внешние IP нод
kubectl get nodes -o wide

# Проверить группы безопасности (порт должен быть открыт)
yc compute instance list
```

### Frontend недоступен из интернета
```bash
# Получить внешний IP ноды и NodePort
EXTERNAL_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}')
NODE_PORT=$(kubectl get service devops-frontend-service -n devops-app -o jsonpath='{.spec.ports[0].nodePort}')
echo "External IP: $EXTERNAL_IP:$NODE_PORT"

# Проверить доступность
curl -v http://$EXTERNAL_IP:$NODE_PORT

# Проверить статус подов frontend
kubectl get pods -l app=devops-frontend -n devops-app

# Проверить логи frontend
kubectl logs -l app=devops-frontend -n devops-app
```

### Проблемы с образами
```bash
# Принудительное обновление
kubectl rollout restart deployment/devops-frontend -n devops-app
kubectl rollout restart deployment/devops-backend -n devops-app
```

### Переподключение к кластеру
```bash
yc managed-kubernetes cluster get-credentials devops-k8s-cluster --external --force
```

### Очистка существующего контекста kubectl
Если получаете ошибку "Context already exists", выполните:
```bash
kubectl config unset contexts.yc-devops-k8s-cluster
kubectl config unset users.yc-devops-k8s-cluster
kubectl config unset clusters.yc-devops-k8s-cluster
```
Затем повторите команду получения учетных данных.

## Удаление

```bash
terraform destroy -auto-approve
```

## Стоимость

Примерно 5000 ₽/месяц для тестового окружения (2 узла standard-v3).

## Мониторинг

Система мониторинга включает Prometheus и Grafana с автоматическими исправлениями прав доступа.

### Развертывание мониторинга

```bash
# Развертывание системы мониторинга
./deploy-monitoring.sh
```

Скрипт автоматически:
- Применяет манифесты мониторинга
- Проверяет корректность запуска Prometheus
- Исправляет проблемы с правами доступа при необходимости
- Проверяет доступность API Prometheus

### Доступ к сервисам мониторинга

```bash
# Grafana (внешний доступ через NodePort)
kubectl get svc grafana-external -n monitoring

# Prometheus (внутренний доступ)
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Учетные данные Grafana
# Пользователь: admin
# Пароль: admin123
```

### Исправление проблем Prometheus

Если Prometheus выдает ошибки прав доступа:

```bash
# Автоматическое исправление
./fix-prometheus-permissions.sh

# Или проверка логов
kubectl logs -n monitoring deployment/prometheus
```

**Типичные ошибки и решения:**
- `permission denied` при создании `/prometheus/queries.active` - исправляется автоматически через SecurityContext и initContainer
- `panic: Unable to create mmap-ed active query log` - решается перезапуском с правильными правами

### Дашборды

Доступные дашборды в Grafana:
- **DevOps Application Monitoring** - метрики приложения (HTTP запросы, время ответа, JVM, БД)
- **Kubernetes Infrastructure Monitoring** - метрики инфраструктуры (CPU, память, сеть подов)

### Файлы мониторинга

```
terraform/
├── monitoring-manifests.yaml        # Манифесты Prometheus и Grafana
├── deploy-monitoring.sh            # Скрипт развертывания с проверками
├── fix-prometheus-permissions.sh   # Исправление прав доступа
├── PROMETHEUS_PERMISSIONS_FIX.md   # Документация по исправлениям
└── test-monitoring.sh              # Тестирование мониторинга
```

## Что упрощено

По сравнению с полной конфигурацией убрано:
- PostgreSQL база данных
- Сложные политики масштабирования
- HPA (автомасштабирование)
- NetworkPolicy
- Ingress контроллер

Приложения используют встроенную H2 базу данных для простоты.