// src/pages/Shops.tsx
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
    <div className="min-h-screen bg-[#C9974C] p-6 md:p-10 font-inter">
      
      {/* HEADER NAVIGATION BAR */}
      <header 
        style={{ boxShadow: '4px 4px 0px 0px #1F2D3D' }} 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-[#FFF8E7] border-2 border-[#1F2D3D] rounded-xl p-4"
      >
        {/* INTERACTIVE LINK TO DASHBOARD */}
        <Link to="/dashboard" className="group flex items-center gap-2">
          <h1 className="text-2xl font-cabinet font-bold text-[#1F2D3D] tracking-wide transition-colors group-hover:text-[#2F6F4E]">
            DailyTally
          </h1>
          <span className="text-xs font-bold text-white bg-[#1F2D3D] px-2 py-0.5 rounded uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
            Dashboard ↗
          </span>
        </Link>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-sm font-bold text-[#1F2D3D] break-all">{user?.email}</span>
          <button 
            onClick={signOut} 
            style={{ boxShadow: '2px 2px 0px 0px #1F2D3D' }}
            className="bg-[#B5482A] text-white border-2 border-[#1F2D3D] font-bold text-xs uppercase tracking-wider rounded-lg px-4 py-2"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* TWO-COLUMN BRUTALIST GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* CREATE NEW SHOP FORM */}
        <div 
          style={{ boxShadow: '6px 6px 0px 0px #1F2D3D' }} 
          className="bg-[#FFF8E7] p-6 rounded-xl border-2 border-[#1F2D3D]"
        >
          <h2 className="text-xl font-cabinet font-bold text-[#1F2D3D] mb-4 uppercase tracking-wide border-b-2 border-[#1F2D3D] pb-2">
            Create New Shop
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm font-bold text-[#B5482A] bg-red-50 border-2 border-[#B5482A] rounded-lg p-2.5">
                {error}
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-[#1F2D3D] uppercase mb-1">Shop Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border-2 border-[#1F2D3D] rounded-lg p-2.5 font-bold text-sm text-[#1F2D3D] focus:outline-none"
                placeholder="e.g. Ali General Store"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2D3D] uppercase mb-1">Shop Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-white border-2 border-[#1F2D3D] rounded-lg p-2.5 font-bold text-sm text-[#1F2D3D] focus:outline-none appearance-none"
              >
                <option value="general_store">General Store</option>
                <option value="bakery">Bakery</option>
                <option value="pharmacy">Pharmacy</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={createShop.isPending}
              style={{ boxShadow: '3px 3px 0px 0px #C9974C' }}
              className="w-full bg-[#1F2D3D] text-white font-cabinet font-bold py-3 rounded-lg border-2 border-[#1F2D3D] disabled:opacity-50 mt-2 transition-transform active:translate-y-0.5"
            >
              {createShop.isPending ? 'Creating...' : 'Create Shop'}
            </button>
          </form>
        </div>

        {/* EXISTING SHOPS LIST */}
        <div 
          style={{ boxShadow: '6px 6px 0px 0px #1F2D3D' }} 
          className="bg-[#FFF8E7] p-6 rounded-xl border-2 border-[#1F2D3D]"
        >
          <h2 className="text-xl font-cabinet font-bold text-[#1F2D3D] mb-4 uppercase tracking-wide border-b-2 border-[#1F2D3D] pb-2">
            Your Existing Shops
          </h2>

          {isLoading ? (
            <p className="text-sm font-bold text-[#6B7785] py-4 text-center animate-pulse">Loading shops...</p>
          ) : shops && shops.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {shops.map((shop) => (
                <Link
                  key={shop.id}
                  to={`/shops/${shop.id}`}
                  className="block bg-white border-2 border-[#1F2D3D] rounded-lg p-4 shadow-[3px_3px_0px_0px_#1F2D3D] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#1F2D3D] transition-all"
                >
                  <p className="font-cabinet font-bold text-base text-[#1F2D3D]">{shop.name}</p>
                  <span className="inline-block text-[11px] font-bold tracking-wider text-[#6B7785] uppercase bg-[#E2DCD0] px-2 py-0.5 rounded mt-1.5 capitalize">
                    🏷️ {shop.type.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm font-bold text-[#6B7785] py-4 text-center">
              No shops found. Create one using the side panel!
            </p>
          )}
        </div>

      </div>
    </div>
  )
}