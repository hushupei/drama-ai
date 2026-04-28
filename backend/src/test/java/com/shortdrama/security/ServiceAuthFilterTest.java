package com.shortdrama.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ServiceAuthFilter Tests")
class ServiceAuthFilterTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private ServiceAuthFilter serviceAuthFilter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        ReflectionTestUtils.setField(serviceAuthFilter, "serviceApiToken", "test-token-123");
    }

    @Test
    @DisplayName("Should authenticate when X-Service-Token matches")
    void shouldAuthenticateWithValidToken() throws Exception {
        when(request.getHeader("X-Service-Token")).thenReturn("test-token-123");

        serviceAuthFilter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.isAuthenticated()).isTrue();
        assertThat(auth.getAuthorities()).anyMatch(a -> a.getAuthority().equals("ROLE_SERVICE"));
        assertThat(auth.getPrincipal()).isEqualTo("ai-service");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should not authenticate when token is null")
    void shouldNotAuthenticateWithNullToken() throws Exception {
        when(request.getHeader("X-Service-Token")).thenReturn(null);

        serviceAuthFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should not authenticate when token does not match")
    void shouldNotAuthenticateWithWrongToken() throws Exception {
        when(request.getHeader("X-Service-Token")).thenReturn("wrong-token");

        serviceAuthFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should not authenticate when configured token is empty")
    void shouldNotAuthenticateWhenTokenConfigIsEmpty() throws Exception {
        ReflectionTestUtils.setField(serviceAuthFilter, "serviceApiToken", "");
        when(request.getHeader("X-Service-Token")).thenReturn("any-token");

        serviceAuthFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should always continue filter chain regardless of auth outcome")
    void shouldAlwaysContinueFilterChain() throws Exception {
        when(request.getHeader("X-Service-Token")).thenReturn("test-token-123");

        serviceAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should not interfere when no header is present")
    void shouldNotInterfereWithoutHeader() throws Exception {
        when(request.getHeader("X-Service-Token")).thenReturn(null);

        serviceAuthFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }
}
