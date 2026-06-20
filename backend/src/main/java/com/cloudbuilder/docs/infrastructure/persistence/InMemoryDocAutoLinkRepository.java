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
    public List<DocAutoLink> findByDocPath(String docPath) {
        return store.values().stream()
                .filter(l -> l.getDocPath().equals(docPath))
                .collect(Collectors.toList());
    }

    @Override
    public List<DocAutoLink> findByEntityTypeAndEntityId(String entityType, String entityId) {
        return store.values().stream()
                .filter(l -> entityType.equals(l.getEntityType()) && entityId.equals(l.getEntityId()))
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
    public void deleteByDocPath(String docPath) {
        store.values().removeIf(l -> l.getDocPath().equals(docPath));
    }
}
