package com.cloudbuilder.git.infrastructure.adapter;

import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.git.infrastructure.GitRepositoryEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
@Component
public class ConnectedRepositoryJpaAdapter implements ConnectedRepositoryPort {

    private final JpaGitRepository springRepo;

    public ConnectedRepositoryJpaAdapter(JpaGitRepository springRepo) {
        this.springRepo = springRepo;
    }

    @Override
    public ConnectedRepository save(ConnectedRepository repository) {
        GitRepositoryEntity entity = toEntity(repository);
        GitRepositoryEntity saved = springRepo.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<ConnectedRepository> findById(String id) {
        return springRepo.findById(id).map(this::toDomain);
    }

    @Override
    public List<ConnectedRepository> findAll() {
        return springRepo.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public void deleteById(String id) {
        springRepo.deleteById(id);
    }

    private GitRepositoryEntity toEntity(ConnectedRepository domain) {
        return new GitRepositoryEntity(
                domain.getId(),
                domain.getProvider().name(),
                domain.getRepoUrl(),
                domain.getRepoName(),
                domain.getFullName(),
                domain.getOwner(),
                domain.getDefaultBranch(),
                domain.getAccessToken(),
                domain.getStatus().name()
        );
    }

    private ConnectedRepository toDomain(GitRepositoryEntity entity) {
        ConnectedRepository domain = new ConnectedRepository();
        domain.setId(entity.getId());
        domain.setProvider(ConnectedRepository.Provider.valueOf(entity.getProvider()));
        domain.setRepoUrl(entity.getRepoUrl());
        domain.setRepoName(entity.getRepoName());
        domain.setFullName(entity.getFullName());
        domain.setOwner(entity.getOwner());
        domain.setDefaultBranch(entity.getDefaultBranch());
        domain.setAccessToken(entity.getAccessToken());
        domain.setConnectedAt(entity.getConnectedAt());
        domain.setLastScanAt(entity.getLastScanAt());
        domain.setStatus(ConnectedRepository.Status.valueOf(entity.getStatus()));
        return domain;
    }
}
