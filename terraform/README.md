# Простое развертывание DevOps приложения в Kubernetes

Упрощенная конфигурация Terraform для развертывания Kubernetes кластера в Яндекс.Облаке с приложениями из Docker Hub.

## Что развертывается

- **Kubernetes кластер** в Yandex Cloud
- **Frontend**: React приложение из образа `utsx/devops-frontend:latest`
- **Backend**: Spring Boot приложение из образа `utsx/devops-backend:latest`
- **PostgreSQL**: База данных для backend
- **LoadBalancer** для внешнего доступа

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
# Проверить статус LoadBalancer
kubectl get services -n devops-app devops-frontend-service

# Ждать назначения внешнего IP (может занять несколько минут)
kubectl get services -n devops-app devops-frontend-service -w

# Получить внешний IP
EXTERNAL_IP=$(kubectl get service devops-frontend-service -n devops-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Frontend доступен по адресу: http://$EXTERNAL_IP"

# Проверить доступность frontend
curl -I http://$EXTERNAL_IP

# Проверить API через frontend
curl http://$EXTERNAL_IP/api/actuator/health
```

Найдите EXTERNAL-IP и откройте в браузере: `http://EXTERNAL-IP`

**Проверка API:**
- Frontend: `http://EXTERNAL-IP`
- API через frontend: `http://EXTERNAL-IP/api/actuator/health`

## Архитектура

```
Internet
    ↓
LoadBalancer (Frontend Service)
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
- **Frontend**: 2 реплики, порт 80, LoadBalancer
- **Backend**: 2 реплики, порт 8080, ClusterIP
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
```

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

### LoadBalancer не получает IP
```bash
# Проверить статус LoadBalancer
kubectl describe service devops-frontend-service -n devops-app

# Проверить события
kubectl get events -n devops-app | grep LoadBalancer

# Проверить квоты Yandex Cloud
yc compute address list

# Проверить лимиты на внешние IP
yc resource-manager quota list --folder-id <your-folder-id>

# Ждать назначения IP (может занять до 5 минут)
kubectl get services -n devops-app devops-frontend-service -w
```

### Frontend недоступен из интернета
```bash
# Получить внешний IP
EXTERNAL_IP=$(kubectl get service devops-frontend-service -n devops-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "External IP: $EXTERNAL_IP"

# Проверить доступность
curl -v http://$EXTERNAL_IP

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

## Что упрощено

По сравнению с полной конфигурацией убрано:
- PostgreSQL база данных
- Сложные политики масштабирования
- HPA (автомасштабирование)
- NetworkPolicy
- Ingress контроллер
- Мониторинг и метрики

Приложения используют встроенную H2 базу данных для простоты.