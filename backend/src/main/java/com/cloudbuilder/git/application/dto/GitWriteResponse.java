package com.cloudbuilder.git.application.dto;

import java.util.List;
import java.util.Map;

/**
 * Response from writing infrastructure code to a GitHub repository.
 */
public class GitWriteResponse {

    private String repositoryId;
    private String branch;
    private boolean pullRequestCreated;
    private String pullRequestUrl;
    private int pullRequestNumber;
    private List<String> filesWritten;
    private Map<String, String> fileShas;
    private String status;
    private String message;

    public GitWriteResponse() {}

    public GitWriteResponse(String repositoryId, String branch,
                            boolean pullRequestCreated, String pullRequestUrl,
                            int pullRequestNumber, List<String> filesWritten,
                            Map<String, String> fileShas, String status, String message) {
        this.repositoryId = repositoryId;
        this.branch = branch;
        this.pullRequestCreated = pullRequestCreated;
        this.pullRequestUrl = pullRequestUrl;
        this.pullRequestNumber = pullRequestNumber;
        this.filesWritten = filesWritten;
        this.fileShas = fileShas;
        this.status = status;
        this.message = message;
    }

    public static GitWriteResponse success(String repositoryId, String branch,
                                            List<String> filesWritten,
                                            Map<String, String> fileShas) {
        return new GitWriteResponse(repositoryId, branch, false, null, 0,
                filesWritten, fileShas, "SUCCESS", "Arquivos escritos com sucesso");
    }

    public static GitWriteResponse withPullRequest(String repositoryId, String branch,
                                                    String prUrl, int prNumber,
                                                    List<String> filesWritten,
                                                    Map<String, String> fileShas) {
        return new GitWriteResponse(repositoryId, branch, true, prUrl, prNumber,
                filesWritten, fileShas, "PR_CREATED", "Pull Request criado com sucesso");
    }

    public static GitWriteResponse error(String message) {
        return new GitWriteResponse(null, null, false, null, 0,
                List.of(), Map.of(), "ERROR", message);
    }

    public String getRepositoryId() { return repositoryId; }
    public String getBranch() { return branch; }
    public boolean isPullRequestCreated() { return pullRequestCreated; }
    public String getPullRequestUrl() { return pullRequestUrl; }
    public int getPullRequestNumber() { return pullRequestNumber; }
    public List<String> getFilesWritten() { return filesWritten; }
    public Map<String, String> getFileShas() { return fileShas; }
    public String getStatus() { return status; }
    public String getMessage() { return message; }
}
