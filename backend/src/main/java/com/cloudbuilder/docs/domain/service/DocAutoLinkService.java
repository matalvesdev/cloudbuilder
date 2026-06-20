package com.cloudbuilder.docs.domain.service;

import com.cloudbuilder.docs.domain.model.DocAutoLink;
import com.cloudbuilder.docs.domain.port.DocAutoLinkRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DocAutoLinkService {

    private final DocAutoLinkRepository linkRepository;

    public DocAutoLinkService(DocAutoLinkRepository linkRepository) {
        this.linkRepository = linkRepository;
    }

    public DocAutoLink createLink(String docPath, String entityType, String entityId, String tenantId) {
        DocAutoLink link = new DocAutoLink(docPath, entityType, entityId, tenantId);
        return linkRepository.save(link);
    }

    public Optional<DocAutoLink> getLink(String id) {
        return linkRepository.findById(id);
    }

    public List<DocAutoLink> getLinksForDoc(String docPath) {
        return linkRepository.findByDocPath(docPath);
    }

    public List<DocAutoLink> getLinksForEntity(String entityType, String entityId) {
        return linkRepository.findByEntityTypeAndEntityId(entityType, entityId);
    }

    public List<DocAutoLink> getLinksForTenant(String tenantId) {
        return linkRepository.findByTenantId(tenantId);
    }

    public List<DocAutoLink> getAllLinks() {
        return linkRepository.findAll();
    }

    public void deleteLink(String id) {
        linkRepository.delete(id);
    }

    public void deleteLinksForDoc(String docPath) {
        linkRepository.deleteByDocPath(docPath);
    }

    public DocAutoLink updateSync(DocAutoLink link) {
        link.setLastSync(Instant.now());
        return linkRepository.save(link);
    }

    /**
     * Parses doc content for cross-reference patterns like [[entity:type:id]]
     * and creates links automatically.
     */
    public int parseAndCreateLinks(String docPath, String content, String tenantId) {
        var pattern = java.util.regex.Pattern.compile("\\[\\[(\\w+):([a-zA-Z0-9-]+)\\]\\]");
        var matcher = pattern.matcher(content);
        int count = 0;
        while (matcher.find()) {
            String entityType = matcher.group(1);
            String entityId = matcher.group(2);
            createLink(docPath, entityType, entityId, tenantId);
            count++;
        }
        return count;
    }
}
