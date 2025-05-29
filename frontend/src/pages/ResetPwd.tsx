// src/pages/ResetPassword.tsx
import { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import '../styles/ResetPwd.css';
import { forgotPassword, resetPassword } from "../api/auth";
import axios from 'axios';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0); // 倒计时秒数

  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (isSending || cooldown > 0) return;

    setIsSending(true);
    if (!email) {
      alert("Please enter your email.");
      setIsSending(false);
      return;
    }
    setCooldown(60); // 设置为60秒
    setCodeSent(true);
    try {
      await forgotPassword(email);
      setCodeSent(true);
      alert("Verification code sent to your email, Valid in 5 minutes.");
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
          // 后端返回的错误信息
          const errMsg = error.response.data?.message || "Verification code failed to send.";
          setError(errMsg); // 显示在页面上
        } else {
          setError("Verification code failed to send.");
        }
    } finally{
      setIsSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    try {
      const res = await resetPassword(email, code, newPassword);
      localStorage.setItem("token", res.data.token);
      alert("Password reset successful!");
      navigate("/dashboard");
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
          // 后端返回的错误信息
          const errMsg = error.response.data?.message || "Reset password failed.";
          setError(errMsg); // 显示在页面上
        } else {
          setError("Reset password failed.");
        }
    }
  };

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  return (
    <div className="reset-container">
      <form className="reset-form" onSubmit={handleSubmit}>
        <h2>Reset Password</h2>

        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />

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

        <label>New Password</label>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />

        <label>Confirm New Password</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />

        {error && <p className="error-msg">{error}</p>}

        <button type="submit" className="submit-button">Reset Password</button>
        <p className="redirect-link">
          Remember your password? <span onClick={() => navigate('/login')}>Log In</span>
        </p>
      </form>
    </div>
  );
}

export default ResetPassword;