package ru.utsx.Devops.domain;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;
import ru.utsx.Devops.api.model.user.CreateUserDto;
import ru.utsx.Devops.api.model.user.UpdateUserDto;
import ru.utsx.Devops.domain.users.User;
import ru.utsx.Devops.domain.users.UserCommandService;
import ru.utsx.Devops.domain.users.UserRepository;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Sql(scripts = {
    "classpath:test-schema.sql"
}, executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
public class UserCommandServiceTest {

    @Autowired
    private UserCommandService userCommandService;
    
    @Autowired
    private UserRepository userRepository;

    @Test
    public void testCreateUser() {
        // Given
        CreateUserDto createUserDto = CreateUserDto.builder()
                .username("testuser")
                .email("test@example.com")
                .build();

        // When
        Long userId = userCommandService.createUser(createUserDto);

        // Then
        assertNotNull(userId);
        
        // Flush to ensure data is persisted
        userRepository.flush();
        
        User savedUser = userRepository.findById(userId).orElse(null);
        assertNotNull(savedUser);
        assertEquals("testuser", savedUser.getUsername());
        assertEquals("test@example.com", savedUser.getEmail());
        assertNotNull(savedUser.getCreatedAt());
        assertNotNull(savedUser.getUpdatedAt());
    }

    @Test
    public void testUpdateUser() {
        // Given
        CreateUserDto createUserDto = CreateUserDto.builder()
                .username("originaluser")
                .email("original@example.com")
                .build();
        Long userId = userCommandService.createUser(createUserDto);

        UpdateUserDto updateUserDto = UpdateUserDto.builder()
                .username("updateduser")
                .email("updated@example.com")
                .build();

        // When
        userCommandService.updateUser(userId, updateUserDto);

        // Then
        User updatedUser = userRepository.findById(userId).orElse(null);
        assertNotNull(updatedUser);
        assertEquals("updateduser", updatedUser.getUsername());
        assertEquals("updated@example.com", updatedUser.getEmail());
    }

    @Test
    public void testUpdateUserPartial() {
        // Given
        CreateUserDto createUserDto = CreateUserDto.builder()
                .username("originaluser")
                .email("original@example.com")
                .build();
        Long userId = userCommandService.createUser(createUserDto);

        UpdateUserDto updateUserDto = UpdateUserDto.builder()
                .username("updateduser")
                .build();

        // When
        userCommandService.updateUser(userId, updateUserDto);

        // Then
        User updatedUser = userRepository.findById(userId).orElse(null);
        assertNotNull(updatedUser);
        assertEquals("updateduser", updatedUser.getUsername());
        assertEquals("original@example.com", updatedUser.getEmail()); // email should remain unchanged
    }

    @Test
    public void testDeleteUser() {
        // Given
        CreateUserDto createUserDto = CreateUserDto.builder()
                .username("userToDelete")
                .email("delete@example.com")
                .build();
        Long userId = userCommandService.createUser(createUserDto);

        // When
        userCommandService.deleteUser(userId);

        // Then
        assertFalse(userRepository.findById(userId).isPresent());
    }
}