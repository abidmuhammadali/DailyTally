import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { forecastProfit } from '../lib/forecast'
import logo from '../assets/logo.png'

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

  const isNegativeProfit = Number(summary?.profit ?? 0) < 0

  const bestDay = entries?.length
    ? entries.reduce((best, e) => {
        const total = Number(e.cash_amount) + Number(e.online_amount)
        const bestTotal = Number(best.cash_amount) + Number(best.online_amount)
        return total > bestTotal ? e : best
      })
    : null

  const historyArray = monthlyHistory ?? []
  const profitNumbers = historyArray.map((m) => Number(m.profit)) ?? []
  
  // Send metrics to your forecast engine
  const forecasted = forecastProfit(profitNumbers, 3)

  // Build sequential data map for Recharts
  const profitChartData = [
    ...historyArray.map((m, idx) => ({
      month: new Date(m.month).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      actual: Number(m.profit),
      forecast: idx === historyArray.length - 1 ? Number(m.profit) : null,
    })),
    ...forecasted.map((value, i) => {
      const lastHistoryMonthStr = historyArray[historyArray.length - 1]?.month || currentMonthStart()
      const targetDate = new Date(lastHistoryMonthStr)
      
      targetDate.setDate(1)
      targetDate.setMonth(targetDate.getMonth() + (i + 1))

      return {
        month: targetDate.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        actual: null,
        forecast: value,
      }
    }),
  ]

  const brutalShadow = { boxShadow: '5px 5px 0px 0px #1F2D3D' }

  return (
    <div className="min-h-screen bg-[#C9974C] w-full flex flex-col md:flex-row">

      {/* LEFT SIDE PANEL */}
      <div className="w-full md:w-1/3 bg-[#1F2D3D] text-white flex flex-col justify-between p-10 relative overflow-hidden md:sticky md:top-0 md:h-screen">
        <svg className="absolute top-10 right-12 w-14 h-14 opacity-40 rotate-[8deg]" viewBox="0 0 60 60" fill="none" stroke="#C9D3DC" strokeWidth="2.5">
          <line x1="10" y1="10" x2="10" y2="40" /><line x1="20" y1="10" x2="20" y2="40" />
          <line x1="30" y1="10" x2="30" y2="40" /><line x1="40" y1="10" x2="40" y2="40" />
          <line x1="5" y1="35" x2="45" y2="15" />
        </svg>

        <div>
          <h1 className="text-3xl font-bold tracking-wide text-white mb-2">DailyTally</h1>
          <div className="w-12 h-1 bg-[#C9974C] mb-8" />
        </div>

        <div className="flex justify-center my-4">
          <img src={logo} alt="DailyTally Logo" className="w-40 h-40 object-contain" />
        </div>

        <div className="my-auto max-w-xs">
          <h2 className="text-2xl font-bold text-[#C9974C] mb-4">Insights & Analysis</h2>
          <p className="text-[#C9D3DC] text-sm leading-relaxed">
            DailyTally is your essential digital ledger, reimagining old-school record-keeping with modern efficiency.
            Stop guessing. Start tallying. Your digital record, our analog charm.
          </p>
          <p className="text-xs font-bold tracking-widest text-[#C9974C] mt-6">
            #YOURRECORDSSIMPLIFIED
          </p>
        </div>

        <svg className="absolute bottom-8 right-8 w-16 h-16 opacity-30" viewBox="0 0 24 24" fill="#FFF8E7">
          <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
        </svg>
      </div>

      {/* RIGHT SIDE PANEL */}
      <div className="flex-1 bg-[#C9974C] p-6 md:p-10">

        <div style={{ boxShadow: '4px 4px 0px 0px #1F2D3D' }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-[#FFF8E7] border-2 border-[#1F2D3D] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F6F4E] animate-pulse" />
            <span className="text-sm font-bold text-[#1F2D3D] break-all">{user?.email}</span>
          </div>
          <button
            onClick={signOut}
            style={{ boxShadow: '2px 2px 0px 0px #1F2D3D' }}
            className="bg-[#B5482A] text-white border-2 border-[#1F2D3D] font-bold text-xs uppercase tracking-wider rounded-lg px-4 py-2"
          >
            Sign Out
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          <Link
            to="/shops"
            style={{ boxShadow: '4px 4px 0px 0px #1F2D3D' }}
            className="inline-flex justify-center items-center bg-[#2F6F4E] text-white border-2 border-[#1F2D3D] rounded-xl px-6 py-3 font-bold text-sm"
          >
            Manage Shops
          </Link>

          {shops && shops.length > 0 && (
            <div style={{ boxShadow: '4px 4px 0px 0px #1F2D3D' }} className="bg-[#FFF8E7] border-2 border-[#1F2D3D] rounded-xl px-4 py-2 flex items-center gap-3">
              <label className="text-xs font-bold text-[#6B7785] uppercase tracking-wider whitespace-nowrap">Insights for:</label>
              <select
                value={activeShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="bg-white border-2 border-[#1F2D3D] rounded-lg p-1.5 font-bold text-sm text-[#1F2D3D] focus:outline-none"
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
          <div style={{ boxShadow: '6px 6px 0px 0px #1F2D3D' }} className="bg-[#FFF8E7] border-2 border-[#1F2D3D] rounded-xl p-8 text-center">
            <p className="text-lg font-bold text-[#1F2D3D] mb-4">You don't have any shops yet.</p>
            <Link to="/shops" className="text-[#2F6F4E] font-bold underline">
              Create one to start tracking analytics!
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              <div style={brutalShadow} className="bg-[#FFF8E7] border-2 border-[#1F2D3D] rounded-xl p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#6B7785] mb-2">This month's revenue</p>
                <p className="text-2xl font-bold text-[#1F2D3D]">
                  Rs. {Number(summary?.total_revenue ?? 0).toLocaleString()}
                </p>
              </div>

              <div style={brutalShadow} className="bg-[#FFF8E7] border-2 border-[#1F2D3D] rounded-xl p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#6B7785] mb-2">This month's expenses</p>
                <p className="text-2xl font-bold text-[#1F2D3D]">
                  Rs. {Number(summary?.total_expenses ?? 0).toLocaleString()}
                </p>
              </div>

              <div style={brutalShadow} className={`bg-[#FFF8E7] border-2 ${isNegativeProfit ? 'border-[#B5482A]' : 'border-[#1F2D3D]'} rounded-xl p-5`}>
                <p className="text-xs font-bold uppercase tracking-wider text-[#6B7785] mb-2">This month's profit</p>
                <p className={`text-2xl font-bold ${isNegativeProfit ? 'text-[#B5482A]' : 'text-[#2F6F4E]'}`}>
                  Rs. {Number(summary?.profit ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            {bestDay && (
              <div style={brutalShadow} className="bg-[#FFF8E7] border-2 border-[#1F2D3D] rounded-xl p-5 mb-8 max-w-md">
                <p className="text-xs font-bold uppercase tracking-wider text-[#6B7785] mb-2">Best-selling day this month</p>
                <p className="text-xl font-bold text-[#1F2D3D] mb-1">
                  {new Date(bestDay.entry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                </p>
                <p className="text-sm font-medium text-[#2F6F4E]">
                  Rs. {(Number(bestDay.cash_amount) + Number(bestDay.online_amount)).toLocaleString()} collected
                </p>
              </div>
            )}

            {entries && entries.length > 0 && (
              <div style={{ boxShadow: '6px 6px 0px 0px #1F2D3D' }} className="bg-[#FFF8E7] border-2 border-[#1F2D3D] rounded-xl p-6 mb-8">
                <p className="font-bold text-lg text-[#1F2D3D] mb-4 uppercase tracking-wide">Daily sales this month</p>
                <div className="w-full h-[260px] overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={entries.map((e) => ({
                        day: new Date(e.entry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                        total: Number(e.cash_amount) + Number(e.online_amount),
                      }))}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2DCD0" />
                      <XAxis dataKey="day" stroke="#1F2D3D" tick={{ fontStyle: 'bold', fontSize: 11 }} />
                      <YAxis stroke="#1F2D3D" tick={{ fontStyle: 'bold', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#FFF8E7', border: '2px solid #1F2D3D', borderRadius: '8px', fontWeight: 'bold' }}
                        formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, 'Total Revenue']}
                      />
                      <Bar dataKey="total" fill="#1F2D3D" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Line Chart Section */}
            {profitChartData.length > 0 && (
              <div style={{ boxShadow: '6px 6px 0px 0px #1F2D3D' }} className="bg-[#FFF8E7] border-2 border-[#1F2D3D] rounded-xl p-6 mb-8">
                <p className="font-bold text-lg text-[#1F2D3D] mb-4 uppercase tracking-wide">Monthly profit trend</p>
                <div className="w-full h-[260px] overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={profitChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2DCD0" />
                      <XAxis dataKey="month" stroke="#1F2D3D" tick={{ fontStyle: 'bold', fontSize: 11 }} />
                      <YAxis stroke="#1F2D3D" tick={{ fontStyle: 'bold', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#FFF8E7', border: '2px solid #1F2D3D', borderRadius: '8px', fontWeight: 'bold' }}
                        formatter={(value, name) => [
                          `Rs. ${Number(value).toLocaleString()}`,
                          name === 'forecast' ? 'Forecasted Profit' : 'Profit',
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#2F6F4E"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#1F2D3D' }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#2F6F4E"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={{ r: 4, fill: '#C9974C' }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* NEW DISCLAIMER TEXT BLOCK */}
                <div className="mt-4 pt-3 border-t-2 border-dashed border-[#E2DCD0] flex items-start gap-2 text-[#6B7785]">
                  <span className="text-xs font-bold uppercase px-1.5 py-0.5 bg-[#C9974C] text-[#1F2D3D] rounded border border-[#1F2D3D] tracking-wider whitespace-nowrap">
                    Note
                  </span>
                  <p className="text-xs font-semibold leading-relaxed">
                    Dashed lines indicate machine-generated trend projections. Dynamic algorithms weight recent months heavily to match immediate shifts, and forecasting stability scales accurately once a shop builds 6 to 8 months of solid history.
                  </p>
                </div>

              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}