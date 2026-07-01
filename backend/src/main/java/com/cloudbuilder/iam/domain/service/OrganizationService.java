package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.Membership;
import com.cloudbuilder.iam.domain.model.OrgRole;
import com.cloudbuilder.iam.domain.model.Organization;
import com.cloudbuilder.iam.domain.port.MembershipRepository;
import com.cloudbuilder.iam.domain.port.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final MembershipRepository membershipRepository;

    public OrganizationService(OrganizationRepository organizationRepository,
                               MembershipRepository membershipRepository) {
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
    }

    @Transactional(readOnly = true)
    public Organization getOrganization(String id) {
        return organizationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Organização não encontrada: " + id));
    }

    @Transactional(readOnly = true)
    public Organization getOrganizationBySlug(String slug) {
        return organizationRepository.findBySlug(slug)
            .orElseThrow(() -> new IllegalArgumentException("Organização não encontrada: " + slug));
    }

    public Organization createOrganization(String name, String slug, String ownerId) {
        if (organizationRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Slug já está em uso: " + slug);
        }
        var org = new Organization(name, slug, ownerId);
        var saved = organizationRepository.save(org);
        
        // Auto-add owner as OWNER member
        var membership = new Membership(saved.getId(), ownerId, OrgRole.OWNER);
        membershipRepository.save(membership);
        
        return saved;
    }

    public Organization updateOrganization(String id, String name, String settings) {
        var org = getOrganization(id);
        if (name != null) org.setName(name);
        if (settings != null) org.setSettings(settings);
        return organizationRepository.save(org);
    }

    public Organization deactivateOrganization(String id) {
        var org = getOrganization(id);
        org.setActive(false);
        return organizationRepository.save(org);
    }

    public Organization activateOrganization(String id) {
        var org = getOrganization(id);
        org.setActive(true);
        return organizationRepository.save(org);
    }

    @Transactional(readOnly = true)
    public List<Organization> listOrganizationsByOwner(String ownerId) {
        return organizationRepository.findByOwnerId(ownerId);
    }

    @Transactional(readOnly = true)
    public List<Organization> listActiveOrganizations() {
        return organizationRepository.findByActiveTrue();
    }

    @Transactional(readOnly = true)
    public long getMemberCount(String organizationId) {
        return membershipRepository.countByOrganizationId(organizationId);
    }

    public void deleteOrganization(String id) {
        var org = getOrganization(id);
        // Remove all memberships first
        var memberships = membershipRepository.findByOrganizationId(id);
        membershipRepository.deleteAll(memberships);
        organizationRepository.delete(org);
    }
}
