package ru.utsx.Devops.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.RequiredArgsConstructor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import ru.utsx.Devops.api.model.order.CreateOrderDto;
import ru.utsx.Devops.core.AbstractTest;
import ru.utsx.Devops.domain.orders.OrderCommandService;
import ru.utsx.Devops.domain.orders.OrderStatus;
import ru.utsx.Devops.helpers.TestUserHelper;

public class OrderCommandServiceTest extends AbstractTest {

    @Autowired
    private TestUserHelper testUserHelper;
    @Autowired
    private OrderCommandService orderCommandService;

    private Long userId;

    @BeforeEach
    public void setUp() {
        userId = testUserHelper.createUser();
    }

    @Test
    public void testCreateOrder() {
        orderCommandService.createOrder(
                CreateOrderDto.builder()
                        .userId(userId)
                        .deliveryDate(LocalDate.now())
                        .productName("Test product")
                        .total(BigDecimal.valueOf(100))
                        .status(OrderStatus.CREATED)
                        .build()
        );
    }

}
