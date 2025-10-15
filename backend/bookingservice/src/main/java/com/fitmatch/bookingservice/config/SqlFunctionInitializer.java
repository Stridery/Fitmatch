package com.fitmatch.bookingservice.config;

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
public class SqlFunctionInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("🚀 Starting SQL function initialization...");
        
        try {
            // 检查JdbcTemplate是否可用
            if (jdbcTemplate == null) {
                log.error("❌ JdbcTemplate is null - cannot initialize functions");
                return;
            }
            log.info("✅ JdbcTemplate is available");
            
            
            // 读取SQL函数文件
            ClassPathResource resource = new ClassPathResource("sql/booking_functions.sql");
            if (!resource.exists()) {
                log.error("❌ SQL file not found: sql/booking_functions.sql");
                return;
            }
            log.info("✅ SQL file found: sql/booking_functions.sql");
            
            String sql = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
            log.info("✅ SQL content loaded, length: {} characters", sql.length());
            
            // 测试数据库连接
            try {
                jdbcTemplate.queryForObject("SELECT 1", Integer.class);
                log.info("✅ Database connection is working");
            } catch (Exception e) {
                log.error("❌ Database connection failed", e);
                return;
            }
            
            // 执行SQL函数创建
            log.info("🔄 Executing SQL functions...");
            try {
                jdbcTemplate.execute(sql);
                log.info("✅ SQL functions executed successfully");
            } catch (Exception e) {
                if (e.getMessage().contains("already exists")) {
                    log.info("✅ SQL functions already exist, skipping creation");
                } else {
                    throw e;
                }
            }
            
            // 验证函数是否存在
            verifyFunctions();
            
        } catch (Exception e) {
            log.error("❌ Failed to initialize SQL functions", e);
            // 不要抛出异常，让应用继续启动
            log.warn("⚠️ Continuing application startup despite SQL function initialization failure");
        }
    }
    
    private void verifyFunctions() {
        log.info("🔍 Verifying SQL functions...");
        
        String[] functions = {
            "book_existing_session",
            "cancel_session_booking", 
            "promote_waitlist_head"
        };
        
        for (String functionName : functions) {
            try {
                String checkFunction = """
                    SELECT EXISTS (
                        SELECT 1 FROM pg_proc p
                        JOIN pg_namespace n ON p.pronamespace = n.oid
                        WHERE n.nspname = 'public' AND p.proname = ?
                    )
                    """;
                
                Boolean exists = jdbcTemplate.queryForObject(checkFunction, Boolean.class, functionName);
                
                if (Boolean.TRUE.equals(exists)) {
                    log.info("✅ Function '{}' exists", functionName);
                } else {
                    log.error("❌ Function '{}' does not exist", functionName);
                }
                
            } catch (Exception e) {
                log.error("❌ Error checking function '{}': {}", functionName, e.getMessage());
            }
        }
        
        // 检查视图
        try {
            String checkView = """
                SELECT EXISTS (
                    SELECT 1 FROM pg_views 
                    WHERE schemaname = 'public' AND viewname = 'v_student_personal_schedule'
                )
                """;
            
            Boolean viewExists = jdbcTemplate.queryForObject(checkView, Boolean.class);
            
            if (Boolean.TRUE.equals(viewExists)) {
                log.info("✅ View 'v_student_personal_schedule' exists");
            } else {
                log.error("❌ View 'v_student_personal_schedule' does not exist");
            }
            
        } catch (Exception e) {
            log.error("❌ Error checking view: {}", e.getMessage());
        }
    }
}
