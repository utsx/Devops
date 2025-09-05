package ru.utsx.Devops.api.mappers;

import org.junit.jupiter.api.Test;
import ru.utsx.Devops.api.model.order.OrderDto;
import ru.utsx.Devops.api.model.user.UserDto;
import ru.utsx.Devops.domain.orders.Order;
import ru.utsx.Devops.domain.orders.OrderStatus;
import ru.utsx.Devops.domain.users.User;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class UserMapperTest {

    @Test
    public void testToDtoWithoutOrders() {
        // Given
        Instant now = Instant.now();
        User user = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .createdAt(now)
                .updatedAt(now)
                .orders(Collections.emptyList())
                .build();

        // When
        UserDto userDto = UserMapper.toDto(user);

        // Then
        assertNotNull(userDto);
        assertEquals(1L, userDto.getId());
        assertEquals("testuser", userDto.getUsername());
        assertEquals("test@example.com", userDto.getEmail());
        assertEquals(now, userDto.getCreatedAt());
        assertEquals(now, userDto.getUpdatedAt());
        assertNotNull(userDto.getOrders());
        assertTrue(userDto.getOrders().isEmpty());
    }

    @Test
    public void testToDtoWithOrders() {
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

        Order order1 = Order.builder()
                .id(10L)
                .productName("Product 1")
                .deliveryDate(deliveryDate)
                .status(OrderStatus.CREATED)
                .total(new BigDecimal("99.99"))
                .user(user)
                .build();

        Order order2 = Order.builder()
                .id(20L)
                .productName("Product 2")
                .deliveryDate(deliveryDate.plusDays(1))
                .status(OrderStatus.DELIVERED)
                .total(new BigDecimal("149.99"))
                .user(user)
                .build();

        user.setOrders(Arrays.asList(order1, order2));

        // When
        UserDto userDto = UserMapper.toDto(user);

        // Then
        assertNotNull(userDto);
        assertEquals(1L, userDto.getId());
        assertEquals("testuser", userDto.getUsername());
        assertEquals("test@example.com", userDto.getEmail());
        assertEquals(now, userDto.getCreatedAt());
        assertEquals(now, userDto.getUpdatedAt());
        
        List<OrderDto> orders = userDto.getOrders();
        assertNotNull(orders);
        assertEquals(2, orders.size());

        // Проверяем первый заказ
        OrderDto orderDto1 = orders.get(0);
        assertEquals(10L, orderDto1.getId());
        assertEquals(1L, orderDto1.getUserId());
        assertEquals("Product 1", orderDto1.getProductName());
        assertEquals(deliveryDate, orderDto1.getDeliveryDate());
        assertEquals(OrderStatus.CREATED, orderDto1.getStatus());
        assertEquals(new BigDecimal("99.99"), orderDto1.getTotal());

        // Проверяем второй заказ
        OrderDto orderDto2 = orders.get(1);
        assertEquals(20L, orderDto2.getId());
        assertEquals(1L, orderDto2.getUserId());
        assertEquals("Product 2", orderDto2.getProductName());
        assertEquals(deliveryDate.plusDays(1), orderDto2.getDeliveryDate());
        assertEquals(OrderStatus.DELIVERED, orderDto2.getStatus());
        assertEquals(new BigDecimal("149.99"), orderDto2.getTotal());
    }

    @Test
    public void testToDtoWithNullUser() {
        // Given
        User user = null;

        // When & Then
        assertThrows(NullPointerException.class, () -> {
            UserMapper.toDto(user);
        });
    }

    @Test
    public void testToDtoWithNullFields() {
        // Given
        User user = User.builder()
                .id(null)
                .username(null)
                .email(null)
                .createdAt(null)
                .updatedAt(null)
                .orders(null)
                .build();

        // When & Then
        assertThrows(NullPointerException.class, () -> {
            UserMapper.toDto(user);
        });
    }

    @Test
    public void testToDtoWithMinimalValidData() {
        // Given
        Instant now = Instant.now();
        User user = User.builder()
                .id(1L)
                .username("user")
                .email("user@test.com")
                .createdAt(now)
                .updatedAt(now)
                .orders(Collections.emptyList())
                .build();

        // When
        UserDto userDto = UserMapper.toDto(user);

        // Then
        assertNotNull(userDto);
        assertEquals(1L, userDto.getId());
        assertEquals("user", userDto.getUsername());
        assertEquals("user@test.com", userDto.getEmail());
        assertEquals(now, userDto.getCreatedAt());
        assertEquals(now, userDto.getUpdatedAt());
        assertNotNull(userDto.getOrders());
        assertTrue(userDto.getOrders().isEmpty());
    }
}