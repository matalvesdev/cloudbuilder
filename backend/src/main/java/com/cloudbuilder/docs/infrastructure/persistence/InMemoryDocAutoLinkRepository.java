package com.cloudbuilder.docs.infrastructure.persistence;

import com.cloudbuilder.docs.domain.model.DocAutoLink;
import com.cloudbuilder.docs.domain.port.DocAutoLinkRepository;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryDocAutoLinkRepository implements DocAutoLinkRepository {

    private final ConcurrentHashMap<String, DocAutoLink> store = new ConcurrentHashMap<>();

    @Override
    public DocAutoLink save(DocAutoLink link) {
        if (link.getId() == null) {
            link.setId(java.util.UUID.randomUUID().toString());
        }
        store.put(link.getId(), link);
        return link;
    }

    @Override
    public Optional<DocAutoLink> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public List<DocAutoLink> findBySourcePath(String sourcePath) {
        return store.values().stream()
                .filter(l -> l.getSourcePath().equals(sourcePath))
                .collect(Collectors.toList());
    }

    @Override
    public List<DocAutoLink> findByLinkedPath(String linkedPath) {
        return store.values().stream()
                .filter(l -> l.getLinkedPath().equals(linkedPath))
                .collect(Collectors.toList());
    }

    @Override
    public List<DocAutoLink> findByRelationship(String relationship) {
        return store.values().stream()
                .filter(l -> relationship.equals(l.getRelationship()))
                .collect(Collectors.toList());
    }

    @Override
    public List<DocAutoLink> findByTenantId(String tenantId) {
        return store.values().stream()
                .filter(l -> tenantId.equals(l.getTenantId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<DocAutoLink> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public void delete(String id) {
        store.remove(id);
    }

    @Override
    public void deleteBySourcePath(String sourcePath) {
        store.values().removeIf(l -> l.getSourcePath().equals(sourcePath));
    }
}
