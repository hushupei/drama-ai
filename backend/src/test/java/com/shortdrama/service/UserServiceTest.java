package com.shortdrama.service;

import com.shortdrama.entity.User;
import com.shortdrama.exception.ResourceNotFoundException;
import com.shortdrama.repository.UserRepository;
import com.shortdrama.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Tests")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @InjectMocks private UserServiceImpl userService;

    private User testUser;
    private UUID testId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testUser = User.builder()
                .id(testId)
                .username("testuser")
                .email("test@example.com")
                .passwordHash("hashedpassword")
                .displayName("Test User")
                .role(User.Role.USER)
                .status(User.UserStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("Should create user successfully")
    void createUser_shouldReturnSavedUser() {
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        User result = userService.createUser(testUser);
        assertThat(result.getUsername()).isEqualTo("testuser");
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should find user by id")
    void findById_shouldReturnUser() {
        when(userRepository.findById(testId)).thenReturn(Optional.of(testUser));
        Optional<User> result = userService.findById(testId);
        assertThat(result).isPresent().hasValueSatisfying(u -> assertThat(u.getId()).isEqualTo(testId));
    }

    @Test
    @DisplayName("Should find user by username")
    void findByUsername_shouldReturnUser() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        Optional<User> result = userService.findByUsername("testuser");
        assertThat(result).isPresent();
    }

    @Test
    @DisplayName("Should check if username exists")
    void existsByUsername_shouldReturnTrue() {
        when(userRepository.existsByUsername("testuser")).thenReturn(true);
        assertThat(userService.existsByUsername("testuser")).isTrue();
    }

    @Test
    @DisplayName("Should update last login time")
    void updateLastLogin_shouldUpdateTimestamp() {
        when(userRepository.findById(testId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        userService.updateLastLogin(testId);
        verify(userRepository).save(testUser);
    }
}
