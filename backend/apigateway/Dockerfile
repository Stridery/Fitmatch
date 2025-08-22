# ---------- build ----------
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
# 预拉依赖，后续改代码也能复用缓存
RUN mvn -B -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests package

# ---------- run ----------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
EXPOSE 8080
# 可通过 JAVA_OPTS 传 JVM 参数（内存/GC/调试端口等）
ENV JAVA_OPTS=""
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]