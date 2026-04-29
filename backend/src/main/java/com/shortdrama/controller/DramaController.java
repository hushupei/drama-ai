package com.shortdrama.controller;

import com.shortdrama.dto.response.ApiResponse;
import com.shortdrama.dto.response.DramaResponse;
import com.shortdrama.service.DramaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/dramas")
@RequiredArgsConstructor
public class DramaController {

    private final DramaService dramaService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DramaResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "publishedAt,desc") String sort,
            @RequestParam(required = false) String keyword) {
        String[] sortParams = sort.split(",");
        Sort sortObj = Sort.by(Sort.Direction.fromString(sortParams[1]), sortParams[0]);
        Pageable pageable = PageRequest.of(page, size, sortObj);

        Page<DramaResponse> dramas = dramaService.findPublished(pageable, keyword);
        return ResponseEntity.ok(ApiResponse.success(dramas));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DramaResponse>> getById(@PathVariable UUID id) {
        DramaResponse drama = dramaService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(drama));
    }
}
