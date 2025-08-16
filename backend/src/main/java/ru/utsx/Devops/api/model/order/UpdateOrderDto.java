package ru.utsx.Devops.api.model.order;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UpdateOrderDto {
    @JsonProperty("delivery_date")
    private LocalDate deliveryDate;
    private BigDecimal total;
}