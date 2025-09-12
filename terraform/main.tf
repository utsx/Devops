# Локальные переменные
locals {
  # Определяем SSH ключ: приоритет у ssh_public_key, если не задан - используем файл
  ssh_key = var.ssh_public_key != null ? var.ssh_public_key : (
    var.ssh_public_key_path != null ? file(var.ssh_public_key_path) : null
  )
}

# Валидация SSH ключа
resource "null_resource" "ssh_key_validation" {
  lifecycle {
    precondition {
      condition     = local.ssh_key != null && local.ssh_key != ""
      error_message = "SSH ключ должен быть задан через переменную ssh_public_key или ssh_public_key_path."
    }
  }
}

# Получение данных об образе ОС
data "yandex_compute_image" "ubuntu" {
  family = var.vm_image_family
}

# Создание VPC сети
resource "yandex_vpc_network" "devops_network" {
  name        = "${var.vm_name}-network"
  description = "Сеть для DevOps проекта"
  labels      = var.labels
}

# Создание подсети
resource "yandex_vpc_subnet" "devops_subnet" {
  name           = "${var.vm_name}-subnet"
  description    = "Подсеть для DevOps проекта"
  zone           = var.yandex_zone
  network_id     = yandex_vpc_network.devops_network.id
  v4_cidr_blocks = [var.subnet_cidr]
  labels         = var.labels
}

# Создание группы безопасности
resource "yandex_vpc_security_group" "devops_sg" {
  name        = "${var.vm_name}-security-group"
  description = "Группа безопасности для DevOps проекта"
  network_id  = yandex_vpc_network.devops_network.id
  labels      = var.labels

  # Входящий трафик
  ingress {
    description    = "SSH"
    protocol       = "TCP"
    port           = 22
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description    = "HTTP"
    protocol       = "TCP"
    port           = 80
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description    = "HTTPS"
    protocol       = "TCP"
    port           = 443
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description    = "Backend API"
    protocol       = "TCP"
    port           = 8080
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description    = "Frontend Dev Server"
    protocol       = "TCP"
    port           = 3000
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  # Исходящий трафик
  egress {
    description    = "All outbound traffic"
    protocol       = "ANY"
    from_port      = 0
    to_port        = 65535
    v4_cidr_blocks = ["0.0.0.0/0"]
  }
}

# Создание виртуальной машины
resource "yandex_compute_instance" "devops_vm" {
  name        = var.vm_name
  description = "Виртуальная машина для DevOps проекта"
  zone        = var.yandex_zone
  platform_id = var.vm_platform_id
  labels      = var.labels

  resources {
    cores         = var.vm_cores
    memory        = var.vm_memory
    core_fraction = var.vm_core_fraction
  }

  boot_disk {
    initialize_params {
      image_id = data.yandex_compute_image.ubuntu.id
      size     = var.vm_disk_size
      type     = var.vm_disk_type
    }
  }

  network_interface {
    subnet_id          = yandex_vpc_subnet.devops_subnet.id
    nat                = true
    security_group_ids = [yandex_vpc_security_group.devops_sg.id]
  }

  metadata = {
    ssh-keys = "${var.ssh_user}:${local.ssh_key}"
    user-data = templatefile("${path.module}/cloud-init.yaml", {
      ssh_user = var.ssh_user
      ssh_public_key = local.ssh_key
    })
  }

  scheduling_policy {
    preemptible = var.vm_preemptible
  }

  depends_on = [
    yandex_vpc_subnet.devops_subnet,
    yandex_vpc_security_group.devops_sg
  ]
}