package com.shortdrama.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record BatchResult(
        UUID episodeId,
        int episodeNumber,
        String status,
        String taskId,
        String error
) {
    public static BatchResult success(UUID episodeId, int episodeNumber, String taskId) {
        return new BatchResult(episodeId, episodeNumber, "SUCCESS", taskId, null);
    }

    public static BatchResult failure(UUID episodeId, int episodeNumber, String error) {
        return new BatchResult(episodeId, episodeNumber, "FAILED", null, error);
    }
}
