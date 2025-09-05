package ru.utsx.Devops.domain;

import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.utsx.Devops.api.model.user.CreateUserDto;
import ru.utsx.Devops.api.model.user.UpdateUserDto;
import ru.utsx.Devops.domain.users.User;
import ru.utsx.Devops.domain.users.UserCommandService;
import ru.utsx.Devops.domain.users.UserRepository;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserCommandServiceUnitTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserCommandService userCommandService;

    private User testUser;
    private CreateUserDto createUserDto;
    private UpdateUserDto updateUserDto;

    @BeforeEach
    public void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .orders(List.of())
                .build();

        createUserDto = CreateUserDto.builder()
                .username("testuser")
                .email("test@example.com")
                .build();

        updateUserDto = UpdateUserDto.builder()
                .username("updateduser")
                .email("updated@example.com")
                .build();
    }

    @Test
    public void testCreateUser() {
        // Given
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });

        // When
        Long userId = userCommandService.createUser(createUserDto);

        // Then
        assertEquals(1L, userId);
        verify(userRepository).save(any(User.class));
    }

    @Test
    public void testUpdateUser() {
        // Given
        when(userRepository.findByIdOrThrow(anyLong())).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        userCommandService.updateUser(1L, updateUserDto);

        // Then
        verify(userRepository).findByIdOrThrow(1L);
        verify(userRepository).save(testUser);
        assertEquals("updateduser", testUser.getUsername());
        assertEquals("updated@example.com", testUser.getEmail());
    }

    @Test
    public void testUpdateUserPartialUsername() {
        // Given
        UpdateUserDto partialUpdateDto = UpdateUserDto.builder()
                .username("newusername")
                .build();
        
        when(userRepository.findByIdOrThrow(anyLong())).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        userCommandService.updateUser(1L, partialUpdateDto);

        // Then
        verify(userRepository).findByIdOrThrow(1L);
        verify(userRepository).save(testUser);
        assertEquals("newusername", testUser.getUsername());
        assertEquals("test@example.com", testUser.getEmail()); // email should remain unchanged
    }

    @Test
    public void testUpdateUserPartialEmail() {
        // Given
        UpdateUserDto partialUpdateDto = UpdateUserDto.builder()
                .email("newemail@example.com")
                .build();
        
        when(userRepository.findByIdOrThrow(anyLong())).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        userCommandService.updateUser(1L, partialUpdateDto);

        // Then
        verify(userRepository).findByIdOrThrow(1L);
        verify(userRepository).save(testUser);
        assertEquals("testuser", testUser.getUsername()); // username should remain unchanged
        assertEquals("newemail@example.com", testUser.getEmail());
    }

    @Test
    public void testDeleteUser() {
        // When
        userCommandService.deleteUser(1L);

        // Then
        verify(userRepository).deleteById(1L);
    }

    @Test
    public void testUpdateUserNotFound() {
        // Given
        when(userRepository.findByIdOrThrow(anyLong()))
                .thenThrow(new EntityNotFoundException("User not found with id 999"));

        // When & Then
        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class, () -> {
            userCommandService.updateUser(999L, updateUserDto);
        });

        assertEquals("User not found with id 999", exception.getMessage());
        verify(userRepository).findByIdOrThrow(999L);
        verify(userRepository, never()).save(any(User.class));
    }
}