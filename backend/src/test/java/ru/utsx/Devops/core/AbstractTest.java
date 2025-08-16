package ru.utsx.Devops.core;

import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@ActiveProfiles("test")
@ExtendWith(SpringExtension.class)
public class AbstractTest {

    @Container
    protected static final PostgreSQLContainer<?> POSTGRES_CONTAINER =
            new PostgreSQLContainer<>("postgres:latest")
                    .withDatabaseName("testdb")
                    .withUsername("test")
                    .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        System.out.println("JDBC: " + POSTGRES_CONTAINER.getJdbcUrl());
        registry.add("spring.datasource.url", POSTGRES_CONTAINER::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES_CONTAINER::getUsername);
        registry.add("spring.datasource.password", POSTGRES_CONTAINER::getPassword);

        registry.add("spring.liquibase.url", POSTGRES_CONTAINER::getJdbcUrl);
        registry.add("spring.liquibase.user", POSTGRES_CONTAINER::getUsername);
        registry.add("spring.liquibase.password", POSTGRES_CONTAINER::getPassword);

        registry.add("spring.liquibase.change-log", () -> "classpath:/db/changelog/db.changelog-master.yaml");
    }

}
