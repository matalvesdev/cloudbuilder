package com.cloudbuilder.git.application.dto;

import java.util.Map;

/**
 * Request to write generated infrastructure code to a GitHub repository
 * and optionally create a pull request.
 */
public class GitWriteRequest {

    private String repositoryId;
    private Map<String, String> files;
    private String branchName;
    private String commitMessage;
    private boolean createPullRequest;
    private String prTitle;
    private String prBody;
    private String environmentId;

    public GitWriteRequest() {}

    public GitWriteRequest(String repositoryId, Map<String, String> files,
                           String branchName, String commitMessage,
                           boolean createPullRequest, String prTitle,
                           String prBody, String environmentId) {
        this.repositoryId = repositoryId;
        this.files = files;
        this.branchName = branchName;
        this.commitMessage = commitMessage;
        this.createPullRequest = createPullRequest;
        this.prTitle = prTitle;
        this.prBody = prBody;
        this.environmentId = environmentId;
    }

    public String getRepositoryId() { return repositoryId; }
    public void setRepositoryId(String repositoryId) { this.repositoryId = repositoryId; }

    public Map<String, String> getFiles() { return files; }
    public void setFiles(Map<String, String> files) { this.files = files; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public String getCommitMessage() { return commitMessage; }
    public void setCommitMessage(String commitMessage) { this.commitMessage = commitMessage; }

    public boolean isCreatePullRequest() { return createPullRequest; }
    public void setCreatePullRequest(boolean createPullRequest) { this.createPullRequest = createPullRequest; }

    public String getPrTitle() { return prTitle; }
    public void setPrTitle(String prTitle) { this.prTitle = prTitle; }

    public String getPrBody() { return prBody; }
    public void setPrBody(String prBody) { this.prBody = prBody; }

    public String getEnvironmentId() { return environmentId; }
    public void setEnvironmentId(String environmentId) { this.environmentId = environmentId; }
}
