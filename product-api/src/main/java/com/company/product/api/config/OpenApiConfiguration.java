package com.company.product.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfiguration {

    @Bean
    OpenAPI openApi() {
        return new OpenAPI()
            .info(new Info()
                .title("Product API")
                .description("API для расчета сметы и закупки материалов")
                .version("1.0.0"));
    }
}
