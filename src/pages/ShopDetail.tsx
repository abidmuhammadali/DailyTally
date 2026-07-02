// src/pages/ShopDetail.tsx
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const entrySchema = z.object({
  entry_date: z
    .string()
    .min(1, 'Date is required')
    .refine((d) => new Date(d) <= new Date(), 'Date cannot be in the future'),
  cash_amount: z.coerce.number().min(0, 'Cash amount cannot be negative'),
  online_amount: z.coerce.number().min(0, 'Online amount cannot be negative'),
  total_sale_amount: z.coerce
    .number()
    .min(0, 'Total sale amount cannot be negative')
    .optional()
    .or(z.literal('')),
})
type EntryForm = z.input<typeof entrySchema>

function currentMonthStart() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

const dayFilters = [
  { label: 'Last 5 days', value: 5 },
  { label: 'Last 10 days', value: 10 },
  { label: 'Last 15 days', value: 15 },
  { label: 'All time', value: 0 },
]

export default function ShopDetail() {
  const { id: shopId } = useParams()
  const { user, signOut } = useAuth()
  const queryClient = useQueryClient()
  const [historyFilter, setHistoryFilter] = useState(10)

  const { data: shop } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: async () => {
      const { data, error } = await supabase.from('shops').select('*').eq('id', shopId).single()
      if (error) throw error
      return data
    },
  })

  const { data: summary } = useQuery({
    queryKey: ['monthly_summary', shopId, currentMonthStart()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_summaries')
        .select('*')
        .eq('shop_id', shopId)
        .eq('month', currentMonthStart())
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const { data: history } = useQuery({
    queryKey: ['daily_entries_history', shopId, historyFilter],
    queryFn: async () => {
      let query = supabase
        .from('daily_entries')
        .select('*')
        .eq('shop_id', shopId)
        .order('entry_date', { ascending: false })

      if (historyFilter > 0) {
        query = query.gte('entry_date', daysAgo(historyFilter))
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

  const recalcSummary = async () => {
    await supabase.functions.invoke('recalc-summary', {
      body: { shop_id: shopId, month: currentMonthStart() },
    })
    queryClient.invalidateQueries({ queryKey: ['monthly_summary', shopId, currentMonthStart()] })
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntryForm>({
    resolver: zodResolver(entrySchema),
    defaultValues: { entry_date: new Date().toISOString().split('T')[0] },
  })

  const saveEntry = useMutation({
    mutationFn: async (formData: EntryForm) => {
      const { error } = await supabase.from('daily_entries').upsert(
        {
          shop_id: shopId,
          entry_date: formData.entry_date,
          cash_amount: formData.cash_amount,
          online_amount: formData.online_amount,
          total_sale_amount: formData.total_sale_amount || null,
        },
        { onConflict: 'shop_id,entry_date' }
      )
      if (error) throw error
    },
    onSuccess: async () => {
      reset({ entry_date: new Date().toISOString().split('T')[0] })
      queryClient.invalidateQueries({ queryKey: ['daily_entries_history', shopId] })
      await recalcSummary()
    },
  })

  // NEW: Delete Daily Entry Mutation 
  const deleteEntry = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.from('daily_entries').delete().eq('id', entryId)
      if (error) throw error
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['daily_entries_history', shopId] })
      await recalcSummary()
    },
  })

  return (
    <div className="min-h-screen bg-[#C9974C] p-6 md:p-10 font-inter">
      
      {/* HEADER NAVIGATION BAR */}
      <header 
        style={{ boxShadow: '4px 4px 0px 0px #1F2D3D' }} 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-[#FFF8E7] border-2 border-[#1F2D3D] rounded-xl p-4"
      >
        {/* FIXED: Added cursor-pointer */}
        <Link to="/dashboard" className="group flex items-center gap-2 cursor-pointer">
          <h1 className="text-2xl font-cabinet font-bold text-[#1F2D3D] tracking-wide transition-colors group-hover:text-[#2F6F4E]">
            DailyTally
          </h1>
          <span className="text-xs font-bold text-white bg-[#1F2D3D] px-2 py-0.5 rounded uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
            Dashboard ↗
          </span>
        </Link>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-sm font-bold text-[#1F2D3D] break-all">{user?.email}</span>
          {/* FIXED: Added cursor-pointer */}
          <button 
            onClick={signOut} 
            style={{ boxShadow: '2px 2px 0px 0px #1F2D3D' }}
            className="bg-[#B5482A] text-white border-2 border-[#1F2D3D] font-bold text-xs uppercase tracking-wider rounded-lg px-4 py-2 cursor-pointer transition-colors hover:bg-[#9E3E24]"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* SUB-HEADER ACTIONS */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* FIXED: Added cursor-pointer */}
          <Link to="/shops" className="text-sm font-bold text-[#1F2D3D] hover:underline inline-flex items-center gap-1 mb-2 cursor-pointer">
            ← Back to Shops
          </Link>
          <h2 className="text-2xl font-cabinet font-bold text-[#1F2D3D]">{shop?.name ?? 'Loading...'}</h2>
        </div>

        {/* TAB NAVIGATION SELECTORS */}
        <div style={{ boxShadow: '3px 3px 0px 0px #1F2D3D' }} className="inline-flex bg-[#FFF8E7] border-2 border-[#1F2D3D] rounded-xl overflow-hidden self-start">
          <span className="px-4 py-2 font-cabinet font-bold text-sm bg-[#1F2D3D] text-white">Daily Sales</span>
          {/* FIXED: Added cursor-pointer */}
          <Link to={`/shops/${shopId}/expenses`} className="px-4 py-2 font-cabinet font-bold text-sm text-[#6B7785] bg-[#FFF8E7] border-l-2 border-[#1F2D3D] hover:bg-[#E2DCD0] cursor-pointer">
            Expenses
          </Link>
        </div>
      </div>

      {/* MONTHLY SUMMARY CARD */}
      {summary && (
        <div style={{ boxShadow: '5px 5px 0px 0px #1F2D3D' }} className="bg-[#FFF8E7] border-2 border-[#1F2D3D] rounded-xl p-5 mb-8 max-w-md">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7785] mb-1">This month's profit</p>
          <p className="text-2xl font-bold text-[#2F6F4E]">Rs. {Number(summary.profit).toLocaleString()}</p>
          <p className="text-xs font-bold text-[#1F2D3D] opacity-80 mt-2 border-t border-[#E2DCD0] pt-2">
            Revenue: Rs. {Number(summary.total_revenue).toLocaleString()} — Expenses: Rs. {Number(summary.total_expenses).toLocaleString()}
          </p>
        </div>
      )}

      {/* TWO COLUMN INTERACTIVE BODY */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LOG FORM CONTAINER */}
        <form
          onSubmit={handleSubmit((data) => saveEntry.mutate(data))}
          style={{ boxShadow: '5px 5px 0px 0px #1F2D3D' }}
          className="bg-[#FFF8E7] p-6 rounded-xl border-2 border-[#1F2D3D] max-w-md w-full space-y-4"
        >
          <h3 className="font-cabinet font-bold text-lg text-[#1F2D3D] uppercase tracking-wide border-b-2 border-[#1F2D3D] pb-2">
            Log Today's Sales
          </h3>

          {saveEntry.isError && (
            <p className="text-sm font-bold text-[#B5482A] bg-red-50 border-2 border-[#B5482A] rounded-lg p-2.5">
              {(saveEntry.error as Error).message}
            </p>
          )}
          {saveEntry.isSuccess && (
            <p className="text-sm font-bold text-[#2F6F4E] bg-green-50 border-2 border-[#2F6F4E] rounded-lg p-2.5">
              Saved successfully.
            </p>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1F2D3D] uppercase mb-1">Date</label>
            <input type="date" {...register('entry_date')} className="w-full bg-white border-2 border-[#1F2D3D] rounded-lg p-2.5 font-bold text-sm text-[#1F2D3D] focus:outline-none" />
            {errors.entry_date && <p className="text-xs font-bold text-[#B5482A] mt-1">{errors.entry_date.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2D3D] uppercase mb-1">Cash Received (Rs.)</label>
            <input
              type="number"
              step="0.01"
              {...register('cash_amount')}
              className="w-full bg-white border-2 border-[#1F2D3D] rounded-lg p-2.5 font-bold text-sm text-[#1F2D3D] focus:outline-none"
            />
            {errors.cash_amount && <p className="text-xs font-bold text-[#B5482A] mt-1">{errors.cash_amount.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2D3D] uppercase mb-1">Online Received (Rs.)</label>
            <input
              type="number"
              step="0.01"
              {...register('online_amount')}
              className="w-full bg-white border-2 border-[#1F2D3D] rounded-lg p-2.5 font-bold text-sm text-[#1F2D3D] focus:outline-none"
            />
            {errors.online_amount && <p className="text-xs font-bold text-[#B5482A] mt-1">{errors.online_amount.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2D3D] uppercase mb-1">
              Total Sale Value <span className="text-xs text-[#6B7785] lowercase">(optional, for udhaar)</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('total_sale_amount')}
              className="w-full bg-white border-2 border-[#1F2D3D] rounded-lg p-2.5 font-bold text-sm text-[#1F2D3D] focus:outline-none"
            />
            {errors.total_sale_amount && (
              <p className="text-xs font-bold text-[#B5482A] mt-1">{errors.total_sale_amount.message}</p>
            )}
          </div>

          {/* FIXED: Added cursor-pointer */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ boxShadow: '3px 3px 0px 0px #1F2D3D' }}
            className="w-full bg-[#2F6F4E] hover:bg-[#25573D] text-white font-cabinet font-bold py-3 rounded-lg border-2 border-[#1F2D3D] disabled:opacity-50 mt-4 transition-transform active:translate-y-0.5 cursor-pointer"
          >
            {isSubmitting ? 'Saving...' : 'Save Entry'}
          </button>
        </form>

        {/* HISTORY LIST CONTAINER */}
        <div 
          style={{ boxShadow: '5px 5px 0px 0px #1F2D3D' }} 
          className="bg-[#FFF8E7] p-6 rounded-xl border-2 border-[#1F2D3D] flex-1 w-full"
        >
          <div className="flex items-center justify-between border-b-2 border-[#1F2D3D] pb-3 mb-4">
            <h3 className="font-cabinet font-bold text-lg text-[#1F2D3D] uppercase tracking-wide">Sales History</h3>
            {/* FIXED: Added cursor-pointer */}
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(Number(e.target.value))}
              className="bg-white border-2 border-[#1F2D3D] rounded-lg p-1.5 font-bold text-xs text-[#1F2D3D] focus:outline-none cursor-pointer"
            >
              {dayFilters.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {!history || history.length === 0 ? (
            <p className="text-sm font-bold text-[#6B7785] py-4 text-center">No entries recorded in this range.</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {history.map((e) => (
                <div key={e.id} className="bg-white border-2 border-[#1F2D3D] rounded-lg p-3 shadow-[2px_2px_0px_0px_#1F2D3D] flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[#1F2D3D]">
                        {new Date(e.entry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#6B7785]">
                      Cash: <span className="text-[#1F2D3D] font-bold">Rs. {Number(e.cash_amount).toLocaleString()}</span> — Online: <span className="text-[#1F2D3D] font-bold">Rs. {Number(e.online_amount).toLocaleString()}</span>
                      {e.total_sale_amount && (
                        <> — Credit total: <span className="text-[#B5482A] font-bold">Rs. {Number(e.total_sale_amount).toLocaleString()}</span></>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[#2F6F4E] font-bold text-base">
                      Rs. {(Number(e.cash_amount) + Number(e.online_amount)).toLocaleString()}
                    </span>

                    {/* NEW: Inline Delete Entry Button Controls */}
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to completely delete this sales entry record?')) {
                          deleteEntry.mutate(e.id)
                        }
                      }}
                      className="text-[#6B7785] hover:text-[#B5482A] p-1.5 rounded transition-colors cursor-pointer"
                      title="Delete Entry"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}