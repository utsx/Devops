package ru.utsx.Devops.domain.orders;

import java.time.Instant;
import java.time.LocalDateTime;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.utsx.Devops.api.model.order.CreateOrderDto;
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

    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }

}
