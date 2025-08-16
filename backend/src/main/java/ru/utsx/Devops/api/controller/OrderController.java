package ru.utsx.Devops.api.controller;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ru.utsx.Devops.api.model.order.CreateOrderDto;
import ru.utsx.Devops.api.model.order.OrderDto;
import ru.utsx.Devops.api.model.order.UpdateOrderDto;
import ru.utsx.Devops.api.facade.OrderFacade;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping(path = "/api/v1/orders")
public class OrderController {

    private final OrderFacade orderFacade;

    @GetMapping
    public List<OrderDto> getAllOrders() {
        return orderFacade.getAllOrders();
    }

    @GetMapping("/{id}")
    public OrderDto getOrder(@PathVariable Long id) {
        return orderFacade.getOrder(id);
    }

    @PutMapping("/create")
    public Long createOrder(@RequestBody CreateOrderDto orderDto) {
        return orderFacade.createOrder(orderDto);
    }

    @PutMapping("/update/{id}")
    public void updateOrder(@PathVariable Long id, @RequestBody UpdateOrderDto updateOrderDto) {
        orderFacade.updateOrder(id, updateOrderDto);
    }

    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable Long id) {
        orderFacade.deleteOrder(id);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<String> handleNoSuchElement(EntityNotFoundException e) {
        return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException e) {
        return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }

}
