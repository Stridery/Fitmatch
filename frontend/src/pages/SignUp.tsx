import axios from 'axios';

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/SignUp.css';
import { register, confirmRegister } from '../api/auth'; // 可选：连接后端

function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'coach'>('student');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0); // 倒计时秒数

  const handleSendCode = async () => {
    if (isSending || cooldown > 0) return;

    setIsSending(true);
    if (!email) {
      alert("Please enter your email first.");
      setIsSending(false);
      return;
      
    }
    setCooldown(60); // 设置为60秒
    setCodeSent(true);
    try {
      await register(email, password, nickname, role);
      alert("Verification code sent to your email, Valid in 5 minutes.");
      
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
          // 后端返回的错误信息
          const errMsg = error.response.data?.message || "Login failed.";
          setError(errMsg); // 显示在页面上
        } else {
          setError("Login failed.");
        }
    } finally{
      setIsSending(false);
    }
  };

  useEffect(() => {
  if (cooldown > 0) {
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }
}, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const result = await confirmRegister(email, code);
      localStorage.setItem("token", result.data.token);
      navigate("/dashboard");
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
          // 后端返回的错误信息
          const errMsg = error.response.data?.message || "Login failed.";
          setError(errMsg); // 显示在页面上
        } else {
          setError("Login failed.");
        }
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>Create Account</h2>

        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />

        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />

        <label>Confirm Password</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />

        <label>Nickname</label>
        <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} required />

        <label>Select your role</label>
        <div className="role-group">
          <button
            type="button"
            className={role === 'student' ? 'role-button selected' : 'role-button'}
            onClick={() => setRole('student')}
          >
            Student
          </button>
          <button
            type="button"
            className={role === 'coach' ? 'role-button selected' : 'role-button'}
            onClick={() => setRole('coach')}
          >
            Coach
          </button>
        </div>

        <div className="code-group">
          <input
            type="text"
            placeholder="Verification Code"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
          />

          <button
            type="button"
            onClick={handleSendCode}
            className="send-code-button"
            disabled={isSending || cooldown > 0}
            style={{ backgroundColor: isSending || cooldown > 0 ? '#ccc' : '' }}
          >
          {cooldown > 0 ? `Resend in ${cooldown}s` : (codeSent ? "Resend Code" : "Send Code")}
        </button>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button type="submit" className="submit-button">Sign Up</button>
        <p className="redirect-link">
          Already have an account? <span onClick={() => navigate('/login')}>Log In</span>
        </p>
      </form>
    </div>
  );
}

export default SignUp;