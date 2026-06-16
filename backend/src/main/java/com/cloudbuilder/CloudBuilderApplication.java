package com.cloudbuilder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.modulith.Modulith;

@SpringBootApplication
@Modulith
public class CloudBuilderApplication {
    public static void main(String[] args) {
        SpringApplication.run(CloudBuilderApplication.class, args);
    }
}
