# Выходные данные для виртуальной машины
output "vm_id" {
  description = "ID виртуальной машины"
  value       = yandex_compute_instance.devops_vm.id
}

output "vm_name" {
  description = "Имя виртуальной машины"
  value       = yandex_compute_instance.devops_vm.name
}

output "vm_fqdn" {
  description = "FQDN виртуальной машины"
  value       = yandex_compute_instance.devops_vm.fqdn
}

output "vm_internal_ip" {
  description = "Внутренний IP адрес виртуальной машины"
  value       = yandex_compute_instance.devops_vm.network_interface.0.ip_address
}

output "vm_external_ip" {
  description = "Внешний IP адрес виртуальной машины"
  value       = yandex_compute_instance.devops_vm.network_interface.0.nat_ip_address
}

output "vm_zone" {
  description = "Зона размещения виртуальной машины"
  value       = yandex_compute_instance.devops_vm.zone
}

# Выходные данные для сети
output "network_id" {
  description = "ID сети"
  value       = yandex_vpc_network.devops_network.id
}

output "subnet_id" {
  description = "ID подсети"
  value       = yandex_vpc_subnet.devops_subnet.id
}

output "security_group_id" {
  description = "ID группы безопасности"
  value       = yandex_vpc_security_group.devops_sg.id
}

# Информация для подключения
output "ssh_connection_command" {
  description = "Команда для SSH подключения к виртуальной машине"
  value       = "ssh ${var.ssh_user}@${yandex_compute_instance.devops_vm.network_interface.0.nat_ip_address}"
}

output "application_urls" {
  description = "URL-адреса для доступа к приложению"
  value = {
    frontend    = "http://${yandex_compute_instance.devops_vm.network_interface.0.nat_ip_address}:3000"
    backend_api = "http://${yandex_compute_instance.devops_vm.network_interface.0.nat_ip_address}:8080"
    nginx       = "http://${yandex_compute_instance.devops_vm.network_interface.0.nat_ip_address}"
  }
}

# Информация о ресурсах
output "vm_resources" {
  description = "Информация о ресурсах виртуальной машины"
  value = {
    cores         = yandex_compute_instance.devops_vm.resources.0.cores
    memory        = yandex_compute_instance.devops_vm.resources.0.memory
    core_fraction = yandex_compute_instance.devops_vm.resources.0.core_fraction
    disk_size     = var.vm_disk_size
    disk_type     = var.vm_disk_type
    preemptible   = var.vm_preemptible
  }
}