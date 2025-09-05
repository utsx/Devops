package ru.utsx.Devops.api.mappers;

import org.junit.jupiter.api.Test;
import ru.utsx.Devops.api.model.order.OrderDto;
import ru.utsx.Devops.domain.orders.Order;
import ru.utsx.Devops.domain.orders.OrderStatus;
import ru.utsx.Devops.domain.users.User;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

public class OrderMapperTest {

    @Test
    public void testToDtoWithValidOrder() {
        // Given
        Instant now = Instant.now();
        LocalDate deliveryDate = LocalDate.of(2024, 12, 25);
        
        User user = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .createdAt(now)
                .updatedAt(now)
                .build();

        Order order = Order.builder()
                .id(10L)
                .productName("Test Product")
                .deliveryDate(deliveryDate)
                .status(OrderStatus.CREATED)
                .total(new BigDecimal("99.99"))
                .user(user)
                .createdAt(now)
                .updatedAt(now)
                .build();

        // When
        OrderDto orderDto = OrderMapper.toDto(order);

        // Then
        assertNotNull(orderDto);
        assertEquals(10L, orderDto.getId());
        assertEquals(1L, orderDto.getUserId());
        assertEquals("Test Product", orderDto.getProductName());
        assertEquals(deliveryDate, orderDto.getDeliveryDate());
        assertEquals(OrderStatus.CREATED, orderDto.getStatus());
        assertEquals(new BigDecimal("99.99"), orderDto.getTotal());
    }

    @Test
    public void testToDtoWithDeliveredStatus() {
        // Given
        Instant now = Instant.now();
        LocalDate deliveryDate = LocalDate.of(2024, 11, 15);
        
        User user = User.builder()
                .id(2L)
                .username("customer")
                .email("customer@example.com")
                .createdAt(now)
                .updatedAt(now)
                .build();

        Order order = Order.builder()
                .id(20L)
                .productName("Delivered Product")
                .deliveryDate(deliveryDate)
                .status(OrderStatus.DELIVERED)
                .total(new BigDecimal("149.50"))
                .user(user)
                .createdAt(now)
                .updatedAt(now)
                .build();

        // When
        OrderDto orderDto = OrderMapper.toDto(order);

        // Then
        assertNotNull(orderDto);
        assertEquals(20L, orderDto.getId());
        assertEquals(2L, orderDto.getUserId());
        assertEquals("Delivered Product", orderDto.getProductName());
        assertEquals(deliveryDate, orderDto.getDeliveryDate());
        assertEquals(OrderStatus.DELIVERED, orderDto.getStatus());
        assertEquals(new BigDecimal("149.50"), orderDto.getTotal());
    }

    @Test
    public void testToDtoWithCancelledStatus() {
        // Given
        Instant now = Instant.now();
        LocalDate deliveryDate = LocalDate.of(2024, 10, 10);
        
        User user = User.builder()
                .id(3L)
                .username("cancelleduser")
                .email("cancelled@example.com")
                .createdAt(now)
                .updatedAt(now)
                .build();

        Order order = Order.builder()
                .id(30L)
                .productName("Cancelled Product")
                .deliveryDate(deliveryDate)
                .status(OrderStatus.CANCELLED)
                .total(new BigDecimal("75.25"))
                .user(user)
                .createdAt(now)
                .updatedAt(now)
                .build();

        // When
        OrderDto orderDto = OrderMapper.toDto(order);

        // Then
        assertNotNull(orderDto);
        assertEquals(30L, orderDto.getId());
        assertEquals(3L, orderDto.getUserId());
        assertEquals("Cancelled Product", orderDto.getProductName());
        assertEquals(deliveryDate, orderDto.getDeliveryDate());
        assertEquals(OrderStatus.CANCELLED, orderDto.getStatus());
        assertEquals(new BigDecimal("75.25"), orderDto.getTotal());
    }

    @Test
    public void testToDtoWithZeroTotal() {
        // Given
        Instant now = Instant.now();
        LocalDate deliveryDate = LocalDate.of(2024, 12, 1);
        
        User user = User.builder()
                .id(4L)
                .username("freeuser")
                .email("free@example.com")
                .createdAt(now)
                .updatedAt(now)
                .build();

        Order order = Order.builder()
                .id(40L)
                .productName("Free Product")
                .deliveryDate(deliveryDate)
                .status(OrderStatus.CREATED)
                .total(BigDecimal.ZERO)
                .user(user)
                .createdAt(now)
                .updatedAt(now)
                .build();

        // When
        OrderDto orderDto = OrderMapper.toDto(order);

        // Then
        assertNotNull(orderDto);
        assertEquals(40L, orderDto.getId());
        assertEquals(4L, orderDto.getUserId());
        assertEquals("Free Product", orderDto.getProductName());
        assertEquals(deliveryDate, orderDto.getDeliveryDate());
        assertEquals(OrderStatus.CREATED, orderDto.getStatus());
        assertEquals(BigDecimal.ZERO, orderDto.getTotal());
    }

    @Test
    public void testToDtoWithNullOrder() {
        // Given
        Order order = null;

        // When & Then
        assertThrows(NullPointerException.class, () -> {
            OrderMapper.toDto(order);
        });
    }

    @Test
    public void testToDtoWithNullUser() {
        // Given
        LocalDate deliveryDate = LocalDate.of(2024, 12, 25);
        
        Order order = Order.builder()
                .id(50L)
                .productName("Product without user")
                .deliveryDate(deliveryDate)
                .status(OrderStatus.CREATED)
                .total(new BigDecimal("99.99"))
                .user(null)
                .build();

        // When & Then
        assertThrows(NullPointerException.class, () -> {
            OrderMapper.toDto(order);
        });
    }

    @Test
    public void testToDtoWithLargeTotal() {
        // Given
        Instant now = Instant.now();
        LocalDate deliveryDate = LocalDate.of(2024, 12, 31);
        
        User user = User.builder()
                .id(5L)
                .username("richuser")
                .email("rich@example.com")
                .createdAt(now)
                .updatedAt(now)
                .build();

        Order order = Order.builder()
                .id(60L)
                .productName("Expensive Product")
                .deliveryDate(deliveryDate)
                .status(OrderStatus.DELIVERED)
                .total(new BigDecimal("9999999.99"))
                .user(user)
                .createdAt(now)
                .updatedAt(now)
                .build();

        // When
        OrderDto orderDto = OrderMapper.toDto(order);

        // Then
        assertNotNull(orderDto);
        assertEquals(60L, orderDto.getId());
        assertEquals(5L, orderDto.getUserId());
        assertEquals("Expensive Product", orderDto.getProductName());
        assertEquals(deliveryDate, orderDto.getDeliveryDate());
        assertEquals(OrderStatus.DELIVERED, orderDto.getStatus());
        assertEquals(new BigDecimal("9999999.99"), orderDto.getTotal());
    }
}