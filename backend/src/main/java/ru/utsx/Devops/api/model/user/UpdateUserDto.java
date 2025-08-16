package ru.utsx.Devops.api.model.user;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UpdateUserDto {
    private final String username;
    private final String email;
}
