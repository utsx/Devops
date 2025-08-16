package ru.utsx.Devops.core.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = {
        "ru.utsx.Devops.domain",
})
@EnableJpaAuditing
public class CoreConfiguration {
}
