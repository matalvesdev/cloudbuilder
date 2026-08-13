package com.cloudbuilder.notification.domain.model;

import com.cloudbuilder.shared.kernel.AggregateRoot;
import jakarta.persistence.*;

@Entity
@Table(name = "notification_templates")
public class NotificationTemplate extends AggregateRoot {

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Notification.NotificationChannel channel;

    @Column(nullable = false)
    private String subjectTemplate;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String bodyTemplate;

    @Column(columnDefinition = "TEXT")
    private String variablesJson;

    @Column(nullable = false)
    private boolean active;

    protected NotificationTemplate() {}

    public NotificationTemplate(String tenantId, String code, String name,
                                Notification.NotificationChannel channel,
                                String subjectTemplate, String bodyTemplate) {
        this.tenantId = tenantId;
        this.code = code;
        this.name = name;
        this.channel = channel;
        this.subjectTemplate = subjectTemplate;
        this.bodyTemplate = bodyTemplate;
        this.active = true;
    }

    public String getTenantId() { return tenantId; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public Notification.NotificationChannel getChannel() { return channel; }
    public String getSubjectTemplate() { return subjectTemplate; }
    public String getBodyTemplate() { return bodyTemplate; }
    public boolean isActive() { return active; }

    public void setActive(boolean active) { this.active = active; }
    public void setSubjectTemplate(String t) { this.subjectTemplate = t; }
    public void setBodyTemplate(String t) { this.bodyTemplate = t; }
}
