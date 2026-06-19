package com.cloudbuilder.docs.application.dto;

import java.util.List;

public class DocTreeItem {
    private String name;
    private String path;
    private String type;
    private String title;
    private List<DocTreeItem> children;

    public DocTreeItem() {}

    public DocTreeItem(String name, String path, String type, String title, List<DocTreeItem> children) {
        this.name = name;
        this.path = path;
        this.type = type;
        this.title = title;
        this.children = children;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public List<DocTreeItem> getChildren() { return children; }
    public void setChildren(List<DocTreeItem> children) { this.children = children; }
}
