package ru.utsx.Devops.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.utsx.Devops.api.model.order.CreateOrderDto;
import ru.utsx.Devops.domain.orders.Order;
import ru.utsx.Devops.domain.orders.OrderCommandService;
import ru.utsx.Devops.domain.orders.OrderRepository;
import ru.utsx.Devops.domain.orders.OrderStatus;
import ru.utsx.Devops.domain.users.User;
import ru.utsx.Devops.domain.users.UserRepository;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class OrderCommandServiceUnitTest {

    @Mock
    private OrderRepository orderRepository;
    
    @Mock
    private ru.utsx.Devops.domain.users.UserQueryService userQueryService;

    @InjectMocks
    private OrderCommandService orderCommandService;

    private User testUser;
    private CreateOrderDto createOrderDto;

    @BeforeEach
    public void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@test.com");

        createOrderDto = CreateOrderDto.builder()
                .userId(1L)
                .deliveryDate(LocalDate.now())
                .productName("Test product")
                .total(BigDecimal.valueOf(100))
                .status(OrderStatus.CREATED)
                .build();
    }

    @Test
    public void testCreateOrder() {
        // Given
        when(userQueryService.getUser(anyLong())).thenReturn(testUser);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(1L);
            return order;
        });

        // When
        Long orderId = orderCommandService.createOrder(createOrderDto);

        // Then
        verify(userQueryService).getUser(1L);
        verify(orderRepository).save(any(Order.class));
    }
}