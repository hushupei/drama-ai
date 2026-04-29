package com.shortdrama.service;

import com.shortdrama.dto.response.DramaResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface DramaService {
    Page<DramaResponse> findPublished(Pageable pageable, String keyword);

    DramaResponse findById(UUID id);
}
