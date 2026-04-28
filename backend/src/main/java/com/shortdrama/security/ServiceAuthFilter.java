package com.shortdrama.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
public class ServiceAuthFilter extends OncePerRequestFilter {

    @Value("${service.api-token:}")
    private String serviceApiToken;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = request.getHeader("X-Service-Token");

        if (StringUtils.hasText(serviceApiToken) && serviceApiToken.equals(token)) {
            ServiceAuthentication auth = new ServiceAuthentication("ai-service");
            SecurityContextHolder.getContext().setAuthentication(auth);
            log.debug("Service authentication set for request: {}", request.getRequestURI());
        }

        filterChain.doFilter(request, response);
    }
}
