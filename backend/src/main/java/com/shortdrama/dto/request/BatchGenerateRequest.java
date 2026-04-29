package com.shortdrama.dto.request;

import java.util.List;
import java.util.UUID;

public record BatchGenerateRequest(List<UUID> chapterIds) {
}
