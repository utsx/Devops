package ru.utsx.Devops.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ru.utsx.Devops.api.facade.UserFacade;
import ru.utsx.Devops.api.model.user.CreateUserDto;
import ru.utsx.Devops.api.model.user.UpdateUserDto;
import ru.utsx.Devops.api.model.user.UserDto;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
class UserControllerUnitTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserFacade userFacade;

    @Test
    void getAllUsers_ShouldReturnListOfUsers() throws Exception {
        // Given
        List<UserDto> users = Arrays.asList(
                UserDto.builder()
                        .id(1L)
                        .username("user1")
                        .email("user1@example.com")
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .orders(Collections.emptyList())
                        .build(),
                UserDto.builder()
                        .id(2L)
                        .username("user2")
                        .email("user2@example.com")
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .orders(Collections.emptyList())
                        .build()
        );
        when(userFacade.getAllUsers()).thenReturn(users);

        // When & Then
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].username", is("user1")))
                .andExpect(jsonPath("$[0].email", is("user1@example.com")))
                .andExpect(jsonPath("$[1].id", is(2)))
                .andExpect(jsonPath("$[1].username", is("user2")))
                .andExpect(jsonPath("$[1].email", is("user2@example.com")));

        verify(userFacade).getAllUsers();
    }

    @Test
    void getAllUsers_WhenNoUsers_ShouldReturnEmptyList() throws Exception {
        // Given
        when(userFacade.getAllUsers()).thenReturn(Collections.emptyList());

        // When & Then
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));

        verify(userFacade).getAllUsers();
    }

    @Test
    void getUser_WithValidId_ShouldReturnUser() throws Exception {
        // Given
        Long userId = 1L;
        UserDto user = UserDto.builder()
                .id(userId)
                .username("testuser")
                .email("test@example.com")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .orders(Collections.emptyList())
                .build();
        when(userFacade.getUserById(userId)).thenReturn(user);

        // When & Then
        mockMvc.perform(get("/api/v1/users/{id}", userId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(userId.intValue())))
                .andExpect(jsonPath("$.username", is("testuser")))
                .andExpect(jsonPath("$.email", is("test@example.com")));

        verify(userFacade).getUserById(userId);
    }

    @Test
    void getUser_WithInvalidId_ShouldReturnNotFound() throws Exception {
        // Given
        Long userId = 999L;
        when(userFacade.getUserById(userId)).thenThrow(new EntityNotFoundException("User not found with id: " + userId));

        // When & Then
        mockMvc.perform(get("/api/v1/users/{id}", userId))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("User not found with id: " + userId)));

        verify(userFacade).getUserById(userId);
    }

    @Test
    void createUser_WithValidData_ShouldCreateUser() throws Exception {
        // Given
        CreateUserDto createUserDto = CreateUserDto.builder()
                .username("newuser")
                .email("newuser@example.com")
                .build();
        Long createdUserId = 1L;
        when(userFacade.createUser(any(CreateUserDto.class))).thenReturn(createdUserId);

        // When & Then
        mockMvc.perform(put("/api/v1/users/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createUserDto)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().string(createdUserId.toString()));

        verify(userFacade).createUser(any(CreateUserDto.class));
    }

    @Test
    void updateUser_WithValidData_ShouldUpdateUser() throws Exception {
        // Given
        Long userId = 1L;
        UpdateUserDto updateUserDto = UpdateUserDto.builder()
                .username("updateduser")
                .email("updated@example.com")
                .build();
        doNothing().when(userFacade).updateUser(eq(userId), any(UpdateUserDto.class));

        // When & Then
        mockMvc.perform(put("/api/v1/users/update/{id}", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateUserDto)))
                .andExpect(status().isOk());

        verify(userFacade).updateUser(eq(userId), any(UpdateUserDto.class));
    }

    @Test
    void updateUser_WithInvalidId_ShouldReturnNotFound() throws Exception {
        // Given
        Long userId = 999L;
        UpdateUserDto updateUserDto = UpdateUserDto.builder()
                .username("updateduser")
                .email("updated@example.com")
                .build();
        doThrow(new EntityNotFoundException("User not found with id: " + userId))
                .when(userFacade).updateUser(eq(userId), any(UpdateUserDto.class));

        // When & Then
        mockMvc.perform(put("/api/v1/users/update/{id}", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateUserDto)))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("User not found with id: " + userId)));

        verify(userFacade).updateUser(eq(userId), any(UpdateUserDto.class));
    }

    @Test
    void deleteUser_WithValidId_ShouldDeleteUser() throws Exception {
        // Given
        Long userId = 1L;
        doNothing().when(userFacade).deleteUser(userId);

        // When & Then
        mockMvc.perform(delete("/api/v1/users/{id}", userId))
                .andExpect(status().isOk());

        verify(userFacade).deleteUser(userId);
    }

    @Test
    void deleteUser_WithInvalidId_ShouldReturnNotFound() throws Exception {
        // Given
        Long userId = 999L;
        doThrow(new EntityNotFoundException("User not found with id: " + userId))
                .when(userFacade).deleteUser(userId);

        // When & Then
        mockMvc.perform(delete("/api/v1/users/{id}", userId))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("User not found with id: " + userId)));

        verify(userFacade).deleteUser(userId);
    }
}