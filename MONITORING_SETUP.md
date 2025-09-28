# Система мониторинга DevOps приложения

## Обзор

Данная система мониторинга предоставляет полный контроль над состоянием приложения и инфраструктуры Kubernetes с использованием Prometheus для сбора метрик и Grafana для визуализации.

## Архитектура мониторинга

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DevOps App    │    │   Prometheus    │    │     Grafana     │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Backend   │─┼────┼→│   Scraper   │ │    │ │ Dashboards  │ │
│ │ (Micrometer)│ │    │ │             │ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ ┌─────────────┐ │    │ │   Storage   │ │    │ │   Alerts    │ │
│ │  Frontend   │ │    │ │   (TSDB)    │ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Kubernetes    │
                    │    Metrics      │
                    │ (cAdvisor, etc) │
                    └─────────────────┘
```

## Компоненты системы

### 1. Prometheus
- **Назначение**: Сбор и хранение метрик
- **Порт**: 9090
- **Хранилище**: 20GB PVC
- **Retention**: 15 дней
- **Namespace**: monitoring

### 2. Grafana
- **Назначение**: Визуализация метрик и алерты
- **Порт**: 3000 (внешний доступ через NodePort 32000)
- **Хранилище**: 5GB PVC
- **Учетные данные**: admin/admin123
- **Namespace**: monitoring

### 3. Backend приложения
- **Метрики**: Экспортируются через `/actuator/prometheus`
- **Библиотека**: Micrometer Prometheus
- **Аннотации**: Настроены для автоматического обнаружения Prometheus

## Развертывание

### Предварительные требования

1. Kubernetes кластер развернут и доступен
2. kubectl настроен для работы с кластером
3. Достаточно ресурсов для компонентов мониторинга

### Шаги развертывания

1. **Обновите backend приложение** с новыми зависимостями:
   ```bash
   # Пересоберите Docker образ backend с новыми зависимостями
   cd backend
   docker build -t utsx/devops-backend:latest .
   docker push utsx/devops-backend:latest
   ```

2. **Разверните основное приложение**:
   ```bash
   kubectl apply -f terraform/k8s-manifests.yaml
   ```

3. **Разверните систему мониторинга**:
   ```bash
   cd terraform
   ./deploy-monitoring.sh
   ```

### Ручное развертывание

Если предпочитаете ручное развертывание:

```bash
# Применить манифесты мониторинга
kubectl apply -f terraform/monitoring-manifests.yaml

# Проверить статус развертывания
kubectl get pods -n monitoring
kubectl get svc -n monitoring

# Получить внешний IP Grafana
kubectl get svc grafana-external -n monitoring
```

## Доступ к сервисам

### Grafana
- **Внешний доступ**: http://EXTERNAL_IP:3000
- **Внутренний доступ**: http://grafana.monitoring.svc.cluster.local:3000
- **Логин**: admin
- **Пароль**: admin123

### Prometheus
- **Внутренний доступ**: http://prometheus.monitoring.svc.cluster.local:9090
- **Web UI**: Доступен через port-forward:
  ```bash
  kubectl port-forward svc/prometheus 9090:9090 -n monitoring
  ```

## Дашборды

### 1. DevOps Application Monitoring
Мониторинг метрик приложения:

- **HTTP Requests Rate**: Частота HTTP запросов по методам и URI
- **HTTP Response Times**: Время ответа (50-й и 95-й перцентили)
- **JVM Memory Usage**: Использование памяти JVM по областям
- **Database Connections**: Активные и неактивные соединения с БД

### 2. Kubernetes Infrastructure Monitoring
Мониторинг инфраструктуры:

- **Pod Status**: Статус подов в namespace devops-app
- **CPU Usage by Pod**: Использование CPU по подам
- **Memory Usage by Pod**: Использование памяти по подам
- **Network I/O**: Сетевой трафик по подам

## Метрики приложения

### HTTP метрики
```
http_server_requests_seconds_count - Количество HTTP запросов
http_server_requests_seconds_sum - Общее время обработки запросов
http_server_requests_seconds_bucket - Гистограмма времени ответа
```

### JVM метрики
```
jvm_memory_used_bytes - Использование памяти JVM
jvm_gc_pause_seconds - Время пауз сборщика мусора
jvm_threads_live_threads - Количество активных потоков
```

### Database метрики
```
hikaricp_connections_active - Активные соединения с БД
hikaricp_connections_idle - Неактивные соединения с БД
hikaricp_connections_pending - Ожидающие соединения
```

### Kubernetes метрики
```
kube_pod_status_phase - Статус подов
container_cpu_usage_seconds_total - Использование CPU контейнерами
container_memory_usage_bytes - Использование памяти контейнерами
container_network_receive_bytes_total - Входящий сетевой трафик
container_network_transmit_bytes_total - Исходящий сетевой трафик
```

## Алерты

Настроены следующие алерты:

### 1. High Error Rate
- **Условие**: Частота 5xx ошибок > 0.1 запросов/сек
- **Время**: 2 минуты
- **Серьезность**: Warning

### 2. High Response Time
- **Условие**: 95-й перцентиль времени ответа > 1 секунды
- **Время**: 5 минут
- **Серьезность**: Warning

### 3. Pod Crash Looping
- **Условие**: Под перезапускается
- **Время**: 5 минут
- **Серьезность**: Critical

## Мониторинг по подам

### Просмотр метрик конкретного пода

1. **В Prometheus**:
   ```promql
   # Метрики конкретного пода backend
   http_server_requests_seconds_count{kubernetes_pod_name=~"devops-backend-.*"}
   
   # CPU использование пода
   rate(container_cpu_usage_seconds_total{pod=~"devops-backend-.*"}[5m])
   
   # Память пода
   container_memory_usage_bytes{pod=~"devops-backend-.*"}
   ```

2. **В Grafana**:
   - Используйте переменные `$pod` в запросах
   - Фильтруйте по лейблу `kubernetes_pod_name`
   - Группируйте метрики по подам

### Отслеживание запросов

Для отслеживания HTTP запросов по подам:

```promql
# Запросы по подам и эндпоинтам
sum(rate(http_server_requests_seconds_count{kubernetes_pod_name=~"devops-backend-.*"}[5m])) by (kubernetes_pod_name, uri, method)

# Время ответа по подам
histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket{kubernetes_pod_name=~"devops-backend-.*"}[5m])) by (kubernetes_pod_name, le))
```

## Troubleshooting

### Проблемы с метриками

1. **Метрики не собираются**:
   ```bash
   # Проверить аннотации подов
   kubectl get pods -n devops-app -o yaml | grep -A 5 annotations
   
   # Проверить эндпоинт метрик
   kubectl port-forward pod/devops-backend-xxx 8080:8080 -n devops-app
   curl http://localhost:8080/actuator/prometheus
   ```

2. **Prometheus не видит targets**:
   ```bash
   # Проверить конфигурацию Prometheus
   kubectl logs deployment/prometheus -n monitoring
   
   # Проверить service discovery
   kubectl port-forward svc/prometheus 9090:9090 -n monitoring
   # Открыть http://localhost:9090/targets
   ```

3. **Grafana не показывает данные**:
   ```bash
   # Проверить подключение к Prometheus
   kubectl logs deployment/grafana -n monitoring
   
   # Проверить datasource в Grafana
   # Settings -> Data Sources -> Prometheus
   ```

### Логи компонентов

```bash
# Логи Prometheus
kubectl logs -f deployment/prometheus -n monitoring

# Логи Grafana
kubectl logs -f deployment/grafana -n monitoring

# Логи backend приложения
kubectl logs -f deployment/devops-backend -n devops-app
```

### Проверка ресурсов

```bash
# Использование ресурсов мониторинга
kubectl top pods -n monitoring

# Статус PVC
kubectl get pvc -n monitoring

# Статус сервисов
kubectl get svc -n monitoring
```

## Масштабирование

### Prometheus
- Увеличить retention: изменить `--storage.tsdb.retention.time`
- Увеличить storage: изменить размер PVC
- Добавить ресурсы: увеличить requests/limits

### Grafana
- Масштабирование: увеличить replicas (требует внешнее хранилище)
- Производительность: увеличить ресурсы CPU/Memory

## Безопасность

### Рекомендации
1. Изменить пароль Grafana по умолчанию
2. Настроить RBAC для доступа к метрикам
3. Использовать TLS для внешних подключений
4. Ограничить доступ к Prometheus UI

### Обновление пароля Grafana
```bash
# Создать новый secret с паролем
kubectl create secret generic grafana-secret \
  --from-literal=admin-password=NEW_PASSWORD \
  -n monitoring --dry-run=client -o yaml | kubectl apply -f -

# Перезапустить Grafana
kubectl rollout restart deployment/grafana -n monitoring
```

## Резервное копирование

### Prometheus данные
```bash
# Создать snapshot
curl -XPOST http://prometheus:9090/api/v1/admin/tsdb/snapshot

# Скопировать данные из PVC
kubectl cp monitoring/prometheus-pod:/prometheus/snapshots ./prometheus-backup
```

### Grafana конфигурация
```bash
# Экспорт дашбордов через API
curl -H "Authorization: Bearer API_TOKEN" \
  http://grafana:3000/api/dashboards/db/dashboard-slug
```

## Мониторинг производительности

### Ключевые метрики для отслеживания

1. **Приложение**:
   - Время ответа API (< 500ms для 95% запросов)
   - Частота ошибок (< 1%)
   - Пропускная способность (requests/sec)
   - Использование памяти JVM (< 80%)

2. **Инфраструктура**:
   - CPU узлов (< 70%)
   - Память узлов (< 80%)
   - Дисковое пространство (< 85%)
   - Сетевая нагрузка

3. **База данных**:
   - Активные соединения
   - Время выполнения запросов
   - Блокировки

## Заключение

Система мониторинга обеспечивает полную видимость состояния приложения и инфраструктуры, позволяя:

- Отслеживать производительность в реальном времени
- Получать уведомления о проблемах
- Анализировать тренды и планировать масштабирование
- Диагностировать проблемы с помощью детальных метрик

Для получения дополнительной помощи обращайтесь к документации Prometheus и Grafana.