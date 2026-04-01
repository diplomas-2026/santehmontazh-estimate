FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY . .
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/product-api-0.0.1-SNAPSHOT.jar app.jar
COPY --from=build /app/seed-data ./seed-data
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
