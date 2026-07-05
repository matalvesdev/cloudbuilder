package com.cloudbuilder.iam;

import com.cloudbuilder.iam.domain.port.ProjectRepository;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;

@Configuration
@EnableJpaRepositories(
    basePackages = "com.cloudbuilder.iam.domain.port",
    excludeFilters = @org.springframework.context.annotation.ComponentScan.Filter(
        type = org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE,
        classes = ProjectRepository.class
    )
)
public class IAMModuleConfig {

    @Bean("iamProjectRepository")
    public ProjectRepository iamProjectRepository(EntityManager entityManager) {
        return new JpaRepositoryFactory(entityManager).getRepository(ProjectRepository.class);
    }
}
