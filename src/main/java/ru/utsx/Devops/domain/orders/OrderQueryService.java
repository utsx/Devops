package ru.utsx.Devops.domain.orders;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderQueryService {

    private final OrderRepository orderRepository;

    public Order getOrder(Long id) {
        return orderRepository.findByIdOrThrow(id);
    }

}
