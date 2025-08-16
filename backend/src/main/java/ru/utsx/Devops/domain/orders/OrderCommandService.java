package ru.utsx.Devops.domain.orders;

import java.time.Instant;
import java.time.LocalDateTime;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.utsx.Devops.api.model.order.CreateOrderDto;
import ru.utsx.Devops.api.model.order.UpdateOrderDto;
import ru.utsx.Devops.domain.users.UserQueryService;

@Service
@RequiredArgsConstructor
public class OrderCommandService {

    private final OrderRepository orderRepository;
    private final UserQueryService userQueryService;

    public Long createOrder(CreateOrderDto createOrderDto) {
        var user = userQueryService.getUser(createOrderDto.getUserId());
        var order = Order.builder()
                .user(user)
                .deliveryDate(createOrderDto.getDeliveryDate())
                .productName(createOrderDto.getProductName())
                .status(createOrderDto.getStatus())
                .total(createOrderDto.getTotal())
                .build();
        return orderRepository.save(order).getId();
    }

    public void updateOrder(Long id, UpdateOrderDto updateOrderDto) {
        var order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Заказ с ID " + id + " не найден"));
        
        // Валидация: новая дата доставки не может быть раньше текущей
        if (updateOrderDto.getDeliveryDate() != null &&
            updateOrderDto.getDeliveryDate().isBefore(order.getDeliveryDate())) {
            throw new IllegalArgumentException("Дата доставки не может быть перенесена на более раннюю дату");
        }
        
        if (updateOrderDto.getDeliveryDate() != null) {
            order.setDeliveryDate(updateOrderDto.getDeliveryDate());
        }
        
        if (updateOrderDto.getTotal() != null) {
            order.setTotal(updateOrderDto.getTotal());
        }
        
        orderRepository.save(order);
    }

    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }

}
