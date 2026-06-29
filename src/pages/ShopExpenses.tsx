// src/pages/ShopExpenses.tsx
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const expenseSchema = z.object({
  expense_date: z
    .string()
    .min(1, 'Date is required')
    .refine((d) => new Date(d) <= new Date(), 'Date cannot be in the future'),
  category: z.enum(['rent', 'bills', 'salary', 'restocking', 'other']),
  amount: z.coerce.number().min(0, 'Amount cannot be negative'),
  note: z.string().optional(),
})
type ExpenseForm = z.input<typeof expenseSchema>

function currentMonthStart() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

// Fixed minor date boundary offset issue
function monthsAgo(n: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(1)
  return d.toISOString().split('T')[0]
}

const rangeFilters = [
  { label: 'This month', value: 1 },
  { label: 'Last 3 months', value: 3 },
  { label: 'All time', value: 0 },
]

const categoryLabels: Record<string, string> = {
  rent: 'Rent',
  bills: 'Bills',
  salary: 'Salary',
  restocking: 'Restocking',
  other: 'Miscellaneous',
}

export default function ShopExpenses() {
  const { id: shopId } = useParams()
  const { user, signOut } = useAuth()
  const queryClient = useQueryClient()
  const [rangeFilter, setRangeFilter] = useState(3)

  const { data: shop } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: async () => {
      const { data, error } = await supabase.from('shops').select('*').eq('id', shopId).single()
      if (error) throw error
      return data
    },
  })

  const { data: history } = useQuery({
    queryKey: ['expenses_history', shopId, rangeFilter],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('shop_id', shopId)
        .order('expense_date', { ascending: false })

      if (rangeFilter > 0) {
        query = query.gte('expense_date', monthsAgo(rangeFilter))
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
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { expense_date: new Date().toISOString().split('T')[0], category: 'rent' },
  })

  const saveExpense = useMutation({
    mutationFn: async (formData: ExpenseForm) => {
      const { error } = await supabase.from('expenses').insert({
        shop_id: shopId,
        expense_date: formData.expense_date,
        category: formData.category,
        amount: formData.amount,
        note: formData.note || null,
      })
      if (error) throw error
    },
    onSuccess: async () => {
      reset({ expense_date: new Date().toISOString().split('T')[0], category: 'rent' })
      queryClient.invalidateQueries({ queryKey: ['expenses_history', shopId] })
      await recalcSummary()
    },
  })

  const totalInRange = history?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0

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

      {/* SUB-HEADER NAVIGATION */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/shops" className="text-sm font-bold text-[#1F2D3D] hover:underline inline-flex items-center gap-1 mb-2">
            ← Back to Shops
          </Link>
          <h2 className="text-2xl font-cabinet font-bold text-[#1F2D3D]">{shop?.name ?? 'Loading...'}</h2>
        </div>

        {/* BRUTALIST TAB CONTROLS */}
        <div style={{ boxShadow: '3px 3px 0px 0px #1F2D3D' }} className="inline-flex bg-[#FFF8E7] border-2 border-[#1F2D3D] rounded-xl overflow-hidden self-start">
          <Link to={`/shops/${shopId}`} className="px-4 py-2 font-cabinet font-bold text-sm text-[#6B7785] bg-[#FFF8E7] hover:bg-[#E2DCD0]">
            Daily Sales
          </Link>
          <span className="px-4 py-2 font-cabinet font-bold text-sm bg-[#1F2D3D] text-white border-l-2 border-[#1F2D3D]">
            Expenses
          </span>
        </div>
      </div>

      {/* TWO COLUMN CONTENT WORKING SPLIT */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* EXPENSE LOG FORM */}
        <form
          onSubmit={handleSubmit((data) => saveExpense.mutate(data))}
          style={{ boxShadow: '5px 5px 0px 0px #1F2D3D' }}
          className="bg-[#FFF8E7] p-6 rounded-xl border-2 border-[#1F2D3D] max-w-md w-full space-y-4"
        >
          <h3 className="font-cabinet font-bold text-lg text-[#1F2D3D] uppercase tracking-wide border-b-2 border-[#1F2D3D] pb-2">
            Log an Expense
          </h3>

          {saveExpense.isError && (
            <p className="text-sm font-bold text-[#B5482A] bg-red-50 border-2 border-[#B5482A] rounded-lg p-2.5">
              {(saveExpense.error as Error).message}
            </p>
          )}
          {saveExpense.isSuccess && (
            <p className="text-sm font-bold text-[#2F6F4E] bg-green-50 border-2 border-[#2F6F4E] rounded-lg p-2.5">
              Saved successfully.
            </p>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1F2D3D] uppercase mb-1">Date</label>
            <input 
              type="date" 
              {...register('expense_date')} 
              className="w-full bg-white border-2 border-[#1F2D3D] rounded-lg p-2.5 font-bold text-sm text-[#1F2D3D] focus:outline-none" 
            />
            {errors.expense_date && <p className="text-xs font-bold text-[#B5482A] mt-1">{errors.expense_date.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2D3D] uppercase mb-1">Category</label>
            <div className="relative">
              <select 
                {...register('category')} 
                className="w-full bg-white border-2 border-[#1F2D3D] rounded-lg p-2.5 font-bold text-sm text-[#1F2D3D] focus:outline-none appearance-none"
              >
                <option value="rent">Rent</option>
                <option value="bills">Bills</option>
                <option value="salary">Salary</option>
                <option value="restocking">Restocking</option>
                <option value="other">Miscellaneous</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2D3D] uppercase mb-1">Amount (Rs.)</label>
            <input
              type="number"
              step="0.01"
              {...register('amount')}
              className="w-full bg-white border-2 border-[#1F2D3D] rounded-lg p-2.5 font-bold text-sm text-[#1F2D3D] focus:outline-none"
            />
            {errors.amount && <p className="text-xs font-bold text-[#B5482A] mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2D3D] uppercase mb-1">
              Note <span className="text-xs text-[#6B7785] lowercase">(optional)</span>
            </label>
            <input 
              type="text" 
              {...register('note')} 
              placeholder="e.g. Electricity bill Jan"
              className="w-full bg-white border-2 border-[#1F2D3D] rounded-lg p-2.5 font-bold text-sm text-[#1F2D3D] focus:outline-none" 
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ boxShadow: '3px 3px 0px 0px #C9974C' }}
            className="w-full bg-[#2F6F4E] text-white font-cabinet font-bold py-3 rounded-lg border-2 border-[#1F2D3D] disabled:opacity-50 mt-4 transition-transform active:translate-y-0.5"
          >
            {isSubmitting ? 'Saving...' : 'Save Expense'}
          </button>
        </form>

        {/* EXPENSE HISTORY LEDGER */}
        <div 
          style={{ boxShadow: '5px 5px 0px 0px #1F2D3D' }} 
          className="bg-[#FFF8E7] p-6 rounded-xl border-2 border-[#1F2D3D] flex-1 w-full"
        >
          <div className="flex items-center justify-between border-b-2 border-[#1F2D3D] pb-2 mb-2">
            <h3 className="font-cabinet font-bold text-lg text-[#1F2D3D] uppercase tracking-wide">Expense History</h3>
            <select
              value={rangeFilter}
              onChange={(e) => setRangeFilter(Number(e.target.value))}
              className="bg-white border-2 border-[#1F2D3D] rounded-lg p-1.5 font-bold text-xs text-[#1F2D3D] focus:outline-none"
            >
              {rangeFilters.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7785] mb-4">
            Total outflux in range: <span className="text-[#B5482A] font-extrabold text-sm ml-1">Rs. {totalInRange.toLocaleString()}</span>
          </p>

          {!history || history.length === 0 ? (
            <p className="text-sm font-bold text-[#6B7785] py-4 text-center">No expenses documented in this timeframe.</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {history.map((e) => (
                <div key={e.id} className="bg-white border-2 border-[#1F2D3D] rounded-lg p-3 shadow-[2px_2px_0px_0px_#1F2D3D]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-cabinet font-bold text-[#1F2D3D] text-base">
                      {categoryLabels[e.category] ?? e.category}
                    </span>
                    <span className="text-[#B5482A] font-bold text-base">
                      Rs. {Number(e.amount).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#6B7785]">
                    {new Date(e.expense_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {e.note && <span className="text-[#1F2D3D] font-bold"> — {e.note}</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}