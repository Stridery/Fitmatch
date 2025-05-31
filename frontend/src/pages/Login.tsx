
import { useState } from "react";
//import "../styles/Login.css";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

// src/pages/Login.tsx
import { login } from "../api/auth";

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>('');


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login(email, password);
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
    }


  return (
    <div className="flex h-screen">
      <div className="w-1/2 bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-blue-600 mb-2">FITMATCH</div>
        <p className="text-gray-500 text-center px-4">Where coaches and students connect</p>
      </div>
      <div className="w-1/2 flex items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md"
        >
          <h2
            className="text-2xl font-semibold text-center cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            Log In (click to dashboard for testing)
          </h2>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Button type="submit" className="w-full">
            Log In
          </Button>

          <div className="text-sm text-center text-gray-500 space-y-1 mt-4">
            <div>
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/signup")}
                className="text-blue-600 cursor-pointer hover:underline"
              >
                Sign Up
              </span>
            </div>
            <div>
              <span
                onClick={() => navigate("/resetPwd")}
                className="text-blue-600 cursor-pointer hover:underline"
              >
                Forgot Password?
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;