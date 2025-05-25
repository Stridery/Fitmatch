package com.fitmatch.authservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.fitmatch.authservice.dto.RegisterRequest;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderAddress;

    private static final String CODE_PREFIX = "email:code:";
    private static final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 构建 Redis 中验证码存储 key
     */
    private String  buildKey(String email) {
        return CODE_PREFIX + email;
    }

    /**
     * 生成一个 6 位验证码
     */
    public String generate6DigitCode() {
        int code = secureRandom.nextInt(900_000) + 100_000;
        return String.valueOf(code);
    }

    /**
     * 保存验证码到 Redis（5分钟过期）
     */
    public void saveCode(String email, String code) {
        redisTemplate.opsForValue().set(buildKey(email), code, 5, TimeUnit.MINUTES);
    }

    /**
     * 校验验证码
     */
    public boolean verifyCode(String email, String inputCode) {
        String cachedCode = redisTemplate.opsForValue().get(buildKey(email));
        return inputCode != null && inputCode.equals(cachedCode);
    }

    /**
     * 删除验证码
     */
    public void deleteCode(String email) {
        redisTemplate.delete(buildKey(email));
    }

    /**
     * 实际发送邮件
     */
    public void sendCodeEmail(String email, String code) {
        String subject = "【FitMatch】注册验证码";
        String body = String.format("""
            您正在注册 FitMatch 账号，您的验证码是：

            %s

            请在 5 分钟内完成验证。如非本人操作，请忽略本邮件。
            """, code);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderAddress);  // ✅ 发件人必须和 spring.mail.username 一致
        message.setTo(email);            // ✅ 收件人是用户填写的邮箱
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }

    /**
     * 保存注册请求信息到 Redis（序列化为 JSON）
     */
    public void saveRegisterRequest(String email, RegisterRequest request) {
        try {
            String json = objectMapper.writeValueAsString(request);
            redisTemplate.opsForValue().set("register:data:" + email, json, 10, TimeUnit.MINUTES);
        } catch (Exception e) {
            throw new RuntimeException("注册信息保存失败", e);
        }
    }

    /**
     * 从 Redis 中加载注册请求信息（反序列化）
     */
    public RegisterRequest loadRegisterRequest(String email) {
        try {
            String json = redisTemplate.opsForValue().get("register:data:" + email);
            if (json == null) return null;
            return objectMapper.readValue(json, RegisterRequest.class);
        } catch (Exception e) {
            throw new RuntimeException("注册信息读取失败", e);
        }
    }

    /**
     * 删除注册请求信息（注册完成或过期后调用）
     */
    public void deleteRegisterRequest(String email) {
        redisTemplate.delete("register:data:" + email);
    }
}