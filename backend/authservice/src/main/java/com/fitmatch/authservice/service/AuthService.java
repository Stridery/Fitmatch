package com.fitmatch.authservice.service;

import com.fitmatch.authservice.dto.LoginRequest;
import com.fitmatch.authservice.dto.RegisterRequest;
import com.fitmatch.authservice.dto.ResetPasswordRequest;
import com.fitmatch.authservice.entity.User;
import com.fitmatch.authservice.exception.ConflictException;
import com.fitmatch.authservice.repository.UserRepository;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import com.fitmatch.authservice.repository.OAuthAccountRepository;
import lombok.RequiredArgsConstructor;


import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OAuthAccountRepository oauthAccountRepository;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    /**
     * 注册第一步：发送验证码并保存注册信息到 Redis
     */
    public void initRegister(RegisterRequest request) {
        String email = request.getEmail();

        // 是否已注册
        if (userRepository.findByEmail(email).isPresent() ||
            oauthAccountRepository.findByEmail(email).isPresent()) {
            throw new ConflictException("This email is already registered. Please log in directly");
        }

        // 生成验证码 + 保存
        String code = emailService.generate6DigitCode();
        emailService.saveCode(email, code);

        // 发送邮件
        emailService.sendCodeEmail(email, code, 0);

        // 临时保存注册请求数据
        emailService.saveRegisterRequest(email, request);

    }

    /**
     * 注册第二步：用户提交验证码，验证并完成注册
     */
    public String confirmRegister(String email, String code) {
        // 校验验证码
        if (!emailService.verifyCode(email, code)) {
            throw new ConflictException("Validation code incorrect or expired");
        }

        // 读取注册信息
        RegisterRequest request = emailService.loadRegisterRequest(email);
        if (request == null) {
            throw new ConflictException("Registration information expired, please register again");
        }

        // 创建用户
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .role(request.getRole().toUpperCase())
                .emailVerified(true)
                .build();

        userRepository.save(user);

        // 清除缓存
        emailService.deleteCode(email);
        emailService.deleteRegisterRequest(email);

        // 自动登录：生成 JWT
        return jwtService.generateToken(user.getId());
    }

    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ConflictException("User does not exist"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ConflictException("Password incorrect");
        }

        // 登录成功，返回 JWT token
        return jwtService.generateToken(user.getId());
    }

    public void forgotPassword(@Email(message = "Please enter a valid email address") @NotBlank(message = "Email cannot be blank") String email){
        if (userRepository.findByEmail(email).isPresent()) {
            // 生成验证码 + 保存
            String code = emailService.generate6DigitCode();
            emailService.saveCode(email, code);

            // 发送邮件
            emailService.sendCodeEmail(email, code, 1);
        }
        else throw new ConflictException("User does not exist");
    }

    public String resetPassword(ResetPasswordRequest request){
        // 校验验证码
        if (!emailService.verifyCode(request.getEmail(), request.getCode())) {
            throw new ConflictException("Validation code incorrect or expired");
        }
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ConflictException("User does not exist"));

        if(passwordEncoder.matches(request.getNewpassword(), user.getPassword())){
            throw new ConflictException("Please enter a new password different from before");
        }
        user.setPassword(passwordEncoder.encode(request.getNewpassword()));
        userRepository.save(user);

        // 清除缓存
        emailService.deleteCode(request.getEmail());

        // 登录成功，返回 JWT token
        return jwtService.generateToken(user.getId());
    }
}