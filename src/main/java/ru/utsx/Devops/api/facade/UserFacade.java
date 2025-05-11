package ru.utsx.Devops.api.facade;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import ru.utsx.Devops.api.mappers.UserMapper;
import ru.utsx.Devops.api.model.user.CreateUserDto;
import ru.utsx.Devops.api.model.user.UpdateUserDto;
import ru.utsx.Devops.api.model.user.UserDto;
import ru.utsx.Devops.domain.users.UserCommandService;
import ru.utsx.Devops.domain.users.UserQueryService;

@Component
@RequiredArgsConstructor
public class UserFacade {

    private final UserQueryService userQueryService;
    private final UserCommandService userCommandService;

    public UserDto getUserById(Long id) {
        return UserMapper.toDto(userQueryService.getUser(id));
    }

    public Long createUser(CreateUserDto userDto) {
        return userCommandService.createUser(userDto);
    }

    public void deleteUser(Long id) {
        userCommandService.deleteUser(id);
    }

    public void updateUser(Long id, UpdateUserDto userDto) {
        userCommandService.updateUser(id, userDto);
    }

}
