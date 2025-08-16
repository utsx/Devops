package ru.utsx.Devops.domain.users;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserQueryService {

    private final UserRepository userRepository;

    public User getUser(Long id) {
        return userRepository.findByIdOrThrow(id);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

}
