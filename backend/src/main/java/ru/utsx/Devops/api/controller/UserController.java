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
import ru.utsx.Devops.api.facade.UserFacade;
import ru.utsx.Devops.api.model.user.CreateUserDto;
import ru.utsx.Devops.api.model.user.UpdateUserDto;
import ru.utsx.Devops.api.model.user.UserDto;
import java.util.List;

@RestController
@RequestMapping(path = "api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserFacade userFacade;

    @GetMapping
    public List<UserDto> getAllUsers() {
        return userFacade.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userFacade.getUserById(id);
    }

    @PutMapping("/create")
    public Long createUser(@RequestBody CreateUserDto userDto) {
        return userFacade.createUser(userDto);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userFacade.deleteUser(id);
    }

    @PutMapping("/update/{id}")
    public void updateUser(@PathVariable Long id, @RequestBody UpdateUserDto userDto) {
        userFacade.updateUser(id, userDto);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<String> handleNoSuchElement(EntityNotFoundException e) {
        return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
    }

}
