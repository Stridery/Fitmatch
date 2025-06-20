import axios from 'axios'
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { register, confirmRegister } from '../../api/auth'

function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'coach'>('student');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSendCode = async () => {
    if (isSending || cooldown > 0) return

    setIsSending(true)

    if (!email) {
      alert("Please enter your email first.")
      setIsSending(false)
      return
    }

    setCooldown(60)
    setCodeSent(true)

    try {
      await register(email, password, nickname)
      alert("Verification code sent to your email, valid for 5 minutes.")
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const errMsg = error.response.data?.message || "Login failed."
        setError(errMsg)
      } else {
        setError("Login failed.")
      }
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert("Passwords do not match!")
      return
    }
    try {
      const result = await confirmRegister(email, code)
      localStorage.setItem("token", result.data.token)
      navigate("/dashboard")
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const errMsg = error.response.data?.message || "Login failed."
        setError(errMsg)
      } else {
        setError("Login failed.")
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-6 rounded-lg shadow space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">Create Account</h2>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Nickname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Role Select 
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select your role</label>
          <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex-1 py-2 rounded-md border text-sm font-medium transition ${
              role === 'student'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-black hover:bg-blue-100 hover:text-white'
            }`}
            >
            Student
          </button>

          <button
            type="button"
            onClick={() => setRole('coach')}
            className={`flex-1 py-2 rounded-md border text-sm font-medium transition ${
              role === 'coach'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-black hover:bg-blue-100 hover:text-white'
            }`}
            >
            Coach
          </button>
          </div>
        </div>
        */}

        {/* Verification Code */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Verification Code"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={isSending || cooldown > 0}
            className={`px-4 py-2 rounded-md text-sm text-white transition ${
              isSending || cooldown > 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : codeSent ? "Resend Code" : "Send Code"}
          </button>
        </div>

        {/* Error Message */}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Sign Up
        </button>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate('/login')}
          >
            Log In
          </span>
        </p>
      </form>
    </div>
  )
}

export default SignUp