# Развертывание виртуальной машины в Яндекс.Облаке с помощью Terraform

Этот проект содержит конфигурацию Terraform для автоматического развертывания виртуальной машины в Яндекс.Облаке с предустановленным Docker и Docker Compose.

## Структура проекта

```
terraform/
├── main.tf                    # Основная конфигурация ресурсов
├── variables.tf               # Определение переменных
├── outputs.tf                 # Выходные данные
├── versions.tf                # Конфигурация провайдеров
├── cloud-init.yaml           # Скрипт инициализации ВМ
├── terraform.tfvars.example  # Пример файла с переменными
└── README.md                 # Данная инструкция
```

## Что создается

- **VPC сеть** с подсетью
- **Группа безопасности** с правилами для SSH, HTTP, HTTPS и портов приложения
- **Виртуальная машина** Ubuntu 22.04 LTS с автоматической установкой:
  - Docker и Docker Compose
  - Базовые утилиты (git, curl, wget, htop)
  - Настройка пользователя для работы с Docker

## Предварительные требования

### 1. Установка Terraform

```bash
# macOS (с помощью Homebrew)
brew install terraform

# Ubuntu/Debian
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
```

### 2. Настройка Яндекс.Облака

1. **Получите OAuth токен:**
   - Перейдите на https://oauth.yandex.ru/authorize?response_type=token&client_id=1a6990aa636648e9b2ef855fa7bec2fb
   - Авторизуйтесь и скопируйте токен

2. **Найдите ID облака и папки:**
   ```bash
   # Установите Yandex Cloud CLI
   curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
   
   # Инициализируйте CLI
   yc init
   
   # Получите ID облака
   yc resource-manager cloud list
   
   # Получите ID папки
   yc resource-manager folder list
   ```

### 3. Создание SSH ключей

```bash
# Создайте SSH ключи, если их нет
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Убедитесь, что публичный ключ существует
ls ~/.ssh/id_rsa.pub
```

## Развертывание

### 1. Подготовка конфигурации

```bash
# Перейдите в директорию terraform
cd terraform

# Скопируйте пример файла с переменными
cp terraform.tfvars.example terraform.tfvars

# Отредактируйте файл terraform.tfvars
nano terraform.tfvars
```

### 2. Заполните terraform.tfvars

```hcl
# Обязательные параметры
yandex_token     = "your-oauth-token-here"
yandex_cloud_id  = "your-cloud-id-here"
yandex_folder_id = "your-folder-id-here"

# SSH ключ (выберите один из вариантов)
# Вариант 1: Содержимое ключа (рекомендуется)
ssh_public_key   = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC... your-public-key-content-here"

# Вариант 2: Путь к файлу ключа (альтернатива)
# ssh_public_key_path = "~/.ssh/id_rsa.pub"

# Опциональные параметры (можно оставить по умолчанию)
yandex_zone      = "ru-central1-a"
vm_name          = "devops-vm"
vm_cores         = 2
vm_memory        = 4
ssh_user         = "ubuntu"
```

### Настройка SSH ключа

**Вариант 1 (рекомендуется): Содержимое ключа**
```bash
# Выведите содержимое публичного ключа
cat ~/.ssh/id_rsa.pub

# Скопируйте весь вывод и вставьте в переменную ssh_public_key
```

**Вариант 2: Путь к файлу ключа**
```hcl
# В terraform.tfvars укажите путь к ключу
ssh_public_key_path = "~/.ssh/id_rsa.pub"
```

### 3. Инициализация и развертывание

```bash
# Инициализация Terraform
terraform init

# Проверка конфигурации
terraform validate

# Просмотр плана развертывания
terraform plan

# Применение конфигурации
terraform apply
```

### 4. Подключение к ВМ

После успешного развертывания вы получите выходные данные с IP адресом и командой для подключения:

```bash
# Подключение по SSH
ssh ubuntu@<external-ip>

# Проверка установки Docker
docker --version
docker-compose --version
```

## Использование

### Развертывание вашего приложения

```bash
# Подключитесь к ВМ
ssh ubuntu@<external-ip>

# Склонируйте ваш проект
git clone <your-repository-url>
cd <your-project>

# Запустите приложение с помощью Docker Compose
docker-compose up -d

# Проверьте статус контейнеров
docker-compose ps
```

### Доступ к приложению

После развертывания приложение будет доступно по следующим адресам:
- Frontend: `http://<external-ip>:3000`
- Backend API: `http://<external-ip>:8080`
- Nginx (если настроен): `http://<external-ip>`

## Управление инфраструктурой

### Просмотр состояния

```bash
# Просмотр текущего состояния
terraform show

# Список ресурсов
terraform state list

# Получение выходных данных
terraform output
```

### Изменение конфигурации

```bash
# После изменения файлов конфигурации
terraform plan
terraform apply
```

### Удаление ресурсов

```bash
# Удаление всех созданных ресурсов
terraform destroy
```

## Настройка переменных

### Основные переменные

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `yandex_token` | OAuth токен | - |
| `yandex_cloud_id` | ID облака | - |
| `yandex_folder_id` | ID папки | - |
| `ssh_public_key` | Содержимое публичного SSH ключа | `null` |
| `ssh_public_key_path` | Путь к файлу SSH ключа | `null` |
| `yandex_zone` | Зона доступности | `ru-central1-a` |
| `vm_name` | Имя ВМ | `devops-vm` |
| `vm_cores` | Количество ядер | `2` |
| `vm_memory` | Объем памяти (ГБ) | `4` |
| `vm_disk_size` | Размер диска (ГБ) | `20` |
| `ssh_user` | Пользователь SSH | `ubuntu` |

### Примеры конфигураций

**Экономичная конфигурация:**
```hcl
vm_cores       = 2
vm_memory      = 2
vm_disk_size   = 10
vm_disk_type   = "network-hdd"
vm_preemptible = true
```

**Производительная конфигурация:**
```hcl
vm_cores       = 4
vm_memory      = 8
vm_disk_size   = 50
vm_disk_type   = "network-ssd"
vm_preemptible = false
```

## Безопасность

### Группа безопасности

Автоматически создается группа безопасности с правилами для:
- SSH (порт 22)
- HTTP (порт 80)
- HTTPS (порт 443)
- Backend API (порт 8080)
- Frontend Dev Server (порт 3000)

### Рекомендации

1. **Ограничьте SSH доступ** по IP адресам в production
2. **Используйте HTTPS** для production развертывания
3. **Регулярно обновляйте** систему и Docker
4. **Настройте мониторинг** и логирование

## Устранение неполадок

### Проблемы с SSH

```bash
# Проверьте права на SSH ключ
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub

# Проверьте подключение
ssh -v ubuntu@<external-ip>
```

### Проблемы с Docker

```bash
# Проверьте статус Docker на ВМ
sudo systemctl status docker

# Перезапустите Docker
sudo systemctl restart docker

# Проверьте логи cloud-init
sudo cat /var/log/cloud-init-output.log
```

### Проблемы с Terraform

```bash
# Обновите состояние
terraform refresh

# Проверьте логи
export TF_LOG=DEBUG
terraform apply
```

## Мониторинг и логи

### Просмотр логов на ВМ

```bash
# Логи cloud-init
sudo cat /var/log/cloud-init-output.log

# Логи Docker
sudo journalctl -u docker

# Логи приложения
docker-compose logs
```

### Мониторинг ресурсов

```bash
# Использование ресурсов
htop

# Использование диска
df -h

# Сетевые подключения
netstat -tulpn
```

## Поддержка

При возникновении проблем:

1. Проверьте логи Terraform: `terraform apply` с флагом `-auto-approve=false`
2. Проверьте логи cloud-init на ВМ: `/var/log/cloud-init-output.log`
3. Убедитесь в правильности заполнения `terraform.tfvars`
4. Проверьте квоты в Яндекс.Облаке

## Полезные ссылки

- [Документация Terraform](https://www.terraform.io/docs)
- [Провайдер Yandex Cloud](https://registry.terraform.io/providers/yandex-cloud/yandex/latest/docs)
- [Документация Яндекс.Облака](https://cloud.yandex.ru/docs)
- [Docker Documentation](https://docs.docker.com/)