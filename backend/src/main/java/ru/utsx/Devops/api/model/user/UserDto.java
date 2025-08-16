package ru.utsx.Devops.api.model.user;

import java.time.Instant;
import java.util.List;

import lombok.Builder;
import lombok.Data;
import ru.utsx.Devops.api.model.order.OrderDto;

@Data
@Builder
public class UserDto {
    private final Long id;
    private final String username;
    private final String email;
    private final Instant createdAt;
    private final Instant updatedAt;
    List<OrderDto> orders;
}
