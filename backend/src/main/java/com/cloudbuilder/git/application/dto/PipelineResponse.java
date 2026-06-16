package com.cloudbuilder.git.application.dto;

public class PipelineResponse {

    private String yaml;
    private String filename;
    private String description;

    public PipelineResponse() {
    }

    public PipelineResponse(String yaml, String filename, String description) {
        this.yaml = yaml;
        this.filename = filename;
        this.description = description;
    }

    public String getYaml() {
        return yaml;
    }

    public void setYaml(String yaml) {
        this.yaml = yaml;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
