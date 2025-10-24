import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
    } else if (data.session) {
      localStorage.setItem("userId", data.user.id)
      navigate("/dashboard")
    } else {
      setError("Unexpected login error.")
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
          <p className="text-gray-400 mt-2">Where coaches and students connect</p>
        </div>

        {/* Login Form */}
        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-white">Log In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-white focus:ring-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-white focus:ring-white"
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-2 rounded-lg transition-all duration-200 hover:scale-105 transform"
              >
                Log In
              </Button>

              <div className="text-sm text-center text-gray-400 space-y-2">
                <div>
                  Don't have an account?{" "}
                  <span
                    onClick={() => navigate("/signup")}
                    className="text-white cursor-pointer hover:text-gray-300 transition-colors duration-200 hover:underline"
                  >
                    Sign Up
                  </span>
                </div>
                <div>
                  <span
                    onClick={() => navigate("/forgetPwd")}
                    className="text-white cursor-pointer hover:text-gray-300 transition-colors duration-200 hover:underline"
                  >
                    Forgot Password?
                  </span>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login
