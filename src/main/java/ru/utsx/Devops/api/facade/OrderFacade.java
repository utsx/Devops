package ru.utsx.Devops.api.facade;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import ru.utsx.Devops.api.mappers.OrderMapper;
import ru.utsx.Devops.api.model.order.CreateOrderDto;
import ru.utsx.Devops.api.model.order.OrderDto;
import ru.utsx.Devops.domain.orders.OrderCommandService;
import ru.utsx.Devops.domain.orders.OrderQueryService;

@Component
@RequiredArgsConstructor
public class OrderFacade {

    private final OrderQueryService orderQueryService;
    private final OrderCommandService orderCommandService;

    public OrderDto getOrder(Long id) {
        return OrderMapper.toDto(orderQueryService.getOrder(id));
    }

    public Long createOrder(CreateOrderDto orderDto) {
        return orderCommandService.createOrder(orderDto);
    }

    public void deleteOrder(Long id) {
        orderCommandService.deleteOrder(id);
    }

}
