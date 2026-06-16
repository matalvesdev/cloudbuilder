package com.cloudbuilder.design.domain.model;

import com.cloudbuilder.shared.kernel.AggregateRoot;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "component_definitions")
public class ComponentDefinition extends AggregateRoot {

    @Column(nullable = false)
    private String provider;

    @Column(name = "resource_type", nullable = false, unique = true)
    private String resourceType;

    @Column(nullable = false)
    private String category;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "icon_url")
    private String iconUrl;

    @Column(name = "properties_schema", columnDefinition = "TEXT")
    private String propertiesSchema;

    @Column(name = "terraform_template", columnDefinition = "TEXT")
    private String terraformTemplate;

    @Column(name = "validation_rules", columnDefinition = "TEXT")
    private String validationRules;

    @Column(name = "cost_model", columnDefinition = "TEXT")
    private String costModel;

    @Column(columnDefinition = "TEXT")
    private String tags;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    protected ComponentDefinition() {
    }

    public ComponentDefinition(String provider, String resourceType, String category,
                               String displayName, String description, String iconUrl,
                               String propertiesSchema, String terraformTemplate,
                               String validationRules, String costModel, String tags,
                               boolean isActive) {
        this.provider = provider;
        this.resourceType = resourceType;
        this.category = category;
        this.displayName = displayName;
        this.description = description;
        this.iconUrl = iconUrl;
        this.propertiesSchema = propertiesSchema;
        this.terraformTemplate = terraformTemplate;
        this.validationRules = validationRules;
        this.costModel = costModel;
        this.tags = tags;
        this.isActive = isActive;
    }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIconUrl() { return iconUrl; }
    public void setIconUrl(String iconUrl) { this.iconUrl = iconUrl; }
    public String getPropertiesSchema() { return propertiesSchema; }
    public void setPropertiesSchema(String propertiesSchema) { this.propertiesSchema = propertiesSchema; }
    public String getTerraformTemplate() { return terraformTemplate; }
    public void setTerraformTemplate(String terraformTemplate) { this.terraformTemplate = terraformTemplate; }
    public String getValidationRules() { return validationRules; }
    public void setValidationRules(String validationRules) { this.validationRules = validationRules; }
    public String getCostModel() { return costModel; }
    public void setCostModel(String costModel) { this.costModel = costModel; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
