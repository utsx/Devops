package ru.utsx.Devops.helpers;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import ru.utsx.Devops.api.model.user.CreateUserDto;
import ru.utsx.Devops.domain.users.UserCommandService;

@Component
@RequiredArgsConstructor
public class TestUserHelper {

    private final UserCommandService userCommandService;

    public Long createUser() {
        return createUser(CreateUserDto.builder()
                .username("test")
                .email("test@test.com")
                .build());
    }

    public Long createUser(CreateUserDto createUserDto) {
        return userCommandService.createUser(
                createUserDto
        );
    }

}
