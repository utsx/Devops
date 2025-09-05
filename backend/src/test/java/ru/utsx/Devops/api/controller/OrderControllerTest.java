package ru.utsx.Devops.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import ru.utsx.Devops.api.model.order.CreateOrderDto;
import ru.utsx.Devops.api.model.order.UpdateOrderDto;
import ru.utsx.Devops.core.AbstractTest;
import ru.utsx.Devops.domain.orders.Order;
import ru.utsx.Devops.domain.orders.OrderRepository;
import ru.utsx.Devops.domain.orders.OrderStatus;
import ru.utsx.Devops.domain.users.User;
import ru.utsx.Devops.domain.users.UserRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class OrderControllerTest extends AbstractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
        userRepository.deleteAll();

        // Создаем тестового пользователя
        testUser = User.builder()
                .username("testuser")
                .email("test@example.com")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        testUser = userRepository.save(testUser);

        // Создаем тестовый заказ
        testOrder = Order.builder()
                .user(testUser)
                .productName("Test Product")
                .deliveryDate(LocalDate.now().plusDays(7))
                .status(OrderStatus.CREATED)
                .total(new BigDecimal("99.99"))
                .build();
        testOrder = orderRepository.save(testOrder);
    }

    @Test
    void getAllOrders_ShouldReturnListOfOrders() throws Exception {
        // Given
        Order anotherOrder = Order.builder()
                .user(testUser)
                .productName("Another Product")
                .deliveryDate(LocalDate.now().plusDays(14))
                .status(OrderStatus.DELIVERED)
                .total(new BigDecimal("149.99"))
                .build();
        orderRepository.save(anotherOrder);

        // When & Then
        mockMvc.perform(get("/api/v1/orders"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].productName", is("Test Product")))
                .andExpect(jsonPath("$[0].status", is("CREATED")))
                .andExpect(jsonPath("$[0].total", is(99.99)))
                .andExpect(jsonPath("$[1].productName", is("Another Product")))
                .andExpect(jsonPath("$[1].status", is("DELIVERED")))
                .andExpect(jsonPath("$[1].total", is(149.99)));
    }

    @Test
    void getAllOrders_WhenNoOrders_ShouldReturnEmptyList() throws Exception {
        // Given
        orderRepository.deleteAll();

        // When & Then
        mockMvc.perform(get("/api/v1/orders"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void getOrder_WithValidId_ShouldReturnOrder() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/orders/{id}", testOrder.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(testOrder.getId().intValue())))
                .andExpect(jsonPath("$.userId", is(testUser.getId().intValue())))
                .andExpect(jsonPath("$.productName", is("Test Product")))
                .andExpect(jsonPath("$.status", is("CREATED")))
                .andExpect(jsonPath("$.total", is(99.99)));
    }

    @Test
    void getOrder_WithInvalidId_ShouldReturnNotFound() throws Exception {
        // Given
        Long nonExistentId = 999L;

        // When & Then
        mockMvc.perform(get("/api/v1/orders/{id}", nonExistentId))
                .andExpect(status().isNotFound());
    }

    @Test
    void createOrder_WithValidData_ShouldCreateOrder() throws Exception {
        // Given
        CreateOrderDto createOrderDto = CreateOrderDto.builder()
                .userId(testUser.getId())
                .productName("New Product")
                .deliveryDate(LocalDate.now().plusDays(10))
                .status(OrderStatus.CREATED)
                .total(new BigDecimal("199.99"))
                .build();

        // When & Then
        mockMvc.perform(put("/api/v1/orders/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createOrderDto)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", notNullValue()));
    }

    @Test
    void createOrder_WithInvalidUserId_ShouldReturnBadRequest() throws Exception {
        // Given
        CreateOrderDto createOrderDto = CreateOrderDto.builder()
                .userId(999L) // несуществующий пользователь
                .productName("New Product")
                .deliveryDate(LocalDate.now().plusDays(10))
                .status(OrderStatus.CREATED)
                .total(new BigDecimal("199.99"))
                .build();

        // When & Then
        mockMvc.perform(put("/api/v1/orders/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createOrderDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createOrder_WithNullData_ShouldReturnBadRequest() throws Exception {
        // Given - пустой объект
        CreateOrderDto createOrderDto = CreateOrderDto.builder().build();

        // When & Then
        mockMvc.perform(put("/api/v1/orders/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createOrderDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateOrder_WithValidData_ShouldUpdateOrder() throws Exception {
        // Given
        UpdateOrderDto updateOrderDto = UpdateOrderDto.builder()
                .deliveryDate(LocalDate.now().plusDays(21))
                .total(new BigDecimal("299.99"))
                .build();

        // When & Then
        mockMvc.perform(put("/api/v1/orders/update/{id}", testOrder.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateOrderDto)))
                .andExpect(status().isOk());

        // Verify the order was updated
        mockMvc.perform(get("/api/v1/orders/{id}", testOrder.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", is(299.99)));
    }

    @Test
    void updateOrder_WithInvalidId_ShouldReturnNotFound() throws Exception {
        // Given
        Long nonExistentId = 999L;
        UpdateOrderDto updateOrderDto = UpdateOrderDto.builder()
                .deliveryDate(LocalDate.now().plusDays(21))
                .total(new BigDecimal("299.99"))
                .build();

        // When & Then
        mockMvc.perform(put("/api/v1/orders/update/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateOrderDto)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteOrder_WithValidId_ShouldDeleteOrder() throws Exception {
        // When & Then
        mockMvc.perform(delete("/api/v1/orders/{id}", testOrder.getId()))
                .andExpect(status().isOk());

        // Verify the order was deleted
        mockMvc.perform(get("/api/v1/orders/{id}", testOrder.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteOrder_WithInvalidId_ShouldReturnNotFound() throws Exception {
        // Given
        Long nonExistentId = 999L;

        // When & Then
        mockMvc.perform(delete("/api/v1/orders/{id}", nonExistentId))
                .andExpect(status().isNotFound());
    }

    @Test
    void handleEntityNotFoundException_ShouldReturnNotFoundWithMessage() throws Exception {
        // Given
        Long nonExistentId = 999L;

        // When & Then
        mockMvc.perform(get("/api/v1/orders/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().string(containsString("Order not found")));
    }

    @Test
    void handleIllegalArgumentException_ShouldReturnBadRequestWithMessage() throws Exception {
        // Given - создаем заказ с некорректными данными
        CreateOrderDto createOrderDto = CreateOrderDto.builder()
                .userId(null) // null userId должен вызвать IllegalArgumentException
                .productName("New Product")
                .deliveryDate(LocalDate.now().plusDays(10))
                .status(OrderStatus.CREATED)
                .total(new BigDecimal("199.99"))
                .build();

        // When & Then
        mockMvc.perform(put("/api/v1/orders/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createOrderDto)))
                .andExpect(status().isBadRequest());
    }
}