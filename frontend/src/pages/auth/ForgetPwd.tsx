import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

function ForgetPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/resetPassword`, // 可选，设置重定向页面
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess("Check your email for the password reset link.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleReset}
        className="w-full max-w-md bg-white p-6 rounded-lg shadow space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">Reset Password</h2>

        <Label className="block text-sm font-medium text-gray-700">Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>

        <p className="text-sm text-center text-gray-600">
          Remember your password?{" "}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Log In
          </span>
        </p>
      </form>
    </div>
  )
}

export default ForgetPassword






























/*
// src/pages/ResetPassword.tsx
import { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../api/auth";
import axios from 'axios';

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

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
      navigate("/");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        className="w-full max-w-md bg-white p-6 rounded-lg shadow space-y-4"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">Reset Password</h2>

        <Label className="block text-sm font-medium text-gray-700">Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            type="button"
            onClick={handleSendCode}
            disabled={isSending || cooldown > 0}
            className={`px-4 py-2 rounded-md text-sm text-white transition ${
              isSending || cooldown > 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : codeSent ? "Resend Code" : "Send Code"}
          </Button>
        </div>

        <Label className="block text-sm font-medium text-gray-700">New Password</Label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <Label className="block text-sm font-medium text-gray-700">Confirm New Password</Label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Reset Password
        </Button>

        <p className="text-sm text-center text-gray-600">
          Remember your password?{" "}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Log In
          </span>
        </p>
      </form>
    </div>
  );
}

export default ResetPassword;
*/