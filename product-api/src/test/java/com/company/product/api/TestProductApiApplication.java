package com.company.product.api;

import org.springframework.boot.SpringApplication;

public class TestProductApiApplication {

	public static void main(String[] args) {
		SpringApplication.from(ProductApiApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
