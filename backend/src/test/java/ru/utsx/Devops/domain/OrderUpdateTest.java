package ru.utsx.Devops.domain;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.utsx.Devops.api.model.order.UpdateOrderDto;
import ru.utsx.Devops.domain.orders.Order;
import ru.utsx.Devops.domain.orders.OrderCommandService;
import ru.utsx.Devops.domain.orders.OrderRepository;
import ru.utsx.Devops.domain.orders.OrderStatus;
import ru.utsx.Devops.domain.users.User;
import ru.utsx.Devops.domain.users.UserQueryService;

@ExtendWith(MockitoExtension.class)
class OrderUpdateTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserQueryService userQueryService;

    @InjectMocks
    private OrderCommandService orderCommandService;

    private Order existingOrder;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .build();

        existingOrder = Order.builder()
                .id(1L)
                .user(testUser)
                .productName("Test Product")
                .deliveryDate(LocalDate.of(2024, 12, 15))
                .status(OrderStatus.CREATED)
                .total(new BigDecimal("100.00"))
                .build();
    }

    @Test
    void updateOrder_ValidUpdate_Success() {
        // Given
        LocalDate newDeliveryDate = LocalDate.of(2024, 12, 20); // Позже текущей даты
        BigDecimal newTotal = new BigDecimal("150.00");
        
        UpdateOrderDto updateDto = UpdateOrderDto.builder()
                .deliveryDate(newDeliveryDate)
                .total(newTotal)
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(existingOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(existingOrder);

        // When
        orderCommandService.updateOrder(1L, updateDto);

        // Then
        verify(orderRepository).findById(1L);
        verify(orderRepository).save(existingOrder);
        assertEquals(newDeliveryDate, existingOrder.getDeliveryDate());
        assertEquals(newTotal, existingOrder.getTotal());
    }

    @Test
    void updateOrder_EarlierDeliveryDate_ThrowsException() {
        // Given
        LocalDate earlierDate = LocalDate.of(2024, 12, 10); // Раньше текущей даты (15 декабря)
        
        UpdateOrderDto updateDto = UpdateOrderDto.builder()
                .deliveryDate(earlierDate)
                .total(new BigDecimal("150.00"))
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(existingOrder));

        // When & Then
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> orderCommandService.updateOrder(1L, updateDto)
        );

        assertEquals("Дата доставки не может быть перенесена на более раннюю дату", exception.getMessage());
        verify(orderRepository).findById(1L);
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void updateOrder_SameDeliveryDate_Success() {
        // Given
        LocalDate sameDate = LocalDate.of(2024, 12, 15); // Та же дата
        BigDecimal newTotal = new BigDecimal("150.00");
        
        UpdateOrderDto updateDto = UpdateOrderDto.builder()
                .deliveryDate(sameDate)
                .total(newTotal)
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(existingOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(existingOrder);

        // When
        orderCommandService.updateOrder(1L, updateDto);

        // Then
        verify(orderRepository).findById(1L);
        verify(orderRepository).save(existingOrder);
        assertEquals(sameDate, existingOrder.getDeliveryDate());
        assertEquals(newTotal, existingOrder.getTotal());
    }

    @Test
    void updateOrder_OnlyTotal_Success() {
        // Given
        BigDecimal newTotal = new BigDecimal("200.00");
        
        UpdateOrderDto updateDto = UpdateOrderDto.builder()
                .total(newTotal)
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(existingOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(existingOrder);

        // When
        orderCommandService.updateOrder(1L, updateDto);

        // Then
        verify(orderRepository).findById(1L);
        verify(orderRepository).save(existingOrder);
        assertEquals(LocalDate.of(2024, 12, 15), existingOrder.getDeliveryDate()); // Дата не изменилась
        assertEquals(newTotal, existingOrder.getTotal());
    }

    @Test
    void updateOrder_OnlyDeliveryDate_Success() {
        // Given
        LocalDate newDeliveryDate = LocalDate.of(2024, 12, 25);
        
        UpdateOrderDto updateDto = UpdateOrderDto.builder()
                .deliveryDate(newDeliveryDate)
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(existingOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(existingOrder);

        // When
        orderCommandService.updateOrder(1L, updateDto);

        // Then
        verify(orderRepository).findById(1L);
        verify(orderRepository).save(existingOrder);
        assertEquals(newDeliveryDate, existingOrder.getDeliveryDate());
        assertEquals(new BigDecimal("100.00"), existingOrder.getTotal()); // Сумма не изменилась
    }

    @Test
    void updateOrder_OrderNotFound_ThrowsException() {
        // Given
        UpdateOrderDto updateDto = UpdateOrderDto.builder()
                .deliveryDate(LocalDate.of(2024, 12, 20))
                .total(new BigDecimal("150.00"))
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        EntityNotFoundException exception = assertThrows(
                EntityNotFoundException.class,
                () -> orderCommandService.updateOrder(1L, updateDto)
        );

        assertEquals("Заказ с ID 1 не найден", exception.getMessage());
        verify(orderRepository).findById(1L);
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void updateOrder_NullFields_NoChanges() {
        // Given
        UpdateOrderDto updateDto = UpdateOrderDto.builder().build(); // Все поля null

        when(orderRepository.findById(1L)).thenReturn(Optional.of(existingOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(existingOrder);

        // When
        orderCommandService.updateOrder(1L, updateDto);

        // Then
        verify(orderRepository).findById(1L);
        verify(orderRepository).save(existingOrder);
        assertEquals(LocalDate.of(2024, 12, 15), existingOrder.getDeliveryDate()); // Дата не изменилась
        assertEquals(new BigDecimal("100.00"), existingOrder.getTotal()); // Сумма не изменилась
    }
}