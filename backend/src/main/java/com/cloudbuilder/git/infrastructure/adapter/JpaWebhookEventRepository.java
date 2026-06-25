package com.cloudbuilder.git.infrastructure.adapter;

import com.cloudbuilder.git.infrastructure.WebhookEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JpaWebhookEventRepository extends JpaRepository<WebhookEventEntity, String> {
    List<WebhookEventEntity> findByRepositoryIdOrderByReceivedAtDesc(String repositoryId);
    List<WebhookEventEntity> findByStatus(String status);
}
