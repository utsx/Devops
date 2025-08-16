package ru.utsx.Devops.api.mappers;

import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import ru.utsx.Devops.api.model.user.UserDto;
import ru.utsx.Devops.domain.users.User;

@Component
@RequiredArgsConstructor
public class UserMapper {

    public static UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .orders(
                        user.getOrders().stream()
                                .map(OrderMapper::toDto)
                                .collect(Collectors.toList())
                )
                .build();
    }

}
