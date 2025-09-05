package ru.utsx.Devops.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ru.utsx.Devops.api.facade.OrderFacade;
import ru.utsx.Devops.api.model.order.CreateOrderDto;
import ru.utsx.Devops.api.model.order.OrderDto;
import ru.utsx.Devops.api.model.order.UpdateOrderDto;
import ru.utsx.Devops.domain.orders.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OrderController.class)
class OrderControllerUnitTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderFacade orderFacade;

    @Test
    void getAllOrders_ShouldReturnListOfOrders() throws Exception {
        // Given
        List<OrderDto> orders = Arrays.asList(
                OrderDto.builder()
                        .id(1L)
                        .userId(1L)
                        .productName("Product 1")
                        .deliveryDate(LocalDate.now().plusDays(7))
                        .status(OrderStatus.CREATED)
                        .total(new BigDecimal("99.99"))
                        .build(),
                OrderDto.builder()
                        .id(2L)
                        .userId(2L)
                        .productName("Product 2")
                        .deliveryDate(LocalDate.now().plusDays(14))
                        .status(OrderStatus.DELIVERED)
                        .total(new BigDecimal("149.99"))
                        .build()
        );
        when(orderFacade.getAllOrders()).thenReturn(orders);

        // When & Then
        mockMvc.perform(get("/api/v1/orders"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].userId", is(1)))
                .andExpect(jsonPath("$[0].productName", is("Product 1")))
                .andExpect(jsonPath("$[0].status", is("CREATED")))
                .andExpect(jsonPath("$[0].total", is(99.99)))
                .andExpect(jsonPath("$[1].id", is(2)))
                .andExpect(jsonPath("$[1].userId", is(2)))
                .andExpect(jsonPath("$[1].productName", is("Product 2")))
                .andExpect(jsonPath("$[1].status", is("DELIVERED")))
                .andExpect(jsonPath("$[1].total", is(149.99)));

        verify(orderFacade).getAllOrders();
    }

    @Test
    void getAllOrders_WhenNoOrders_ShouldReturnEmptyList() throws Exception {
        // Given
        when(orderFacade.getAllOrders()).thenReturn(Collections.emptyList());

        // When & Then
        mockMvc.perform(get("/api/v1/orders"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));

        verify(orderFacade).getAllOrders();
    }

    @Test
    void getOrder_WithValidId_ShouldReturnOrder() throws Exception {
        // Given
        Long orderId = 1L;
        OrderDto order = OrderDto.builder()
                .id(orderId)
                .userId(1L)
                .productName("Test Product")
                .deliveryDate(LocalDate.now().plusDays(7))
                .status(OrderStatus.CREATED)
                .total(new BigDecimal("99.99"))
                .build();
        when(orderFacade.getOrder(orderId)).thenReturn(order);

        // When & Then
        mockMvc.perform(get("/api/v1/orders/{id}", orderId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(orderId.intValue())))
                .andExpect(jsonPath("$.userId", is(1)))
                .andExpect(jsonPath("$.productName", is("Test Product")))
                .andExpect(jsonPath("$.status", is("CREATED")))
                .andExpect(jsonPath("$.total", is(99.99)));

        verify(orderFacade).getOrder(orderId);
    }

    @Test
    void getOrder_WithInvalidId_ShouldReturnNotFound() throws Exception {
        // Given
        Long orderId = 999L;
        when(orderFacade.getOrder(orderId)).thenThrow(new EntityNotFoundException("Order not found with id: " + orderId));

        // When & Then
        mockMvc.perform(get("/api/v1/orders/{id}", orderId))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("Order not found with id: " + orderId)));

        verify(orderFacade).getOrder(orderId);
    }

    @Test
    void createOrder_WithValidData_ShouldCreateOrder() throws Exception {
        // Given
        CreateOrderDto createOrderDto = CreateOrderDto.builder()
                .userId(1L)
                .productName("New Product")
                .deliveryDate(LocalDate.now().plusDays(10))
                .status(OrderStatus.CREATED)
                .total(new BigDecimal("199.99"))
                .build();
        Long createdOrderId = 1L;
        when(orderFacade.createOrder(any(CreateOrderDto.class))).thenReturn(createdOrderId);

        // When & Then
        mockMvc.perform(put("/api/v1/orders/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createOrderDto)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().string(createdOrderId.toString()));

        verify(orderFacade).createOrder(any(CreateOrderDto.class));
    }

    @Test
    void createOrder_WithInvalidData_ShouldReturnBadRequest() throws Exception {
        // Given
        CreateOrderDto createOrderDto = CreateOrderDto.builder()
                .userId(999L) // несуществующий пользователь
                .productName("New Product")
                .deliveryDate(LocalDate.now().plusDays(10))
                .status(OrderStatus.CREATED)
                .total(new BigDecimal("199.99"))
                .build();
        when(orderFacade.createOrder(any(CreateOrderDto.class)))
                .thenThrow(new IllegalArgumentException("User not found with id: 999"));

        // When & Then
        mockMvc.perform(put("/api/v1/orders/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createOrderDto)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("User not found with id: 999")));

        verify(orderFacade).createOrder(any(CreateOrderDto.class));
    }

    @Test
    void updateOrder_WithValidData_ShouldUpdateOrder() throws Exception {
        // Given
        Long orderId = 1L;
        UpdateOrderDto updateOrderDto = UpdateOrderDto.builder()
                .deliveryDate(LocalDate.now().plusDays(21))
                .total(new BigDecimal("299.99"))
                .build();
        doNothing().when(orderFacade).updateOrder(eq(orderId), any(UpdateOrderDto.class));

        // When & Then
        mockMvc.perform(put("/api/v1/orders/update/{id}", orderId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateOrderDto)))
                .andExpect(status().isOk());

        verify(orderFacade).updateOrder(eq(orderId), any(UpdateOrderDto.class));
    }

    @Test
    void updateOrder_WithInvalidId_ShouldReturnNotFound() throws Exception {
        // Given
        Long orderId = 999L;
        UpdateOrderDto updateOrderDto = UpdateOrderDto.builder()
                .deliveryDate(LocalDate.now().plusDays(21))
                .total(new BigDecimal("299.99"))
                .build();
        doThrow(new EntityNotFoundException("Order not found with id: " + orderId))
                .when(orderFacade).updateOrder(eq(orderId), any(UpdateOrderDto.class));

        // When & Then
        mockMvc.perform(put("/api/v1/orders/update/{id}", orderId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateOrderDto)))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("Order not found with id: " + orderId)));

        verify(orderFacade).updateOrder(eq(orderId), any(UpdateOrderDto.class));
    }

    @Test
    void deleteOrder_WithValidId_ShouldDeleteOrder() throws Exception {
        // Given
        Long orderId = 1L;
        doNothing().when(orderFacade).deleteOrder(orderId);

        // When & Then
        mockMvc.perform(delete("/api/v1/orders/{id}", orderId))
                .andExpect(status().isOk());

        verify(orderFacade).deleteOrder(orderId);
    }

    @Test
    void deleteOrder_WithInvalidId_ShouldReturnNotFound() throws Exception {
        // Given
        Long orderId = 999L;
        doThrow(new EntityNotFoundException("Order not found with id: " + orderId))
                .when(orderFacade).deleteOrder(orderId);

        // When & Then
        mockMvc.perform(delete("/api/v1/orders/{id}", orderId))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("Order not found with id: " + orderId)));

        verify(orderFacade).deleteOrder(orderId);
    }

    @Test
    void handleIllegalArgumentException_ShouldReturnBadRequest() throws Exception {
        // Given
        CreateOrderDto createOrderDto = CreateOrderDto.builder()
                .userId(null) // null userId должен вызвать IllegalArgumentException
                .productName("New Product")
                .deliveryDate(LocalDate.now().plusDays(10))
                .status(OrderStatus.CREATED)
                .total(new BigDecimal("199.99"))
                .build();
        when(orderFacade.createOrder(any(CreateOrderDto.class)))
                .thenThrow(new IllegalArgumentException("User ID cannot be null"));

        // When & Then
        mockMvc.perform(put("/api/v1/orders/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createOrderDto)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("User ID cannot be null")));

        verify(orderFacade).createOrder(any(CreateOrderDto.class));
    }
}