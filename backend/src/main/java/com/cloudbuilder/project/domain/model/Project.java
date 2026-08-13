package com.cloudbuilder.project.domain.model;

import com.cloudbuilder.shared.kernel.AggregateRoot;
import jakarta.persistence.*;

@Entity
@Table(name = "projects")
public class Project extends AggregateRoot {

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectStatus status;

    @Column
    private String defaultBranch;

    @Column(columnDefinition = "TEXT")
    private String configJson;

    @Column(columnDefinition = "TEXT")
    private String tagsJson;

    protected Project() {}

    public Project(String tenantId, String name, String description, String slug) {
        this.tenantId = tenantId;
        this.name = name;
        this.description = description;
        this.slug = slug;
        this.status = ProjectStatus.ACTIVE;
        this.defaultBranch = "main";
    }

    public void archive() { this.status = ProjectStatus.ARCHIVED; }
    public void activate() { this.status = ProjectStatus.ACTIVE; }

    public String getTenantId() { return tenantId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getSlug() { return slug; }
    public ProjectStatus getStatus() { return status; }
    public String getDefaultBranch() { return defaultBranch; }

    public enum ProjectStatus {
        ACTIVE, ARCHIVED, DELETED
    }
}
