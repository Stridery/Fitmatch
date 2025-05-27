import { useState } from "react";
import { useNavigate } from "react-router-dom";

import '../styles/SignUp.css';
import { sendRegisterCode, confirmRegister } from '../api/auth'; // 可选：连接后端

function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      alert("Please enter your email first.");
      return;
    }
    try {
      await sendRegisterCode(email);
      alert("Verification code sent!");
      setCodeSent(true);
    } catch (err) {
      alert("Failed to send code.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const result = await confirmRegister(email, code);
      localStorage.setItem("token", result.token);
      navigate("/dashboard");
    } catch (err) {
      alert("Sign up failed.");
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

        <button type="submit" className="submit-button">Sign Up</button>
        <p className="redirect-link">
          Already have an account? <span onClick={() => navigate('/login')}>Log In</span>
        </p>
      </form>
    </div>
  );
}

export default SignUp;