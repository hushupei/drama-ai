package com.shortdrama.service;

import com.shortdrama.entity.Project;

import java.util.UUID;

public interface PublishService {
    Project publish(UUID projectId, UUID userId, String coverUrl);
}
