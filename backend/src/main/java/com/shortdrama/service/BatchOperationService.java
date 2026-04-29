package com.shortdrama.service;

import com.shortdrama.dto.response.BatchOperationResponse;

import java.util.UUID;

public interface BatchOperationService {
    BatchOperationResponse generateAll(UUID projectId);

    BatchOperationResponse renderAll(UUID projectId);

    BatchOperationResponse cancelGenerateAll(UUID projectId);

    BatchOperationResponse cancelRenderAll(UUID projectId);
}
