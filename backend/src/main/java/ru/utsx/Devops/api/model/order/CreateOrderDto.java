package ru.utsx.Devops.api.model.order;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import ru.utsx.Devops.domain.orders.OrderStatus;

@Data
@Builder
public class CreateOrderDto {
    private Long userId;
    @JsonProperty("product_name")
    private String productName;
    @JsonProperty("delivery_date")
    private LocalDate deliveryDate;
    private OrderStatus status;
    private BigDecimal total;
}
