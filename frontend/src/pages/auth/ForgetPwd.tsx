import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-3xl font-bold text-white tracking-wider cursor-pointer hover:text-gray-300 transition-colors duration-200"
            onClick={() => navigate("/")}
          >
            SportaX
          </h1>
          <p className="text-gray-400 mt-2">Reset your password securely</p>
        </div>

        {/* Reset Password Form */}
        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-white">Reset Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-white focus:ring-white"
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-900/20 border border-green-500/50 text-green-400 px-3 py-2 rounded-md text-sm">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-2 rounded-lg transition-all duration-200 hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <div className="text-sm text-center text-gray-400">
                Remember your password?{" "}
                <span
                  className="text-white cursor-pointer hover:text-gray-300 transition-colors duration-200 hover:underline"
                  onClick={() => navigate("/login")}
                >
                  Log In
                </span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ForgetPassword