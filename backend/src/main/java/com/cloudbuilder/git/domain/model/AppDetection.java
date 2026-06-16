package com.cloudbuilder.git.domain.model;

public class AppDetection {

    private String appType;
    private String language;
    private String framework;
    private boolean hasDockerfile;
    private boolean hasKubernetesManifest;

    public AppDetection() {
    }

    public AppDetection(String appType, String language, String framework,
                        boolean hasDockerfile, boolean hasKubernetesManifest) {
        this.appType = appType;
        this.language = language;
        this.framework = framework;
        this.hasDockerfile = hasDockerfile;
        this.hasKubernetesManifest = hasKubernetesManifest;
    }

    public String getAppType() {
        return appType;
    }

    public void setAppType(String appType) {
        this.appType = appType;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getFramework() {
        return framework;
    }

    public void setFramework(String framework) {
        this.framework = framework;
    }

    public boolean isHasDockerfile() {
        return hasDockerfile;
    }

    public void setHasDockerfile(boolean hasDockerfile) {
        this.hasDockerfile = hasDockerfile;
    }

    public boolean isHasKubernetesManifest() {
        return hasKubernetesManifest;
    }

    public void setHasKubernetesManifest(boolean hasKubernetesManifest) {
        this.hasKubernetesManifest = hasKubernetesManifest;
    }
}
