import { useState } from "react";
import { useNavigate } from "react-router-dom";

// src/components/SignUp.tsx
function SignUp() {
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
      <div style={{ padding: "2rem" }}>
        <h1>Create Your FitMatch Account</h1>
        <p>This is the sign-up page.</p>
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
            <input
            type="passwordConfirm"
            placeholder="Confirm Your Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            />
            
            <button type="submit">Sign Up</button>
        </form>
      </div>
    );
  }
  
export default SignUp;  