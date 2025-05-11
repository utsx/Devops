package ru.utsx.Devops.api.mappers;


import ru.utsx.Devops.api.model.order.OrderDto;
import ru.utsx.Devops.domain.orders.Order;

public class OrderMapper {

    public static OrderDto toDto(Order order) {
        return OrderDto.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .deliveryDate(order.getDeliveryDate())
                .productName(order.getProductName())
                .status(order.getStatus())
                .total(order.getTotal())
                .build();
    }

}
