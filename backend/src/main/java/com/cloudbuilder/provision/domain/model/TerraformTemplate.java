package com.cloudbuilder.provision.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "terraform_templates")
public class TerraformTemplate extends BaseEntity {

    @Column(name = "resource_type", nullable = false, unique = true)
    private String resourceType;

    @Column(nullable = false)
    private String provider;

    @Column(name = "template_content", columnDefinition = "TEXT", nullable = false)
    private String templateContent;

    @Column(columnDefinition = "TEXT")
    private String variables;

    @Column(columnDefinition = "TEXT")
    private String outputs;

    @Column(name = "template_version", nullable = false)
    private int templateVersion;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    protected TerraformTemplate() {}

    public TerraformTemplate(String resourceType, String provider, String templateContent,
                             String variables, String outputs, boolean isActive) {
        this.resourceType = resourceType;
        this.provider = provider;
        this.templateContent = templateContent;
        this.variables = variables;
        this.outputs = outputs;
        this.templateVersion = 1;
        this.isActive = isActive;
    }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getTemplateContent() { return templateContent; }
    public void setTemplateContent(String templateContent) { this.templateContent = templateContent; }
    public String getVariables() { return variables; }
    public void setVariables(String variables) { this.variables = variables; }
    public String getOutputs() { return outputs; }
    public void setOutputs(String outputs) { this.outputs = outputs; }
    public int getTemplateVersion() { return templateVersion; }
    public void setTemplateVersion(int templateVersion) { this.templateVersion = templateVersion; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
