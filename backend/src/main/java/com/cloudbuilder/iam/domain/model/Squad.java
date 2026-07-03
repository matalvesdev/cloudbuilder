package com.cloudbuilder.iam.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Squad: A sub-team within a workspace. Organizes projects and members.
 */
@Entity
@Table(name = "squads", indexes = {
    @Index(name = "idx_squad_workspace", columnList = "workspaceId")
})
public class Squad {

    @Id
    private String id;

    @Column(name = "workspace_id", nullable = false)
    private String workspaceId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "lead_id")
    private String leadId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Squad() {}

    public Squad(String workspaceId, String tenantId, String name, String description) {
        this.id = UUID.randomUUID().toString();
        this.workspaceId = workspaceId;
        this.tenantId = tenantId;
        this.name = name;
        this.description = description;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getWorkspaceId() { return workspaceId; }
    public String getTenantId() { return tenantId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLeadId() { return leadId; }
    public void setLeadId(String leadId) { this.leadId = leadId; }
    public Instant getCreatedAt() { return createdAt; }
}
