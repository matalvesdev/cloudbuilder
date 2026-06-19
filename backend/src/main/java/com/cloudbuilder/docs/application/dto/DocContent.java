package com.cloudbuilder.docs.application.dto;

public class DocContent {
    private String path;
    private String title;
    private String content;
    private String checksum;
    private String lastModified;

    public DocContent() {}

    public DocContent(String path, String title, String content) {
        this.path = path;
        this.title = title;
        this.content = content;
    }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getChecksum() { return checksum; }
    public void setChecksum(String checksum) { this.checksum = checksum; }

    public String getLastModified() { return lastModified; }
    public void setLastModified(String lastModified) { this.lastModified = lastModified; }
}
