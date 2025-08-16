package ru.utsx.Devops.api.facade;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import ru.utsx.Devops.api.mappers.OrderMapper;
import ru.utsx.Devops.api.model.order.CreateOrderDto;
import ru.utsx.Devops.api.model.order.OrderDto;
import ru.utsx.Devops.api.model.order.UpdateOrderDto;
import ru.utsx.Devops.domain.orders.OrderCommandService;
import ru.utsx.Devops.domain.orders.OrderQueryService;

import java.util.List;

@Component
@RequiredArgsConstructor
public class OrderFacade {

    private final OrderQueryService orderQueryService;
    private final OrderCommandService orderCommandService;

    public OrderDto getOrder(Long id) {
        return OrderMapper.toDto(orderQueryService.getOrder(id));
    }

    public List<OrderDto> getAllOrders() {
        return orderQueryService.getAllOrders().stream()
                .map(OrderMapper::toDto)
                .toList();
    }

    public Long createOrder(CreateOrderDto orderDto) {
        return orderCommandService.createOrder(orderDto);
    }

    public void updateOrder(Long id, UpdateOrderDto updateOrderDto) {
        orderCommandService.updateOrder(id, updateOrderDto);
    }

    public void deleteOrder(Long id) {
        orderCommandService.deleteOrder(id);
    }

}
