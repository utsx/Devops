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

# Переменные для виртуальной машины
variable "vm_name" {
  description = "Имя виртуальной машины"
  type        = string
  default     = "devops-vm"
}

variable "vm_platform_id" {
  description = "Платформа для ВМ"
  type        = string
  default     = "standard-v3"
}

variable "vm_cores" {
  description = "Количество ядер CPU"
  type        = number
  default     = 2
}

variable "vm_memory" {
  description = "Объем оперативной памяти в ГБ"
  type        = number
  default     = 4
}

variable "vm_core_fraction" {
  description = "Гарантированная доля vCPU"
  type        = number
  default     = 100
}

variable "vm_disk_size" {
  description = "Размер диска в ГБ"
  type        = number
  default     = 20
}

variable "vm_disk_type" {
  description = "Тип диска"
  type        = string
  default     = "network-hdd"
}

variable "vm_image_family" {
  description = "Семейство образа ОС"
  type        = string
  default     = "ubuntu-2204-lts"
}

variable "vm_preemptible" {
  description = "Прерываемая ВМ (дешевле)"
  type        = bool
  default     = false
}

# Переменные для сети
variable "subnet_cidr" {
  description = "CIDR блок для подсети"
  type        = string
  default     = "10.2.0.0/16"
}

# SSH ключ
variable "ssh_public_key" {
  description = "Содержимое публичного SSH ключа"
  type        = string
  default     = null
}

variable "ssh_public_key_path" {
  description = "Путь к публичному SSH ключу (альтернатива ssh_public_key)"
  type        = string
  default     = null
}

variable "ssh_user" {
  description = "Имя пользователя для SSH подключения"
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