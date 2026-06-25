package com.cloudbuilder.git.domain.port;

import com.cloudbuilder.git.domain.model.WebhookEvent;

import java.util.List;
import java.util.Optional;

public interface WebhookEventPort {

    WebhookEvent save(WebhookEvent event);

    Optional<WebhookEvent> findById(String id);

    List<WebhookEvent> findByRepositoryId(String repositoryId);

    List<WebhookEvent> findByRepositoryIdOrderByReceivedAtDesc(String repositoryId);

    List<WebhookEvent> findByStatus(WebhookEvent.Status status);
}
