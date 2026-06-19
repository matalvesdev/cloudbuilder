package com.cloudbuilder.docs.domain.service;

import com.cloudbuilder.docs.application.dto.DocContent;
import com.cloudbuilder.docs.application.dto.DocTreeItem;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class DocScannerService {

    private static final Pattern TITLE_PATTERN = Pattern.compile("^#\\s+(.+)$", Pattern.MULTILINE);
    private static final Pattern FRONTMATTER_PATTERN = Pattern.compile("^---\\n([\\s\\S]*?)\\n---", Pattern.MULTILINE);

    /**
     * Scans a directory recursively for .md files and builds a tree structure.
     */
    public List<DocTreeItem> scanDirectory(String rootPath) {
        Path root = Paths.get(rootPath);
        if (!Files.exists(root) || !Files.isDirectory(root)) {
            return List.of();
        }

        List<DocTreeItem> items = new ArrayList<>();

        try (Stream<Path> paths = Files.walk(root, Integer.MAX_VALUE)) {
            Map<String, List<Path>> dirContents = new LinkedHashMap<>();

            paths.filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".md"))
                    .sorted()
                    .forEach(p -> {
                        String dir = p.getParent().toString();
                        dirContents.computeIfAbsent(dir, k -> new ArrayList<>()).add(p);
                    });

            // Build tree from sorted paths
            Set<String> addedDirs = new HashSet<>();
            for (Map.Entry<String, List<Path>> entry : dirContents.entrySet()) {
                String dirPath = entry.getKey();
                Path dir = Paths.get(dirPath);

                // Add parent directories that aren't in the root
                Path relative = root.relativize(dir);
                for (int i = 0; i < relative.getNameCount(); i++) {
                    Path subPath = root.resolve(relative.subpath(0, i + 1));
                    String subStr = subPath.toString().replace("\\", "/");
                    if (!addedDirs.contains(subStr) && !subStr.equals(rootPath.replace("\\", "/"))) {
                        addedDirs.add(subStr);
                    }
                }

                List<DocTreeItem> files = entry.getValue().stream()
                        .map(f -> {
                            String fileName = f.getFileName().toString();
                            String title = extractTitle(f);
                            return new DocTreeItem(
                                    fileName,
                                    root.relativize(f).toString().replace("\\", "/"),
                                    "file",
                                    title,
                                    null
                            );
                        })
                        .collect(Collectors.toList());

                String relativePath = root.relativize(dir).toString().replace("\\", "/");
                String dirName = relativePath.isEmpty() ? root.getFileName().toString() : dir.getFileName().toString();
                items.add(new DocTreeItem(dirName, relativePath.isEmpty() ? "" : relativePath, "directory", dirName, files));
            }

            return items;
        } catch (IOException e) {
            return List.of();
        }
    }

    /**
     * Reads a specific markdown file and returns its content.
     */
    public Optional<DocContent> readFile(String rootPath, String relativePath) {
        Path filePath = Paths.get(rootPath, relativePath).normalize();

        // Security: prevent path traversal
        Path root = Paths.get(rootPath).normalize();
        if (!filePath.startsWith(root)) {
            return Optional.empty();
        }

        if (!Files.exists(filePath) || !filePath.toString().endsWith(".md")) {
            return Optional.empty();
        }

        try {
            String content = Files.readString(filePath, StandardCharsets.UTF_8);
            String title = extractTitle(content);
            String checksum = computeChecksum(content);
            Instant lastModified = Files.getLastModifiedTime(filePath).toInstant();

            DocContent doc = new DocContent(relativePath.replace("\\", "/"), title, content);
            doc.setChecksum(checksum);
            doc.setLastModified(lastModified.toString());
            return Optional.of(doc);
        } catch (IOException e) {
            return Optional.empty();
        }
    }

    /**
     * Imports a markdown file into the docs directory.
     */
    public Optional<DocContent> importFile(String rootPath, String fileName, byte[] content) throws IOException {
        Path docsDir = Paths.get(rootPath);
        if (!Files.exists(docsDir)) {
            Files.createDirectories(docsDir);
        }

        Path targetPath = docsDir.resolve(fileName).normalize();
        if (!targetPath.startsWith(docsDir)) {
            return Optional.empty();
        }

        Files.write(targetPath, content);
        return readFile(rootPath, fileName);
    }

    /**
     * Searches for documents matching a query string.
     */
    public List<DocTreeItem> searchDocs(String rootPath, String query) {
        Path root = Paths.get(rootPath);
        if (!Files.exists(root)) {
            return List.of();
        }

        List<DocTreeItem> results = new ArrayList<>();
        try (Stream<Path> paths = Files.walk(root, Integer.MAX_VALUE)) {
            paths.filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".md"))
                    .forEach(p -> {
                        try {
                            String content = Files.readString(p, StandardCharsets.UTF_8);
                            if (content.toLowerCase().contains(query.toLowerCase())) {
                                String title = extractTitle(content);
                                Path relativePath = root.relativize(p);
                                results.add(new DocTreeItem(
                                        p.getFileName().toString(),
                                        relativePath.toString().replace("\\", "/"),
                                        "file",
                                        title,
                                        null
                                ));
                            }
                        } catch (IOException ignored) {}
                    });
        } catch (IOException ignored) {}

        return results;
    }

    private String extractTitle(Path file) {
        try {
            // Read first 5 lines for performance
            String content = Files.readString(file, StandardCharsets.UTF_8);
            return extractTitle(content);
        } catch (IOException e) {
            return file.getFileName().toString().replace(".md", "");
        }
    }

    static String extractTitle(String content) {
        if (content == null || content.isBlank()) return "Untitled";

        // Try frontmatter title first
        Matcher fmMatcher = FRONTMATTER_PATTERN.matcher(content);
        if (fmMatcher.find()) {
            String frontmatter = fmMatcher.group(1);
            Pattern titlePattern = Pattern.compile("^title:\\s*[\"']?(.+?)[\"']?$", Pattern.MULTILINE);
            Matcher tMatcher = titlePattern.matcher(frontmatter);
            if (tMatcher.find()) {
                return tMatcher.group(1).trim();
            }
        }

        // Fallback to first # heading
        Matcher matcher = TITLE_PATTERN.matcher(content);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }

        return "Untitled";
    }

    private String computeChecksum(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(content.hashCode());
        }
    }
}
