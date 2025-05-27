// src/pages/ResetPassword.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/ResetPwd.css';
import { sendResetCode, resetPassword } from "../api/auth";

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (!email) {
      alert("Please enter your email.");
      return;
    }
    try {
      await sendResetCode(email);
      setCodeSent(true);
      alert("Verification code sent to your email.");
    } catch {
      alert("Failed to send verification code.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    try {
      const res = await resetPassword(email, newPassword, code);
      localStorage.setItem("token", res.token);
      alert("Password reset successful!");
      navigate("/dashboard");
    } catch (err) {
      alert("Failed to reset password.");
    }
  };

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
          <button type="button" onClick={handleSendCode} className="send-code-button">
            {codeSent ? "Resend Code" : "Send Code"}
          </button>
        </div>

        <label>New Password</label>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />

        <label>Confirm New Password</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />

        <button type="submit" className="submit-button">Reset Password</button>
        <p className="redirect-link">
          Remember your password? <span onClick={() => navigate('/login')}>Log In</span>
        </p>
      </form>
    </div>
  );
}

export default ResetPassword;