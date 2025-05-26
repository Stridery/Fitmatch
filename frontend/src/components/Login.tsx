// src/components/Login.tsx
import { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { email, password });
    // TODO: Send to backend for verification
    navigate("/dashboard");
    console.log("navigate to dashoard") 
  };

  return (
    <div className="login-container">
      <h2>Login to FitMatch</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign Up</button>
      </form>

      <p style={{ marginTop: "1rem"}}>
        Dont't have an account?{" "}
        <button
          type="button"
          onClick={() => navigate("/signup")}
          style={{
            background: "none",
            border: "none",
            color: "#646cff",
            cursor: "pointer",
            textDecoration: "underline",
            fontSize: "1rem",
          }}
        >
          Sign Up
        </button>

      </p>
    </div>
  );
}

export default Login;