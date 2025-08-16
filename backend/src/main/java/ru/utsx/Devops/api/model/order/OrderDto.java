package ru.utsx.Devops.api.model.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ru.utsx.Devops.domain.orders.OrderStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {
    private Long id;
    private Long userId;
    private String productName;
    private LocalDate deliveryDate;
    private OrderStatus status;
    private BigDecimal total;
}
