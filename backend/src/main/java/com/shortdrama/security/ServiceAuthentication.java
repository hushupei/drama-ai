package com.shortdrama.security;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

public class ServiceAuthentication extends AbstractAuthenticationToken {

    private final String serviceName;

    public ServiceAuthentication(String serviceName) {
        super(List.of(new SimpleGrantedAuthority("ROLE_SERVICE")));
        this.serviceName = serviceName;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public Object getPrincipal() {
        return serviceName;
    }
}
