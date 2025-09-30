# Нагрузочное тестирование с Yandex.Tank

Этот каталог содержит конфигурацию для проведения нагрузочного тестирования DevOps приложения с использованием **Yandex.Tank** и мониторинга автомасштабирования **HPA (Horizontal Pod Autoscaler)**.

## 🎯 Цель

Протестировать работу автомасштабирования Kubernetes при различных уровнях нагрузки:
- Проверить **scale-up** при увеличении нагрузки
- Проверить **scale-down** при снижении нагрузки  
- Измерить время реакции HPA
- Оценить стабильность приложения под нагрузкой

## 📋 Предварительные требования

### 1. Установка Yandex.Tank

**Вариант A: Python package**
```bash
pip install yandextank
```

**Вариант B: Docker (рекомендуемый)**
```bash
docker pull yandex/yandex-tank
```

### 2. Проверка доступности приложения
```bash
# Убедитесь что Kubernetes кластер запущен
cd ../terraform
kubectl get pods -n devops-app

# Проверьте что приложение доступно
curl -s http://89.169.142.28:32757/actuator/health
```

## 🚀 Запуск тестирования

### Полный автоматический тест
```bash
# Запускает Tank + мониторинг HPA в одном скрипте
./run-load-test.sh
```

### Разделенное тестирование

**Терминал 1: Мониторинг HPA**
```bash
./monitor-hpa.sh
```

**Терминал 2: Запуск нагрузки**
```bash
# Простой тест
yandex-tank simple-load.yaml

# Расширенный тест  
yandex-tank load.yaml

# Через Docker
docker run -v $(pwd):/var/loadtest --net host -it yandex/yandex-tank simple-load.yaml
```

## 📊 Профили нагрузки

### Simple Load (simple-load.yaml)
- **Время:** 10 минут
- **Профиль:** 1→30→60 RPS  
- **Цель:** Базовое тестирование scale-up

### Advanced Load (load.yaml)
- **Время:** 15 минут
- **Профиль:** 1→50→100 RPS с плато
- **Цель:** Детальное тестирование поведения HPA

## 🎯 Ожидаемое поведение HPA

| RPS | CPU Load | Memory Load | Ожидаемые реплики |
|-----|----------|-------------|-------------------|
| 1-10 | 0-5% | 60-70% | 1 (минимум) |
| 10-30 | 5-10% | 70-85% | 1-2 |
| 30-60 | 10-15% | 85-110% | 2-3 (максимум) |
| 60+ | >15% | >110% | 3 (лимит) |

## 📈 Мониторинг

### В реальном времени
```bash
# HPA статус
watch kubectl get hpa -n devops-app

# Поды и метрики  
watch kubectl top pods -n devops-app

# События HPA
kubectl get events -n devops-app --field-selector involvedObject.name=devops-backend-hpa
```

### Web-интерфейсы
- **Tank Web UI:** http://localhost:8080 (во время тестирования)
- **Grafana:** http://89.169.142.28:32000 (admin/admin123)

## 📁 Структура файлов

```
load-testing/
├── load.yaml                 # Расширенная конфигурация Tank
├── simple-load.yaml          # Простая конфигурация Tank  
├── run-load-test.sh          # Автоматический запуск тестирования
├── monitor-hpa.sh            # Скрипт мониторинга HPA
└── scenarios/
    ├── api_scenario.txt      # HTTP сценарии для тестирования
    └── simple_ammo.txt       # Простые HTTP запросы (ammo file)
```

## 📊 Результаты

После тестирования вы получите:

### Tank результаты
- **Графики производительности** в Tank web UI
- **Логи ответов** и времени отклика
- **Статистика ошибок** и таймаутов

### HPA мониторинг
- **CSV файл** с метриками: `terraform/hpa_monitoring.csv`
- **Логи событий** автомасштабирования
- **Графики в Grafana** с CPU/Memory metrics

## 🔧 Настройка нагрузки

### Изменение endpoints
Отредактируйте `scenarios/simple_ammo.txt`:
```http
GET /your/custom/endpoint HTTP/1.1
Host: 89.169.142.28:32757
User-Agent: YandexTank/1.0
```

### Настройка профиля нагрузки
В `simple-load.yaml` измените `schedule`:
```yaml
load_profile:
  load_type: rps
  schedule: line(1, 20, 1m) const(20, 2m) line(20, 40, 1m)
```

### Изменение порогов автостопа
```yaml
autostop:
  enabled: true
  autostop:
    - "http(5xx,20%,30s)"     # 20% ошибок 5xx за 30 сек
    - "quantile(95,2000ms,60s)" # 95% запросов медленнее 2 сек
```

## 🚨 Troubleshooting

### Tank не запускается
```bash
# Проверьте установку
yandex-tank --version

# Проверьте доступность приложения  
curl -I http://89.169.142.28:32757/actuator/health
```

### HPA не реагирует на нагрузку
```bash
# Проверьте metrics-server
kubectl top pods -n devops-app

# Проверьте HPA
kubectl describe hpa devops-backend-hpa -n devops-app

# Проверьте пороги автомасштабирования
kubectl get hpa -n devops-app -o yaml
```

### Приложение недоступно
```bash
# Проверьте поды
kubectl get pods -n devops-app

# Проверьте сервисы
kubectl get svc -n devops-app

# Проверьте узлы кластера
kubectl get nodes -o wide
```

## 📚 Дополнительная информация

- [Документация Yandex.Tank](https://yandextank.readthedocs.io/)
- [Kubernetes HPA](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Конфигурация автомасштабирования](../terraform/hpa-manifests.yaml)
