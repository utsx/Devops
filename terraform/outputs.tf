# Выходные данные для Kubernetes кластера
output "cluster_id" {
  description = "ID Kubernetes кластера"
  value       = yandex_kubernetes_cluster.k8s_cluster.id
}

output "cluster_name" {
  description = "Имя Kubernetes кластера"
  value       = yandex_kubernetes_cluster.k8s_cluster.name
}

output "cluster_status" {
  description = "Статус Kubernetes кластера"
  value       = yandex_kubernetes_cluster.k8s_cluster.status
}

output "cluster_version" {
  description = "Версия Kubernetes кластера"
  value       = yandex_kubernetes_cluster.k8s_cluster.master[0].version
}

output "cluster_endpoint" {
  description = "Внешний endpoint Kubernetes API"
  value       = yandex_kubernetes_cluster.k8s_cluster.master[0].external_v4_endpoint
}

output "cluster_internal_endpoint" {
  description = "Внутренний endpoint Kubernetes API"
  value       = yandex_kubernetes_cluster.k8s_cluster.master[0].internal_v4_endpoint
}

output "cluster_ca_certificate" {
  description = "CA сертификат кластера (base64)"
  value       = yandex_kubernetes_cluster.k8s_cluster.master[0].cluster_ca_certificate
  sensitive   = true
}

# Выходные данные для группы узлов
output "node_group_id" {
  description = "ID группы узлов"
  value       = yandex_kubernetes_node_group.k8s_node_group.id
}

output "node_group_name" {
  description = "Имя группы узлов"
  value       = yandex_kubernetes_node_group.k8s_node_group.name
}

output "node_group_status" {
  description = "Статус группы узлов"
  value       = yandex_kubernetes_node_group.k8s_node_group.status
}

output "node_group_version" {
  description = "Версия Kubernetes для группы узлов"
  value       = yandex_kubernetes_node_group.k8s_node_group.version
}

# Выходные данные для сети
output "network_id" {
  description = "ID сети"
  value       = yandex_vpc_network.k8s_network.id
}

output "subnet_id" {
  description = "ID подсети"
  value       = yandex_vpc_subnet.k8s_subnet.id
}

output "security_group_id" {
  description = "ID группы безопасности"
  value       = yandex_vpc_security_group.k8s_sg.id
}

# Выходные данные для сервисных аккаунтов
output "cluster_service_account_id" {
  description = "ID сервисного аккаунта кластера"
  value       = yandex_iam_service_account.k8s_cluster_sa.id
}

output "node_service_account_id" {
  description = "ID сервисного аккаунта узлов"
  value       = yandex_iam_service_account.k8s_node_sa.id
}

# Команды для подключения к кластеру
output "kubectl_config_command" {
  description = "Команда для настройки kubectl"
  value       = "yc managed-kubernetes cluster get-credentials ${yandex_kubernetes_cluster.k8s_cluster.name} --external"
}

output "cluster_info" {
  description = "Основная информация о кластере"
  value = {
    cluster_name    = yandex_kubernetes_cluster.k8s_cluster.name
    cluster_id      = yandex_kubernetes_cluster.k8s_cluster.id
    endpoint        = yandex_kubernetes_cluster.k8s_cluster.master[0].external_v4_endpoint
    version         = yandex_kubernetes_cluster.k8s_cluster.master[0].version
    zone            = var.yandex_zone
    node_group_name = yandex_kubernetes_node_group.k8s_node_group.name
  }
}

# Информация для развертывания приложений
output "deployment_info" {
  description = "Информация для развертывания приложений"
  value = {
    frontend_image = "utsx/devops-frontend:latest"
    backend_image  = "utsx/devops-backend:latest"
    namespace      = "devops-app"
  }
}

# Полезные команды
output "useful_commands" {
  description = "Полезные команды для работы с кластером"
  value = {
    get_credentials = "yc managed-kubernetes cluster get-credentials ${yandex_kubernetes_cluster.k8s_cluster.name} --external"
    get_nodes       = "kubectl get nodes"
    get_pods        = "kubectl get pods -n devops-app"
    get_services    = "kubectl get services -n devops-app"
    get_ingress     = "kubectl get ingress -n devops-app"
    cluster_info    = "kubectl cluster-info"
    app_logs_backend = "kubectl logs -n devops-app -l app=devops-backend"
    app_logs_frontend = "kubectl logs -n devops-app -l app=devops-frontend"
  }
}

# URL приложения (доступен через NodePort)
output "application_url" {
  description = "URL для доступа к приложению через NodePort"
  value = "Выполните: kubectl get nodes -o wide && kubectl get services -n devops-app devops-frontend-service для получения внешнего IP ноды и NodePort"
}