package com.cloudbuilder.shared.config;

import org.springframework.core.type.classreading.MetadataReader;
import org.springframework.core.type.classreading.MetadataReaderFactory;
import org.springframework.core.type.filter.TypeFilter;

import java.io.IOException;
import java.util.Set;

public class RenderLitePackageFilter implements TypeFilter {

    private static final Set<String> EXCLUDED_PREFIXES = Set.of(
        "com.cloudbuilder.aiops",
        "com.cloudbuilder.analytics",
        "com.cloudbuilder.approval",
        "com.cloudbuilder.audit",
        "com.cloudbuilder.billing",
        "com.cloudbuilder.codeanalysis",
        "com.cloudbuilder.cost",
        "com.cloudbuilder.deployment",
        "com.cloudbuilder.docs",
        "com.cloudbuilder.environment",
        "com.cloudbuilder.featureflags",
        "com.cloudbuilder.git",
        "com.cloudbuilder.github",
        "com.cloudbuilder.integration",
        "com.cloudbuilder.marketplace",
        "com.cloudbuilder.metrics",
        "com.cloudbuilder.multiregion",
        "com.cloudbuilder.observe",
        "com.cloudbuilder.observability",
        "com.cloudbuilder.policy",
        "com.cloudbuilder.search"
    );

    private static volatile Boolean renderLiteActive;

    private static boolean isRenderLiteActive() {
        if (renderLiteActive == null) {
            synchronized (RenderLitePackageFilter.class) {
                if (renderLiteActive == null) {
                    String profiles = System.getenv("SPRING_PROFILES_ACTIVE");
                    if (profiles == null) {
                        profiles = System.getProperty("spring.profiles.active");
                    }
                    renderLiteActive = profiles != null && profiles.contains("render-lite");
                }
            }
        }
        return renderLiteActive;
    }

    @Override
    public boolean match(MetadataReader metadataReader, MetadataReaderFactory metadataReaderFactory) throws IOException {
        if (!isRenderLiteActive()) {
            return false;
        }
        String className = metadataReader.getClassMetadata().getClassName();
        return EXCLUDED_PREFIXES.stream().anyMatch(className::startsWith);
    }
}
