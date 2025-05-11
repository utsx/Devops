package ru.utsx.Devops.domain.users;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    default User findByIdOrThrow(Long id) {
        return findById(id).orElseThrow(() -> new EntityNotFoundException("User not found with id " + id));
    }

}
