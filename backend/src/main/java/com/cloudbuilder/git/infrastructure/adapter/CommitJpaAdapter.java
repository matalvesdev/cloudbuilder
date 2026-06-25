package com.cloudbuilder.git.infrastructure.adapter;

import com.cloudbuilder.git.domain.model.Commit;
import com.cloudbuilder.git.domain.port.CommitRepository;
import com.cloudbuilder.git.infrastructure.CommitEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * JPA adapter for CommitRepository port.
 * Converts between domain model ({@link Commit}) and JPA entity ({@link CommitEntity}).
 */
@Component
public class CommitJpaAdapter implements CommitRepository {

    private final JpaCommitRepository springRepo;

    public CommitJpaAdapter(JpaCommitRepository springRepo) {
        this.springRepo = springRepo;
    }

    @Override
    public Commit save(Commit commit) {
        CommitEntity entity = toEntity(commit);
        CommitEntity saved = springRepo.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Commit> findById(String id) {
        return springRepo.findById(id).map(this::toDomain);
    }

    @Override
    public List<Commit> findByRepoIdOrderByTimestampDesc(String repoId) {
        return springRepo.findByRepoIdOrderByTimestampDesc(repoId).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<Commit> findByRepoIdAndSha(String repoId, String sha) {
        return springRepo.findByRepoIdAndSha(repoId, sha).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<Commit> findByRepoIdOrderByTimestampDesc(String repoId, int limit) {
        return springRepo.findTop30ByRepoIdOrderByTimestampDesc(repoId).stream()
                .limit(limit)
                .map(this::toDomain)
                .toList();
    }

    @Override
    public void deleteById(String id) {
        springRepo.deleteById(id);
    }

    private CommitEntity toEntity(Commit domain) {
        return new CommitEntity(
                domain.getId(),
                domain.getRepoId(),
                domain.getSha(),
                domain.getMessage(),
                domain.getAuthor(),
                domain.getAuthorEmail(),
                domain.getTimestamp(),
                domain.getReceivedAt()
        );
    }

    private Commit toDomain(CommitEntity entity) {
        Commit domain = new Commit();
        domain.setId(entity.getId());
        domain.setRepoId(entity.getRepoId());
        domain.setSha(entity.getSha());
        domain.setMessage(entity.getMessage());
        domain.setAuthor(entity.getAuthor());
        domain.setAuthorEmail(entity.getAuthorEmail());
        domain.setTimestamp(entity.getTimestamp());
        domain.setReceivedAt(entity.getReceivedAt());
        return domain;
    }
}
