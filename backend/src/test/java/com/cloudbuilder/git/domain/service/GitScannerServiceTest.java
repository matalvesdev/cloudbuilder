package com.cloudbuilder.git.domain.service;

import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.model.RepositoryScan;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.git.domain.port.RepositoryScanPort;
import com.cloudbuilder.github.infrastructure.client.GitHubApiClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GitScannerServiceTest {

    @Captor
    private ArgumentCaptor<ConnectedRepository> repoCaptor;

    @Captor
    private ArgumentCaptor<RepositoryScan> scanCaptor;

    @Mock
    private ConnectedRepositoryPort repositoryPort;

    @Mock
    private RepositoryScanPort scanPort;

    @Mock
    private IaCDetector iacDetector;

    @Mock
    private GitHubApiClient gitHubApiClient;

    private GitScannerService service;

    private String repoId;
    private ConnectedRepository repo;

    @BeforeEach
    void setUp() {
        service = new GitScannerService(repositoryPort, scanPort, iacDetector, gitHubApiClient);
        repoId = UUID.randomUUID().toString();
        repo = new ConnectedRepository(ConnectedRepository.Provider.GITHUB,
                "https://github.com/test/repo", "repo", "test/repo",
                "test", "main", "token");
    }

    @Test
    void scanRepository_ShouldCompleteSuccessfully() {
        when(repositoryPort.findById(repoId)).thenReturn(Optional.of(repo));
        when(repositoryPort.save(any(ConnectedRepository.class))).thenAnswer(i -> i.getArgument(0));
        when(scanPort.save(any(RepositoryScan.class))).thenAnswer(i -> i.getArgument(0));
        when(iacDetector.detectAppType(anyList())).thenReturn(
                new com.cloudbuilder.git.domain.model.AppDetection(
                        "Backend Service", "Java", "Spring Boot", true, true));
        when(iacDetector.detectTerraform(anyList())).thenReturn(List.of("main.tf"));
        when(iacDetector.detectKubernetes(anyList())).thenReturn(List.of("deployment.yaml"));

        var result = service.scanRepository(repoId);

        assertNotNull(result);
        assertEquals(RepositoryScan.Status.COMPLETED, result.getStatus());
        assertEquals(2, result.getResourceCount());
        assertNotNull(result.getScannedAt());
        assertNotNull(result.getAppDetection());

        verify(repositoryPort, times(2)).save(any(ConnectedRepository.class));
        verify(scanPort, times(2)).save(any(RepositoryScan.class));
    }

    @Test
    void scanRepository_WhenRepoNotFound_ShouldThrow() {
        when(repositoryPort.findById(repoId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.scanRepository(repoId));
    }

    @Test
    void scanRepository_WhenIacDetectorThrows_ShouldSetFailed() {
        when(repositoryPort.findById(repoId)).thenReturn(Optional.of(repo));
        when(repositoryPort.save(any(ConnectedRepository.class))).thenAnswer(i -> i.getArgument(0));
        when(scanPort.save(any(RepositoryScan.class))).thenAnswer(i -> i.getArgument(0));
        when(iacDetector.detectAppType(anyList())).thenThrow(new RuntimeException("Detection failed"));

        assertThrows(RuntimeException.class, () -> service.scanRepository(repoId));

        // Verify failure state is saved — repo saves: first SCANNING, then ERROR
        verify(repositoryPort, times(2)).save(repoCaptor.capture());
        assertEquals(ConnectedRepository.Status.ERROR, repoCaptor.getAllValues().get(1).getStatus());
        // scan saves: first IN_PROGRESS, then FAILED
        verify(scanPort, times(2)).save(scanCaptor.capture());
        assertEquals(RepositoryScan.Status.FAILED, scanCaptor.getAllValues().get(1).getStatus());
    }

    @Test
    void getDetectedFiles_WhenScanFound_ShouldReturnSplitFiles() {
        var scan = new RepositoryScan(repoId);
        scan.setStatus(RepositoryScan.Status.COMPLETED);
        scan.setIacFiles("main.tf,variables.tf,outputs.tf");
        when(scanPort.findByRepositoryId(repoId)).thenReturn(List.of(scan));

        var result = service.getDetectedFiles(repoId);

        assertEquals(3, result.size());
        assertTrue(result.contains("main.tf"));
    }

    @Test
    void getDetectedFiles_WhenNoScan_ShouldThrow() {
        when(scanPort.findByRepositoryId(repoId)).thenReturn(List.of());

        assertThrows(IllegalArgumentException.class, () -> service.getDetectedFiles(repoId));
    }

    @Test
    void getDetectedFiles_WhenIacFilesNull_ShouldReturnEmpty() {
        var scan = new RepositoryScan(repoId);
        scan.setStatus(RepositoryScan.Status.COMPLETED);
        scan.setIacFiles(null);
        when(scanPort.findByRepositoryId(repoId)).thenReturn(List.of(scan));

        var result = service.getDetectedFiles(repoId);

        assertTrue(result.isEmpty());
    }

    @Test
    void getDetectedFiles_WhenIacFilesBlank_ShouldReturnEmpty() {
        var scan = new RepositoryScan(repoId);
        scan.setStatus(RepositoryScan.Status.COMPLETED);
        scan.setIacFiles("   ");
        when(scanPort.findByRepositoryId(repoId)).thenReturn(List.of(scan));

        var result = service.getDetectedFiles(repoId);

        assertTrue(result.isEmpty());
    }
}
