import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF7EE]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-8 rounded shadow-sm border border-gray-200"
      >
        <h1 className="text-2xl font-bold text-[#1F2D3D] mb-6">Sign In</h1>

        {error && (
          <p className="text-sm text-[#B5482A] bg-red-50 border border-red-200 rounded p-2 mb-4">
            {error}
          </p>
        )}

        <label className="block text-sm text-[#6B7785] mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded p-2 mb-4"
        />

        <label className="block text-sm text-[#6B7785] mb-1">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded p-2 mb-6"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2F6F4E] text-white rounded p-2 font-medium disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="text-sm text-[#6B7785] mt-4 text-center">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#2F6F4E] font-medium">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  )
}