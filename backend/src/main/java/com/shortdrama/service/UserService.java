package com.shortdrama.service;

import com.shortdrama.entity.User;
import java.util.Optional;
import java.util.UUID;

public interface UserService {
    User createUser(User user);
    User updateUser(UUID id, User user);
    void deleteUser(UUID id);
    Optional<User> findById(UUID id);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    User updateLastLogin(UUID id);
}
