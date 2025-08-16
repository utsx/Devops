package ru.utsx.Devops.domain.orders;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;


public interface OrderRepository extends JpaRepository<Order, Long> {

    default Order findByIdOrThrow(Long id) {
        return findById(id).orElseThrow(() -> new EntityNotFoundException("Order not found with id " + id));
    }

}
