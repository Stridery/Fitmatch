package com.fitmatch.courseservice.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class DatabaseTableInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("🚀 Starting database table initialization...");
        
        try {
            // 检查JdbcTemplate是否可用
            if (jdbcTemplate == null) {
                log.error("❌ JdbcTemplate is null - cannot initialize tables");
                return;
            }
            log.info("✅ JdbcTemplate is available");
            
            // 测试数据库连接
            try {
                jdbcTemplate.queryForObject("SELECT 1", Integer.class);
                log.info("✅ Database connection is working");
            } catch (Exception e) {
                log.error("❌ Database connection failed", e);
                return;
            }
            
            // 创建 availability_courses 表
            createAvailabilityCoursesTable();
            
        } catch (Exception e) {
            log.error("❌ Failed to initialize database tables", e);
            // 不要抛出异常，让应用继续启动
            log.warn("⚠️ Continuing application startup despite database table initialization failure");
        }
    }
    
    private void createAvailabilityCoursesTable() {
        try {
            log.info("🔄 Creating availability_courses table...");
            
            String createTableSql = """
                CREATE TABLE IF NOT EXISTS availability_courses (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    availability_id UUID NOT NULL,
                    course_id UUID NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    
                    -- 唯一约束：同一个availability不能关联同一个course多次
                    CONSTRAINT uk_availability_courses_unique 
                        UNIQUE (availability_id, course_id)
                )
                """;
            
            jdbcTemplate.execute(createTableSql);
            log.info("✅ availability_courses table created successfully");
            
            // 创建索引
            String createIndexSql1 = "CREATE INDEX IF NOT EXISTS idx_availability_courses_availability_id ON availability_courses(availability_id)";
            String createIndexSql2 = "CREATE INDEX IF NOT EXISTS idx_availability_courses_course_id ON availability_courses(course_id)";
            
            jdbcTemplate.execute(createIndexSql1);
            jdbcTemplate.execute(createIndexSql2);
            log.info("✅ Indexes created successfully");
            
            // 验证表是否存在
            String checkTableSql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'availability_courses'";
            Integer tableCount = jdbcTemplate.queryForObject(checkTableSql, Integer.class);
            
            if (tableCount != null && tableCount > 0) {
                log.info("✅ availability_courses table verified and ready");
            } else {
                log.warn("⚠️ availability_courses table verification failed");
            }
            
        } catch (Exception e) {
            if (e.getMessage().contains("already exists")) {
                log.info("✅ availability_courses table already exists");
            } else {
                log.error("❌ Failed to create availability_courses table", e);
                throw e;
            }
        }
    }
}
