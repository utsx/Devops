# Переменные для аутентификации в Yandex Cloud
variable "yandex_token" {
  description = "OAuth токен для доступа к Yandex Cloud"
  type        = string
  sensitive   = true
}

variable "yandex_cloud_id" {
  description = "ID облака в Yandex Cloud"
  type        = string
}

variable "yandex_folder_id" {
  description = "ID папки в Yandex Cloud"
  type        = string
}

variable "yandex_zone" {
  description = "Зона доступности"
  type        = string
  default     = "ru-central1-a"
}

# Переменные для Kubernetes кластера
variable "k8s_cluster_name" {
  description = "Имя Kubernetes кластера"
  type        = string
  default     = "devops-k8s-cluster"
}

variable "k8s_version" {
  description = "Версия Kubernetes"
  type        = string
  default     = "1.28"
}

variable "k8s_release_channel" {
  description = "Канал обновлений Kubernetes"
  type        = string
  default     = "STABLE"
  validation {
    condition     = contains(["RAPID", "REGULAR", "STABLE"], var.k8s_release_channel)
    error_message = "Канал обновлений должен быть одним из: RAPID, REGULAR, STABLE."
  }
}

variable "k8s_network_policy_provider" {
  description = "Провайдер сетевых политик"
  type        = string
  default     = "CALICO"
}

variable "k8s_service_account_name" {
  description = "Имя сервисного аккаунта для кластера"
  type        = string
  default     = "k8s-cluster-sa"
}

# Переменные для группы узлов
variable "node_group_name" {
  description = "Имя группы узлов"
  type        = string
  default     = "devops-node-group"
}

variable "node_group_platform_id" {
  description = "Платформа для узлов"
  type        = string
  default     = "standard-v3"
}

variable "node_group_cores" {
  description = "Количество ядер CPU для узлов"
  type        = number
  default     = 2
}

variable "node_group_memory" {
  description = "Объем оперативной памяти для узлов в ГБ"
  type        = number
  default     = 4
}

variable "node_group_core_fraction" {
  description = "Гарантированная доля vCPU для узлов"
  type        = number
  default     = 100
}

variable "node_group_disk_size" {
  description = "Размер диска для узлов в ГБ"
  type        = number
  default     = 64
}

variable "node_group_disk_type" {
  description = "Тип диска для узлов"
  type        = string
  default     = "network-ssd"
}

variable "node_group_preemptible" {
  description = "Прерываемые узлы (дешевле)"
  type        = bool
  default     = false
}

variable "node_group_replicas" {
  description = "Количество узлов в группе"
  type        = number
  default     = 2
}


# Переменные для сети
variable "subnet_cidr" {
  description = "CIDR блок для подсети"
  type        = string
  default     = "10.2.0.0/16"
}

# SSH ключ для узлов кластера
variable "ssh_public_key" {
  description = "Содержимое публичного SSH ключа для узлов кластера"
  type        = string
  default     = null
}

variable "ssh_public_key_path" {
  description = "Путь к публичному SSH ключу"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "ssh_user" {
  description = "Имя пользователя для SSH подключения к узлам"
  type        = string
  default     = "ubuntu"
}

# Теги
variable "labels" {
  description = "Метки для ресурсов"
  type        = map(string)
  default = {
    project     = "devops"
    environment = "development"
    managed_by  = "terraform"
  }
}