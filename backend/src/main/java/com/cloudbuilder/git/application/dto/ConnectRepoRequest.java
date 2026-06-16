package com.cloudbuilder.git.application.dto;

public class ConnectRepoRequest {

    private String provider;
    private String token;
    private String repoUrl;

    public ConnectRepoRequest() {
    }

    public ConnectRepoRequest(String provider, String token, String repoUrl) {
        this.provider = provider;
        this.token = token;
        this.repoUrl = repoUrl;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRepoUrl() {
        return repoUrl;
    }

    public void setRepoUrl(String repoUrl) {
        this.repoUrl = repoUrl;
    }
}
