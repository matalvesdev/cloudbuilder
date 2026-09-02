package com.cloudbuilder;

import com.cloudbuilder.shared.config.DatabaseUrlConfigurer;
import com.cloudbuilder.shared.config.RenderLitePackageFilter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.modulith.Modulith;

@SpringBootApplication
@Modulith
@ComponentScan(excludeFilters = @ComponentScan.Filter(
    type = FilterType.CUSTOM,
    classes = RenderLitePackageFilter.class
))
public class CloudBuilderApplication {
    public static void main(String[] args) {
        // Render/Neon commonly provide DATABASE_URL (postgresql://...), while
        // Spring needs JDBC URL and separate credentials. Prefer the platform
        // URL when present so existing secret configuration remains usable.
        DatabaseUrlConfigurer.configureFrom(System.getenv());
        SpringApplication.run(CloudBuilderApplication.class, args);
    }
}
