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

type EntryForm = z.infer<typeof entrySchema>

export default function ShopDetail() {
  const { id: shopId } = useParams()
  const { user, signOut } = useAuth()
  const queryClient = useQueryClient()

  const { data: shop } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: async () => {
      const { data, error } = await supabase.from('shops').select('*').eq('id', shopId).single()
      if (error) throw error
      return data
    },
  })

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
    onSuccess: () => {
      reset({ entry_date: new Date().toISOString().split('T')[0] })
      queryClient.invalidateQueries({ queryKey: ['daily_entries', shopId] })
    },
  })

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

      <Link to="/shops" className="text-sm text-[#2F6F4E] mb-4 inline-block">
        ← Back to Shops
      </Link>

      <h2 className="text-xl font-bold text-[#1F2D3D] mb-6">{shop?.name ?? 'Loading...'}</h2>

      <form
        onSubmit={handleSubmit((data) => saveEntry.mutate(data))}
        className="bg-white p-6 rounded border border-gray-200 max-w-md"
      >
        <h3 className="font-medium text-[#1F2D3D] mb-4">Log Today's Sales</h3>

        {saveEntry.isError && (
          <p className="text-sm text-[#B5482A] bg-red-50 border border-red-200 rounded p-2 mb-4">
            {(saveEntry.error as Error).message}
          </p>
        )}
        {saveEntry.isSuccess && (
          <p className="text-sm text-[#2F6F4E] bg-green-50 border border-green-200 rounded p-2 mb-4">
            Saved successfully.
          </p>
        )}

        <label className="block text-sm text-[#6B7785] mb-1">Date</label>
        <input type="date" {...register('entry_date')} className="w-full border border-gray-300 rounded p-2 mb-1" />
        {errors.entry_date && <p className="text-xs text-[#B5482A] mb-3">{errors.entry_date.message}</p>}

        <label className="block text-sm text-[#6B7785] mb-1 mt-3">Cash Received</label>
        <input
          type="number"
          step="0.01"
          {...register('cash_amount')}
          className="w-full border border-gray-300 rounded p-2 mb-1"
        />
        {errors.cash_amount && <p className="text-xs text-[#B5482A] mb-3">{errors.cash_amount.message}</p>}

        <label className="block text-sm text-[#6B7785] mb-1 mt-3">Online Received</label>
        <input
          type="number"
          step="0.01"
          {...register('online_amount')}
          className="w-full border border-gray-300 rounded p-2 mb-1"
        />
        {errors.online_amount && <p className="text-xs text-[#B5482A] mb-3">{errors.online_amount.message}</p>}

        <label className="block text-sm text-[#6B7785] mb-1 mt-3">
          Total Sale Value <span className="text-[#6B7785]">(optional, for credit/udhaar)</span>
        </label>
        <input
          type="number"
          step="0.01"
          {...register('total_sale_amount')}
          className="w-full border border-gray-300 rounded p-2 mb-1"
        />
        {errors.total_sale_amount && (
          <p className="text-xs text-[#B5482A] mb-3">{errors.total_sale_amount.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#2F6F4E] text-white rounded p-2 font-medium disabled:opacity-50 mt-4"
        >
          {isSubmitting ? 'Saving...' : 'Save Entry'}
        </button>
      </form>
    </div>
  )
}