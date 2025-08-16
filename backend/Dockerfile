# Многоэтапная сборка для Spring Boot приложения
FROM maven:3.9.6-eclipse-temurin-21 AS build

# Установка рабочей директории
WORKDIR /app

# Копирование файлов Maven
COPY pom.xml .
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn

# Загрузка зависимостей (кэшируется если pom.xml не изменился)
RUN mvn dependency:go-offline -B

# Копирование исходного кода
COPY src src

# Сборка приложения
RUN mvn clean package -DskipTests

# Финальный образ
FROM eclipse-temurin:21-jre-jammy

# Установка curl для healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Создание пользователя для безопасности
RUN groupadd -r spring && useradd -r -g spring spring

# Установка рабочей директории
WORKDIR /app

# Копирование JAR файла из этапа сборки
COPY --from=build /app/target/*.jar app.jar

# Изменение владельца файлов
RUN chown -R spring:spring /app

# Переключение на пользователя spring
USER spring

# Открытие порта
EXPOSE 8080

# Настройка JVM для контейнера
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Команда запуска
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dspring.profiles.active=docker -jar app.jar"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1