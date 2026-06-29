import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
    setTimeout(() => navigate('/dashboard'), 1000)
  }

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-inter bg-[#C9974C]">
      {/* Left panel — brand */}
      <div className="md:w-1/2 bg-[#1F2D3D] text-white flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <svg className="absolute top-10 right-12 w-14 h-14 opacity-90 rotate-[8deg]" viewBox="0 0 60 60" fill="none" stroke="#C9D3DC" strokeWidth="2.5">
          <line x1="10" y1="10" x2="10" y2="40" />
          <line x1="20" y1="10" x2="20" y2="40" />
          <line x1="30" y1="10" x2="30" y2="40" />
          <line x1="40" y1="10" x2="40" y2="40" />
        </svg>
        <svg className="absolute bottom-16 left-10 w-16 h-16 opacity-15 -rotate-[12deg]" viewBox="0 0 60 60" fill="none" stroke="#C9D3DC" strokeWidth="2">
          <line x1="10" y1="10" x2="10" y2="45" />
          <line x1="20" y1="10" x2="20" y2="45" />
          <line x1="30" y1="10" x2="30" y2="45" />
          <line x1="40" y1="10" x2="40" y2="45" />
          <line x1="5" y1="40" x2="45" y2="15" />
        </svg>
        <svg className="absolute top-1/3 left-6 w-10 h-10 opacity-10 rotate-[20deg]" viewBox="0 0 60 60" fill="none" stroke="#C9D3DC" strokeWidth="2">
          <line x1="10" y1="10" x2="10" y2="35" />
          <line x1="20" y1="10" x2="20" y2="35" />
          <line x1="30" y1="10" x2="30" y2="35" />
        </svg>
        <svg className="absolute bottom-24 right-16 w-12 h-12 opacity-20 rotate-[-6deg]" viewBox="0 0 60 60" fill="none" stroke="#C9D3DC" strokeWidth="2">
          <line x1="10" y1="10" x2="10" y2="38" />
          <line x1="20" y1="10" x2="20" y2="38" />
          <line x1="30" y1="10" x2="30" y2="38" />
          <line x1="40" y1="10" x2="40" y2="38" />
          <line x1="5" y1="34" x2="42" y2="12" />
        </svg>

        <img src={logo} alt="DailyTally" className="w-48 h-48 object-contain mb-8" />
        <p className="max-w-sm text-[#C9D3DC] leading-relaxed">
          DailyTally is your essential digital ledger, reimagining old-school record-keeping with modern efficiency. 
          Stop guessing. Start tallying. Your digital record, our analog charm.
        </p>
        <p className="font-cabinet font-bold text-[#C9974C] mt-6 text-lg tracking-wider">
          #YOURRECORDSSIMPLIFIED
        </p>
      </div>

      {/* Right panel — form */}
      <div className="md:w-1/2 bg-[#C9974C] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Vintage Sparkle Accent Asset */}
        <svg
          className="absolute bottom-12 right-12 w-14 h-14 z-0"
          viewBox="0 0 24 24"
          fill="#FFF8E7"
          style={{ filter: 'drop-shadow(0 0 8px #FFF3D6) drop-shadow(0 0 16px #FFE8A3)' }}
        >
          <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
        </svg>

        <div className="w-full max-w-sm relative z-10">
          {/* Custom Multi-Tab Selector Container */}
          <div className="flex ml-2">
            <Link 
              to="/signin" 
              className="bg-[#FFF8E7]/50 hover:bg-[#FFF8E7]/80 transition-all border-2 border-b-0 border-[#1F2D3D] px-6 py-2 rounded-t-xl font-cabinet font-bold text-[#1F2D3D]/60 text-sm"
            >
              Sign In
            </Link>
            <div className="bg-[#FFF8E7] border-2 border-b-0 border-l-0 border-[#1F2D3D] px-6 py-2 rounded-t-xl font-cabinet font-bold text-[#1F2D3D] z-10 text-sm shadow-[2px_-2px_0px_rgba(0,0,0,0.05)]">
              Create Account
            </div>
          </div>

          {/* Main Core Structural Box */}
          <div className="bg-[#FFF8E7] border-2 border-[#1F2D3D] shadow-[6px_6px_0px_0px_#1F2D3D] rounded-xl rounded-tl-none p-8 w-full">
            <h1 className="font-cabinet font-bold text-2xl text-[#1F2D3D] mb-6">Create Account</h1>

            {error && (
              <p className="text-sm font-bold text-[#B5482A] bg-red-50 border-2 border-[#B5482A] rounded-lg p-3 mb-4 shadow-[2px_2px_0px_0px_#B5482A]">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm font-bold text-[#1F2D3D] bg-green-50 border-2 border-green-200 rounded-lg p-3 mb-4 shadow-[2px_2px_0px_0px_#22c55e]">
                Account created! Redirecting...
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#1F2D3D] mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border-2 border-[#1F2D3D] rounded-lg p-2.5 text-[#1F2D3D] font-medium shadow-[2px_2px_0px_0px_#1F2D3D] focus:outline-none focus:translate-x-[0.5px] focus:translate-y-[0.5px]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#1F2D3D] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border-2 border-[#1F2D3D] rounded-lg p-2.5 text-[#1F2D3D] font-medium shadow-[2px_2px_0px_0px_#1F2D3D] focus:outline-none focus:translate-x-[0.5px] focus:translate-y-[0.5px]"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-bold text-[#1F2D3D] mb-1">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-2 border-[#1F2D3D] rounded-lg p-2.5 pr-10 text-[#1F2D3D] font-medium shadow-[2px_2px_0px_0px_#1F2D3D] focus:outline-none focus:translate-x-[0.5px] focus:translate-y-[0.5px]"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[36px] text-[#1F2D3D]/70 hover:text-[#1F2D3D] focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1F2D3D] text-white border-2 border-[#1F2D3D] rounded-lg p-2.5 font-cabinet font-bold shadow-[2px_2px_0px_0px_#111A24] disabled:opacity-50 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none mt-2"
              >
                {loading ? 'Creating account...' : 'Continue'}
              </button>
            </form>

            <div className="flex items-center gap-2 my-5">
              <div className="flex-1 h-[1px] bg-gray-300" />
              <span className="text-xs text-[#6B7785]">or</span>
              <div className="flex-1 h-[1px] bg-gray-300" />
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-white border-2 border-[#1F2D3D] rounded-lg p-2.5 flex items-center justify-center gap-2 font-medium text-[#1F2D3D] shadow-[2px_2px_0px_0px_#1F2D3D] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-gray-50"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.26h2.92c1.71-1.57 2.69-3.88 2.69-6.63z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.997 8.997 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A8.997 8.997 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.997 8.997 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
              </svg>
              Continue with Google
            </button>

            <p className="text-sm text-[#6B7785] mt-5 text-center">
              Already have an account?{' '}
              <Link to="/signin" className="text-[#1F2D3D] font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}