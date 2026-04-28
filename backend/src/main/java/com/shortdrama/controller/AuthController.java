package com.shortdrama.controller;

import com.shortdrama.dto.request.LoginRequest;
import com.shortdrama.dto.request.UserRegistrationRequest;
import com.shortdrama.dto.response.ApiResponse;
import com.shortdrama.dto.response.LoginResponse;
import com.shortdrama.dto.response.UserResponse;
import com.shortdrama.entity.User;
import com.shortdrama.exception.ValidationException;
import com.shortdrama.security.JwtTokenProvider;
import com.shortdrama.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new ValidationException("Invalid username or password");
        }

        User user = userService.findByUsername(request.getUsername())
                .orElseThrow(() -> new ValidationException("User not found"));

        String token = tokenProvider.generateToken(user.getId(), user.getUsername());

        LoginResponse response = LoginResponse.builder()
                .token(token)
                .user(UserResponse.fromEntity(user))
                .build();

        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<LoginResponse>> register(@Valid @RequestBody UserRegistrationRequest request) {
        if (userService.existsByUsername(request.getUsername())) {
            throw new ValidationException("Username already exists");
        }
        if (userService.existsByEmail(request.getEmail())) {
            throw new ValidationException("Email already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .build();

        User created = userService.createUser(user);

        String token = tokenProvider.generateToken(created.getId(), created.getUsername());
        LoginResponse response = LoginResponse.builder()
                .token(token)
                .user(UserResponse.fromEntity(created))
                .build();

        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getCredentials() instanceof UUID)) {
            throw new ValidationException("Not authenticated");
        }

        UUID userId = (UUID) auth.getCredentials();
        User user = userService.findById(userId)
                .orElseThrow(() -> new ValidationException("User not found"));

        return ResponseEntity.ok(ApiResponse.success("Current user", UserResponse.fromEntity(user)));
    }
}
