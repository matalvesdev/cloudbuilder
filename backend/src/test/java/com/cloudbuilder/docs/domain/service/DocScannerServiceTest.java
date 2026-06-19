package com.cloudbuilder.docs.domain.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class DocScannerServiceTest {

    private DocScannerService docScannerService;

    @BeforeEach
    void setUp() {
        docScannerService = new DocScannerService();
    }

    @Test
    void scanDirectory_WithNoMdFiles_ShouldReturnEmpty(@TempDir Path tempDir) {
        var result = docScannerService.scanDirectory(tempDir.toString());
        assertTrue(result.isEmpty());
    }

    @Test
    void scanDirectory_WithMdFiles_ShouldReturnTree(@TempDir Path tempDir) throws IOException {
        Files.createFile(tempDir.resolve("readme.md"));
        Files.createFile(tempDir.resolve("guide.md"));

        var result = docScannerService.scanDirectory(tempDir.toString());

        assertFalse(result.isEmpty());
        // Files are nested as children of directory items
        boolean hasFile = result.stream()
                .filter(item -> "directory".equals(item.getType()))
                .anyMatch(dir -> dir.getChildren() != null
                        && dir.getChildren().stream().anyMatch(c -> "file".equals(c.getType())));
        assertTrue(hasFile);
    }

    @Test
    void scanDirectory_WithSubdirectories_ShouldIncludeAll(@TempDir Path tempDir) throws IOException {
        Files.createFile(tempDir.resolve("readme.md"));
        Path subDir = tempDir.resolve("sub");
        Files.createDirectory(subDir);
        Files.createFile(subDir.resolve("subdoc.md"));

        var result = docScannerService.scanDirectory(tempDir.toString());

        assertFalse(result.isEmpty());
        // Files are nested as children of directory items
        long fileCount = result.stream()
                .filter(item -> "directory".equals(item.getType()))
                .flatMap(dir -> dir.getChildren() != null ? dir.getChildren().stream() : java.util.stream.Stream.empty())
                .filter(c -> "file".equals(c.getType()))
                .count();
        assertTrue(fileCount > 0);
    }

    @Test
    void scanDirectory_WithNonExistentPath_ShouldReturnEmpty() {
        var result = docScannerService.scanDirectory("/nonexistent/path");
        assertTrue(result.isEmpty());
    }

    @Test
    void readFile_ShouldReturnContent(@TempDir Path tempDir) throws IOException {
        Files.createFile(tempDir.resolve("test.md"));
        Files.writeString(tempDir.resolve("test.md"), "# Hello World\nContent here.");

        var result = docScannerService.readFile(tempDir.toString(), "test.md");

        assertTrue(result.isPresent());
        assertEquals("# Hello World\nContent here.", result.get().getContent());
        assertNotNull(result.get().getChecksum());
    }

    @Test
    void readFile_WithPathTraversal_ShouldReturnEmpty(@TempDir Path tempDir) {
        var result = docScannerService.readFile(tempDir.toString(), "../outside.txt");
        assertTrue(result.isEmpty());
    }

    @Test
    void readFile_WithNonExistentFile_ShouldReturnEmpty(@TempDir Path tempDir) {
        var result = docScannerService.readFile(tempDir.toString(), "nonexistent.md");
        assertTrue(result.isEmpty());
    }

    @Test
    void readFile_WithNonMdExtension_ShouldReturnEmpty(@TempDir Path tempDir) throws IOException {
        Files.createFile(tempDir.resolve("data.json"));
        var result = docScannerService.readFile(tempDir.toString(), "data.json");
        assertTrue(result.isEmpty());
    }

    @Test
    void importFile_ShouldCreateAndReturnDoc(@TempDir Path tempDir) throws IOException {
        byte[] content = "# Imported\nContent".getBytes();

        var result = docScannerService.importFile(tempDir.toString(), "imported.md", content);

        assertTrue(result.isPresent());
        assertTrue(Files.exists(tempDir.resolve("imported.md")));
    }

    @Test
    void importFile_WithPathTraversal_ShouldReturnEmpty(@TempDir Path tempDir) throws IOException {
        var result = docScannerService.importFile(tempDir.toString(), "../outside.md", "data".getBytes());
        assertTrue(result.isEmpty());
    }

    @Test
    void importFile_ShouldCreateDirectoryIfNotExists(@TempDir Path parent) throws IOException {
        Path newDir = parent.resolve("new_docs_dir");
        var result = docScannerService.importFile(newDir.toString(), "doc.md", "content".getBytes());

        assertTrue(result.isPresent());
        assertTrue(Files.exists(newDir));
    }

    @Test
    void searchDocs_ShouldFindMatchingContent(@TempDir Path tempDir) throws IOException {
        Files.writeString(tempDir.resolve("aws.md"), "# AWS Configuration\nThis describes AWS setup.");
        Files.writeString(tempDir.resolve("azure.md"), "# Azure Configuration\nThis describes Azure setup.");

        var results = docScannerService.searchDocs(tempDir.toString(), "AWS");

        assertEquals(1, results.size());
    }

    @Test
    void searchDocs_WithNoMatch_ShouldReturnEmpty(@TempDir Path tempDir) throws IOException {
        Files.writeString(tempDir.resolve("doc.md"), "# Some content");

        var results = docScannerService.searchDocs(tempDir.toString(), "nonexistent");

        assertTrue(results.isEmpty());
    }

    @Test
    void searchDocs_ShouldBeCaseInsensitive(@TempDir Path tempDir) throws IOException {
        Files.writeString(tempDir.resolve("doc.md"), "# Hello World");

        var resultsLower = docScannerService.searchDocs(tempDir.toString(), "hello");
        var resultsUpper = docScannerService.searchDocs(tempDir.toString(), "HELLO");

        assertEquals(1, resultsLower.size());
        assertEquals(1, resultsUpper.size());
    }

    @Test
    void searchDocs_WithNonExistentPath_ShouldReturnEmpty() {
        var result = docScannerService.searchDocs("/nonexistent", "query");
        assertTrue(result.isEmpty());
    }

    @Test
    void extractTitle_WithFrontmatter_ShouldReturnTitle() {
        String content = "---\ntitle: My Document\n---\n# Heading\nContent";
        assertEquals("My Document", DocScannerService.extractTitle(content));
    }

    @Test
    void extractTitle_WithH1_ShouldReturnHeading() {
        String content = "# Main Title\nContent";
        assertEquals("Main Title", DocScannerService.extractTitle(content));
    }

    @Test
    void extractTitle_WithNoTitle_ShouldReturnUntitled() {
        assertEquals("Untitled", DocScannerService.extractTitle("Just some text"));
    }

    @Test
    void extractTitle_WithNullContent_ShouldReturnUntitled() {
        assertEquals("Untitled", DocScannerService.extractTitle(null));
    }

    @Test
    void extractTitle_WithBlankContent_ShouldReturnUntitled() {
        assertEquals("Untitled", DocScannerService.extractTitle("   "));
        assertEquals("Untitled", DocScannerService.extractTitle(""));
    }
}
