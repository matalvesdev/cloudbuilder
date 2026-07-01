package com.cloudbuilder.iam.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "memberships",
       uniqueConstraints = @UniqueConstraint(columnNames = {"organization_id", "user_id"}))
public class Membership {

    public enum Status {
        ACTIVE, INVITED, DISABLED
    }

    @Id
    private String id;

    @Column(name = "organization_id", nullable = false)
    private String organizationId;

    @Column(name = "team_id")
    private String teamId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrgRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime invitedAt;

    private LocalDateTime joinedAt;

    public Membership() {}

    public Membership(String organizationId, String userId, OrgRole role) {
        this.id = UUID.randomUUID().toString();
        this.organizationId = organizationId;
        this.userId = userId;
        this.role = role;
        this.status = Status.ACTIVE;
        this.invitedAt = LocalDateTime.now();
        this.joinedAt = LocalDateTime.now();
    }

    public Membership(String organizationId, String teamId, String userId, OrgRole role) {
        this.id = UUID.randomUUID().toString();
        this.organizationId = organizationId;
        this.teamId = teamId;
        this.userId = userId;
        this.role = role;
        this.status = Status.ACTIVE;
        this.invitedAt = LocalDateTime.now();
        this.joinedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }

    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public OrgRole getRole() { return role; }
    public void setRole(OrgRole role) { this.role = role; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public LocalDateTime getInvitedAt() { return invitedAt; }
    public void setInvitedAt(LocalDateTime invitedAt) { this.invitedAt = invitedAt; }

    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Membership m)) return false;
        return Objects.equals(id, m.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
