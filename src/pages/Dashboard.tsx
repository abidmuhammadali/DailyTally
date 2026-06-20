import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-[#FBF7EE] p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1F2D3D]">DailyTally</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#6B7785]">{user?.email}</span>
          <button
            onClick={signOut}
            className="text-sm text-[#B5482A] border border-[#B5482A] rounded px-3 py-1"
          >
            Sign Out
          </button>
        </div>
      </header>

      <p className="text-[#1F2D3D]">Welcome — this is your dashboard. We'll build real content here soon.</p>
    </div>
  )
}