package ru.utsx.Devops.domain.users;

import java.util.List;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.utsx.Devops.api.model.user.CreateUserDto;
import ru.utsx.Devops.api.model.user.UpdateUserDto;

@Service
@RequiredArgsConstructor
public class UserCommandService {

    private final UserRepository userRepository;

    public Long createUser(CreateUserDto createUserDto) {
        User user = User.builder()
                .username(createUserDto.getUsername())
                .email(createUserDto.getEmail())
                .orders(List.of())
                .build();
        return userRepository.save(user).getId();
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public void updateUser(Long id, UpdateUserDto updateUserDto) {
        User user = userRepository.findByIdOrThrow(id);
        user.setUsername(updateUserDto.getUsername() == null ? user.getUsername() : updateUserDto.getUsername());
        user.setEmail(updateUserDto.getEmail() == null ? user.getEmail() : updateUserDto.getEmail());
        userRepository.save(user);
    }

}
