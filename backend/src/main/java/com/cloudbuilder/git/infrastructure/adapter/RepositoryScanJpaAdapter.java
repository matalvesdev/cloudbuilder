package com.cloudbuilder.git.infrastructure.adapter;

import com.cloudbuilder.git.domain.model.AppDetection;
import com.cloudbuilder.git.domain.model.RepositoryScan;
import com.cloudbuilder.git.domain.port.RepositoryScanPort;
import com.cloudbuilder.git.infrastructure.GitScanResultEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class RepositoryScanJpaAdapter implements RepositoryScanPort {

    private final JpaGitScanResult springRepo;

    public RepositoryScanJpaAdapter(JpaGitScanResult springRepo) {
        this.springRepo = springRepo;
    }

    @Override
    public RepositoryScan save(RepositoryScan scan) {
        GitScanResultEntity entity = toEntity(scan);
        GitScanResultEntity saved = springRepo.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<RepositoryScan> findById(UUID id) {
        return springRepo.findById(id).map(this::toDomain);
    }

    @Override
    public List<RepositoryScan> findByRepositoryId(UUID repositoryId) {
        return springRepo.findByRepositoryId(repositoryId).stream()
                .map(this::toDomain).toList();
    }

    private GitScanResultEntity toEntity(RepositoryScan domain) {
        GitScanResultEntity entity = new GitScanResultEntity(
                domain.getId(),
                domain.getRepositoryId(),
                domain.getStatus().name()
        );
        entity.setScannedAt(domain.getScannedAt());
        entity.setIacFiles(domain.getIacFiles());
        entity.setResourceCount(domain.getResourceCount());

        if (domain.getAppDetection() != null) {
            entity.setAppType(domain.getAppDetection().getAppType());
            entity.setLanguage(domain.getAppDetection().getLanguage());
            entity.setFramework(domain.getAppDetection().getFramework());
            entity.setHasDockerfile(domain.getAppDetection().isHasDockerfile());
            entity.setHasKubernetesManifest(domain.getAppDetection().isHasKubernetesManifest());
        }

        return entity;
    }

    private RepositoryScan toDomain(GitScanResultEntity entity) {
        RepositoryScan domain = new RepositoryScan();
        domain.setId(entity.getId());
        domain.setRepositoryId(entity.getRepositoryId());
        domain.setScannedAt(entity.getScannedAt());
        domain.setIacFiles(entity.getIacFiles());
        domain.setResourceCount(entity.getResourceCount());
        domain.setStatus(RepositoryScan.Status.valueOf(entity.getStatus()));

        if (entity.getAppType() != null) {
            domain.setAppDetection(new AppDetection(
                    entity.getAppType(),
                    entity.getLanguage(),
                    entity.getFramework(),
                    entity.isHasDockerfile(),
                    entity.isHasKubernetesManifest()
            ));
        }

        return domain;
    }
}
