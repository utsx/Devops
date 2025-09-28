# DevOps Application - Полное развертывание одним скриптом

Полнофункциональное DevOps приложение с мониторингом, развертываемое в Kubernetes одной командой.

## 🚀 Быстрый старт

### 1. Подготовка

```bash
# Установите необходимые инструменты:
# - Docker
# - Terraform
# - Yandex Cloud CLI (yc)
# - kubectl

# Авторизуйтесь в сервисах
docker login
yc init
```

### 2. Настройка конфигурации

```bash
# Скопируйте и настройте переменные Terraform
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Отредактируйте terraform/terraform.tfvars с вашими параметрами
```

### 3. Развертывание одной командой

```bash
./deploy.sh
```

**Этот скрипт автоматически:**
- ✅ Соберет и загрузит Docker образы в Docker Hub
- ✅ Создаст Kubernetes кластер в Yandex Cloud
- ✅ Развернет PostgreSQL базу данных
- ✅ Развернет Backend и Frontend приложения
- ✅ Настроит систему мониторинга (Prometheus + Grafana)
- ✅ Создаст расширенные дашборды Grafana
- ✅ Сгенерирует тестовый трафик для HTTP метрик

## 📊 Что получите после развертывания

### 🌐 Приложение
- **Frontend**: React приложение для управления пользователями и заказами
- **Backend**: Spring Boot REST API с метриками Prometheus
- **Database**: PostgreSQL с persistent storage

### 📈 Мониторинг
- **Prometheus**: Сбор метрик от приложений и Kubernetes
- **Grafana**: 3 готовых дашборда с визуализацией метрик
  - Pod-Level Detailed Monitoring
  - Request Tracing and Analysis  
  - Infrastructure Deep Dive

### 🔍 Метрики
- HTTP запросы (количество, время отклика, ошибки)
- JVM метрики (память, GC, threads)
- Database connection pool
- Kubernetes ресурсы (CPU, память, сеть)

## 📋 Полезные команды

```bash
# Статус приложений
cd terraform && kubectl get pods -n devops-app

# Статус мониторинга  
cd terraform && kubectl get pods -n monitoring

# Проверка метрик
cd terraform && ./validate-metrics.sh

# Обновление образов
cd terraform && ./update-images.sh

# Генерация трафика для метрик
curl http://EXTERNAL-IP:NODE-PORT/api/v1/users
curl http://EXTERNAL-IP:NODE-PORT/api/v1/orders
```

## 🔧 Управление

### Обновление приложений
```bash
# Пересборка и обновление образов
./build-and-push.sh
cd terraform && ./update-images.sh
```

### Удаление ресурсов
```bash
cd terraform && terraform destroy
```

## 📊 Доступ к сервисам

После развертывания скрипт покажет адреса для доступа:

- **Frontend**: `http://EXTERNAL-IP:NODE-PORT`
- **API**: `http://EXTERNAL-IP:NODE-PORT/api/v1/users`
- **Grafana**: `http://EXTERNAL-IP:32000` (admin/admin123)
- **Prometheus**: Port-forward на localhost:9090

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   (React)       │◄──►│  (Spring Boot)  │◄──►│   (Database)    │
│   Port: 80      │    │   Port: 8080    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────────┐
                    │      Monitoring Stack       │
                    │  ┌─────────┐ ┌─────────┐   │
                    │  │Prometheus│ │ Grafana │   │
                    │  │Port: 9090│ │Port: 3000│   │
                    │  └─────────┘ └─────────┘   │
                    └─────────────────────────────┘
```

## 📁 Структура проекта

```
├── deploy.sh                 # Главный скрипт развертывания
├── backend/                  # Spring Boot приложение
├── frontend/                 # React приложение  
├── terraform/               # Terraform конфигурация
│   ├── deploy.sh           # Развертывание в Kubernetes
│   ├── k8s-manifests.yaml  # Манифесты приложений
│   ├── monitoring-manifests.yaml # Мониторинг
│   └── grafana-dashboards-extended.yaml # Дашборды
└── load-testing/           # Инструменты нагрузочного тестирования
```

## 🎯 Особенности

- **Полная автоматизация**: Одна команда для полного развертывания
- **Production-ready**: Persistent storage, health checks, resource limits
- **Мониторинг из коробки**: Готовые дашборды и алерты
- **Масштабируемость**: Kubernetes с возможностью HPA
- **Безопасность**: Security contexts, secrets, network policies

Начните с `./deploy.sh` и получите полнофункциональное DevOps приложение за несколько минут! 🚀