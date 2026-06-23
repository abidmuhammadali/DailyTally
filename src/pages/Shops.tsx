import { useState, type FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type Shop = {
  id: string
  name: string
  type: string
  created_at: string
}

export default function Shops() {
  const { user, signOut } = useAuth()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [type, setType] = useState('general_store')
  const [error, setError] = useState<string | null>(null)

  const { data: shops, isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Shop[]
    },
  })

  const createShop = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('shops')
        .insert({ name, type, owner_id: user!.id })
      if (error) throw error
    },
    onSuccess: () => {
      setName('')
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['shops'] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Shop name is required')
      return
    }
    createShop.mutate()
  }

  return (
    <div className="min-h-screen bg-[#FBF7EE] p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1F2D3D]">DailyTally</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#6B7785]">{user?.email}</span>
          <button onClick={signOut} className="text-sm text-[#B5482A] border border-[#B5482A] rounded px-3 py-1">
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-2xl">
        <h2 className="text-xl font-bold text-[#1F2D3D] mb-4">Your Shops</h2>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded border border-gray-200 mb-8">
          {error && (
            <p className="text-sm text-[#B5482A] bg-red-50 border border-red-200 rounded p-2 mb-4">
              {error}
            </p>
          )}

          <label className="block text-sm text-[#6B7785] mb-1">Shop Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 mb-4"
            placeholder="e.g. Ahmed General Store"
          />

          <label className="block text-sm text-[#6B7785] mb-1">Shop Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 mb-4"
          >
            <option value="general_store">General Store</option>
            <option value="bakery">Bakery</option>
            <option value="pharmacy">Pharmacy</option>
          </select>

          <button
            type="submit"
            disabled={createShop.isPending}
            className="bg-[#2F6F4E] text-white rounded px-4 py-2 font-medium disabled:opacity-50"
          >
            {createShop.isPending ? 'Creating...' : 'Create Shop'}
          </button>
        </form>

        {isLoading ? (
          <p className="text-[#6B7785]">Loading shops...</p>
        ) : shops && shops.length > 0 ? (
          <div className="space-y-2">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                to={`/shops/${shop.id}`}
                className="block bg-white p-4 rounded border border-gray-200 hover:border-[#2F6F4E]"
              >
                <p className="font-medium text-[#1F2D3D]">{shop.name}</p>
                <p className="text-sm text-[#6B7785] capitalize">{shop.type.replace('_', ' ')}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-[#6B7785]">No shops yet — create your first one above.</p>
        )}
      </div>
    </div>
  )
}