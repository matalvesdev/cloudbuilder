package com.cloudbuilder.docs.domain.service;

import com.cloudbuilder.docs.domain.model.DocAutoLink;
import com.cloudbuilder.docs.domain.port.DocAutoLinkRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DocAutoLinkService {

    private final DocAutoLinkRepository linkRepository;

    public DocAutoLinkService(DocAutoLinkRepository linkRepository) {
        this.linkRepository = linkRepository;
    }

    public DocAutoLink createLink(String sourcePath, String linkedPath, String relationship, String tenantId) {
        DocAutoLink link = new DocAutoLink(sourcePath, linkedPath, relationship, tenantId);
        return linkRepository.save(link);
    }

    public Optional<DocAutoLink> getLink(String id) {
        return linkRepository.findById(id);
    }

    public List<DocAutoLink> getLinksBySourcePath(String sourcePath) {
        return linkRepository.findBySourcePath(sourcePath);
    }

    public List<DocAutoLink> getLinksByLinkedPath(String linkedPath) {
        return linkRepository.findByLinkedPath(linkedPath);
    }

    public List<DocAutoLink> getLinksByRelationship(String relationship) {
        return linkRepository.findByRelationship(relationship);
    }

    public List<DocAutoLink> getLinksForTenant(String tenantId) {
        return linkRepository.findByTenantId(tenantId);
    }

    public List<DocAutoLink> getAllLinks() {
        return linkRepository.findAll();
    }

    public void deleteLink(String id) {
        linkRepository.deleteById(id);
    }

    public void deleteLinksBySourcePath(String sourcePath) {
        linkRepository.deleteBySourcePath(sourcePath);
    }
}
