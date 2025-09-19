# Локальные переменные
locals {
  ssh_key = var.ssh_public_key != null ? var.ssh_public_key : file(var.ssh_public_key_path)
}

# Создание VPC сети
resource "yandex_vpc_network" "k8s_network" {
  name        = "${var.k8s_cluster_name}-network"
  description = "Сеть для Kubernetes кластера"
  labels      = var.labels
}

# Создание подсети для кластера
resource "yandex_vpc_subnet" "k8s_subnet" {
  name           = "${var.k8s_cluster_name}-subnet"
  description    = "Подсеть для Kubernetes кластера"
  zone           = var.yandex_zone
  network_id     = yandex_vpc_network.k8s_network.id
  v4_cidr_blocks = [var.subnet_cidr]
  labels         = var.labels
}

# Создание сервисного аккаунта для кластера
resource "yandex_iam_service_account" "k8s_cluster_sa" {
  name        = var.k8s_service_account_name
  description = "Сервисный аккаунт для управления Kubernetes кластером"
  folder_id   = var.yandex_folder_id
}

# Назначение роли editor для сервисного аккаунта кластера
resource "yandex_resourcemanager_folder_iam_member" "k8s_cluster_sa_editor" {
  folder_id = var.yandex_folder_id
  role      = "editor"
  member    = "serviceAccount:${yandex_iam_service_account.k8s_cluster_sa.id}"
}

# Назначение роли container-registry.images.puller для загрузки образов
resource "yandex_resourcemanager_folder_iam_member" "k8s_cluster_sa_puller" {
  folder_id = var.yandex_folder_id
  role      = "container-registry.images.puller"
  member    = "serviceAccount:${yandex_iam_service_account.k8s_cluster_sa.id}"
}

# Создание сервисного аккаунта для узлов
resource "yandex_iam_service_account" "k8s_node_sa" {
  name        = "${var.k8s_service_account_name}-node"
  description = "Сервисный аккаунт для узлов Kubernetes кластера"
  folder_id   = var.yandex_folder_id
}

# Назначение роли container-registry.images.puller для узлов
resource "yandex_resourcemanager_folder_iam_member" "k8s_node_sa_puller" {
  folder_id = var.yandex_folder_id
  role      = "container-registry.images.puller"
  member    = "serviceAccount:${yandex_iam_service_account.k8s_node_sa.id}"
}

# Создание Kubernetes кластера
resource "yandex_kubernetes_cluster" "k8s_cluster" {
  name        = var.k8s_cluster_name
  description = "Managed Kubernetes кластер для DevOps проекта"
  folder_id   = var.yandex_folder_id
  labels      = var.labels

  network_id = yandex_vpc_network.k8s_network.id

  master {
    version = var.k8s_version
    zonal {
      zone      = var.yandex_zone
      subnet_id = yandex_vpc_subnet.k8s_subnet.id
    }

    public_ip = true

    security_group_ids = [yandex_vpc_security_group.k8s_sg.id]

    maintenance_policy {
      auto_upgrade = true
      maintenance_window {
        day        = "monday"
        start_time = "15:00"
        duration   = "3h"
      }
    }
  }

  service_account_id      = yandex_iam_service_account.k8s_cluster_sa.id
  node_service_account_id = yandex_iam_service_account.k8s_node_sa.id

  release_channel         = var.k8s_release_channel
  network_policy_provider = var.k8s_network_policy_provider

  depends_on = [
    yandex_resourcemanager_folder_iam_member.k8s_cluster_sa_editor,
    yandex_resourcemanager_folder_iam_member.k8s_cluster_sa_puller,
    yandex_resourcemanager_folder_iam_member.k8s_node_sa_puller,
  ]
}

# Создание группы узлов
resource "yandex_kubernetes_node_group" "k8s_node_group" {
  cluster_id  = yandex_kubernetes_cluster.k8s_cluster.id
  name        = var.node_group_name
  description = "Группа узлов для DevOps приложений"
  version     = var.k8s_version
  labels      = var.labels

  instance_template {
    platform_id = var.node_group_platform_id

    network_interface {
      nat                = true
      subnet_ids         = [yandex_vpc_subnet.k8s_subnet.id]
      security_group_ids = [yandex_vpc_security_group.k8s_sg.id]
    }

    resources {
      memory        = var.node_group_memory
      cores         = var.node_group_cores
      core_fraction = var.node_group_core_fraction
    }

    boot_disk {
      type = var.node_group_disk_type
      size = var.node_group_disk_size
    }

    scheduling_policy {
      preemptible = var.node_group_preemptible
    }

    container_runtime {
      type = "containerd"
    }

    metadata = {
      ssh-keys = "${var.ssh_user}:${local.ssh_key}"
    }
  }

  scale_policy {
    fixed_scale {
      size = var.node_group_replicas
    }
  }

  allocation_policy {
    location {
      zone = var.yandex_zone
    }
  }

  maintenance_policy {
    auto_upgrade = true
    auto_repair  = true
    maintenance_window {
      day        = "monday"
      start_time = "15:00"
      duration   = "3h"
    }
  }

  depends_on = [
    yandex_kubernetes_cluster.k8s_cluster
  ]
}

# Создание группы безопасности для кластера
resource "yandex_vpc_security_group" "k8s_sg" {
  name        = "${var.k8s_cluster_name}-security-group"
  description = "Группа безопасности для Kubernetes кластера"
  network_id  = yandex_vpc_network.k8s_network.id
  labels      = var.labels

  # Правила для кластера Kubernetes
  ingress {
    description    = "Kubernetes API"
    protocol       = "TCP"
    port           = 443
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description    = "Kubernetes API (альтернативный порт)"
    protocol       = "TCP"
    port           = 6443
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  # Правила для приложений
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

  # NodePort диапазон
  ingress {
    description    = "NodePort Services"
    protocol       = "TCP"
    from_port      = 30000
    to_port        = 32767
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH доступ к узлам
  ingress {
    description    = "SSH"
    protocol       = "TCP"
    port           = 22
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  # Внутренний трафик кластера
  ingress {
    description       = "Cluster internal communication"
    protocol          = "ANY"
    from_port         = 0
    to_port           = 65535
    predefined_target = "self_security_group"
  }

  # Трафик между подами и сервисами (согласно документации Yandex Cloud)
  ingress {
    description    = "Pod-to-Pod and Services communication"
    protocol       = "ANY"
    from_port      = 0
    to_port        = 65535
    v4_cidr_blocks = ["10.96.0.0/16", "10.112.0.0/16"]
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

# Конфигурация провайдера Kubernetes
provider "kubernetes" {
  host                   = yandex_kubernetes_cluster.k8s_cluster.master[0].external_v4_endpoint
  cluster_ca_certificate = yandex_kubernetes_cluster.k8s_cluster.master[0].cluster_ca_certificate
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "yc"
    args = [
      "k8s", "create-token",
      "--cluster-id", yandex_kubernetes_cluster.k8s_cluster.id
    ]
  }
}

# Применение манифестов мониторинга через kubectl
resource "null_resource" "apply_monitoring" {
  provisioner "local-exec" {
    command = "kubectl apply -f ${path.module}/monitoring.yaml"
  }

  depends_on = [
    yandex_kubernetes_cluster.k8s_cluster,
    yandex_kubernetes_node_group.k8s_node_group
  ]
}

# Применение дашбордов Grafana
resource "null_resource" "apply_grafana_dashboards" {
  provisioner "local-exec" {
    command = "kubectl apply -f ${path.module}/grafana-dashboards.yaml"
  }

  depends_on = [
    null_resource.apply_monitoring
  ]
}

