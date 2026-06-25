package com.cloudbuilder.git.infrastructure.adapter;

import com.cloudbuilder.git.domain.model.WebhookEvent;
import com.cloudbuilder.git.domain.port.WebhookEventPort;
import com.cloudbuilder.git.infrastructure.WebhookEventEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class WebhookEventJpaAdapter implements WebhookEventPort {

    private final JpaWebhookEventRepository springRepo;

    public WebhookEventJpaAdapter(JpaWebhookEventRepository springRepo) {
        this.springRepo = springRepo;
    }

    @Override
    public WebhookEvent save(WebhookEvent event) {
        WebhookEventEntity entity = toEntity(event);
        WebhookEventEntity saved = springRepo.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<WebhookEvent> findById(String id) {
        return springRepo.findById(id).map(this::toDomain);
    }

    @Override
    public List<WebhookEvent> findByRepositoryId(String repositoryId) {
        return springRepo.findByRepositoryIdOrderByReceivedAtDesc(repositoryId).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<WebhookEvent> findByRepositoryIdOrderByReceivedAtDesc(String repositoryId) {
        return springRepo.findByRepositoryIdOrderByReceivedAtDesc(repositoryId).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<WebhookEvent> findByStatus(WebhookEvent.Status status) {
        return springRepo.findByStatus(status.name()).stream()
                .map(this::toDomain)
                .toList();
    }

    private WebhookEventEntity toEntity(WebhookEvent domain) {
        WebhookEventEntity entity = new WebhookEventEntity(
                domain.getId(),
                domain.getEventType().name(),
                domain.getRepositoryId(),
                domain.getPayload(),
                domain.getSignature(),
                domain.getDeliveryId(),
                domain.getBranch(),
                domain.getCommitSha(),
                domain.getActor(),
                domain.getStatus().name()
        );
        if (domain.getFailureReason() != null) {
            entity.setFailureReason(domain.getFailureReason());
        }
        if (domain.getProcessedAt() != null) {
            entity.setProcessedAt(domain.getProcessedAt());
        }
        return entity;
    }

    private WebhookEvent toDomain(WebhookEventEntity entity) {
        WebhookEvent domain = new WebhookEvent();
        domain.setId(entity.getId());
        domain.setEventType(WebhookEvent.EventType.valueOf(entity.getEventType()));
        domain.setRepositoryId(entity.getRepositoryId());
        domain.setPayload(entity.getPayload());
        domain.setSignature(entity.getSignature());
        domain.setDeliveryId(entity.getDeliveryId());
        domain.setBranch(entity.getBranch());
        domain.setCommitSha(entity.getCommitSha());
        domain.setActor(entity.getActor());
        domain.setStatus(WebhookEvent.Status.valueOf(entity.getStatus()));
        domain.setFailureReason(entity.getFailureReason());
        domain.setReceivedAt(entity.getReceivedAt());
        domain.setProcessedAt(entity.getProcessedAt());
        return domain;
    }
}
