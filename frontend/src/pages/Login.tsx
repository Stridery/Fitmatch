
import { useState } from "react";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";

// src/pages/Login.tsx
import { login } from "../api/auth";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login(email, password);
      localStorage.setItem("token", result.token);
      navigate("/dashboard");
    } catch {
      alert("Login failed.");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="brand-logo">FITMATCH</div>
        <p className="brand-text">Where coaches and students connect</p>
      </div>
      <div className="login-right">
        <form className="login-form" onSubmit={handleLogin}>
          <h2 onClick={() => navigate("/dashboard")}>Log In (click to dashboard for testing)</h2>

          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="login-btn">Log In</button>

          <div className="login-footer">
            <span onClick={() => navigate("/signup")}>Don't have an account? Sign Up</span>
            <span onClick={() => navigate("/resetPwd")}>Forgot Password?</span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;