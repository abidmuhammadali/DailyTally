import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type Shop = {
  id: string
  name: string
  type: string
}

function currentMonthStart() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [selectedShopId, setSelectedShopId] = useState<string>('')

  const { data: shops } = useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shops').select('id, name, type').order('created_at')
      if (error) throw error
      return data as Shop[]
    },
  })

  const activeShopId = selectedShopId || shops?.[0]?.id || ''

  const { data: entries } = useQuery({
    queryKey: ['daily_entries', activeShopId, currentMonthStart()],
    enabled: !!activeShopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('entry_date, cash_amount, online_amount')
        .eq('shop_id', activeShopId)
        .gte('entry_date', currentMonthStart())
        .order('entry_date')
      if (error) throw error
      return data
    },
  })

  const { data: summary } = useQuery({
    queryKey: ['monthly_summary', activeShopId, currentMonthStart()],
    enabled: !!activeShopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_summaries')
        .select('*')
        .eq('shop_id', activeShopId)
        .eq('month', currentMonthStart())
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const { data: monthlyHistory } = useQuery({
    queryKey: ['monthly_history', activeShopId],
    enabled: !!activeShopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_summaries')
        .select('month, profit')
        .eq('shop_id', activeShopId)
        .order('month')
      if (error) throw error
      return data
    },
  })

  const bestDay = entries?.length
    ? entries.reduce((best, e) => {
        const total = Number(e.cash_amount) + Number(e.online_amount)
        const bestTotal = Number(best.cash_amount) + Number(best.online_amount)
        return total > bestTotal ? e : best
      })
    : null

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

      <div className="flex items-center justify-between mb-6">
        <Link to="/shops" className="inline-block bg-[#2F6F4E] text-white rounded px-4 py-2 font-medium">
          Manage Shops
        </Link>

        {shops && shops.length > 0 && (
          <div>
            <label className="text-sm text-[#6B7785] mr-2">Showing insights for:</label>
            <select
              value={activeShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="border border-gray-300 rounded p-2"
            >
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!shops || shops.length === 0 ? (
        <p className="text-[#6B7785]">
          You don't have any shops yet.{' '}
          <Link to="/shops" className="text-[#2F6F4E] underline">
            Create one to see insights.
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded p-4">
            <p className="text-sm text-[#6B7785] mb-1">This month's revenue</p>
            <p className="text-2xl font-bold text-[#1F2D3D]">
              Rs. {Number(summary?.total_revenue ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <p className="text-sm text-[#6B7785] mb-1">This month's expenses</p>
            <p className="text-2xl font-bold text-[#1F2D3D]">
              Rs. {Number(summary?.total_expenses ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <p className="text-sm text-[#6B7785] mb-1">This month's profit</p>
            <p className="text-2xl font-bold text-[#2F6F4E]">
              Rs. {Number(summary?.profit ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {bestDay && (
        <div className="bg-white border border-gray-200 rounded p-4 mb-8 max-w-md">
          <p className="text-sm text-[#6B7785] mb-1">Best-selling day this month</p>
          <p className="text-lg font-bold text-[#1F2D3D]">
            {new Date(bestDay.entry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
          </p>
          <p className="text-sm text-[#6B7785]">
            Rs. {(Number(bestDay.cash_amount) + Number(bestDay.online_amount)).toLocaleString()} collected
          </p>
        </div>
      )}

      {entries && entries.length > 0 && (
        <div className="bg-white border border-gray-200 rounded p-4 mb-8">
          <p className="text-sm text-[#6B7785] mb-4">Daily sales this month</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={entries.map((e) => ({
                day: new Date(e.entry_date).getDate(),
                total: Number(e.cash_amount) + Number(e.online_amount),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value: number) => `Rs. ${value.toLocaleString()}`} />
              <Bar dataKey="total" fill="#2F6F4E" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {monthlyHistory && monthlyHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded p-4 mb-8">
          <p className="text-sm text-[#6B7785] mb-4">Monthly profit trend</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={monthlyHistory.map((m) => ({
                month: new Date(m.month).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
                profit: Number(m.profit),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `Rs. ${value.toLocaleString()}`} />
              <Line type="monotone" dataKey="profit" stroke="#2F6F4E" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}