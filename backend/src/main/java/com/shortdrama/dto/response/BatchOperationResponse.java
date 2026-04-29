package com.shortdrama.dto.response;

import java.util.List;

public record BatchOperationResponse(
        int totalRequested,
        int succeeded,
        int failed,
        List<BatchResult> results
) {
}
