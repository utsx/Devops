package ru.utsx.Devops.domain.orders;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderQueryService {

    private final OrderRepository orderRepository;

    public Order getOrder(Long id) {
        return orderRepository.findByIdOrThrow(id);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

}
