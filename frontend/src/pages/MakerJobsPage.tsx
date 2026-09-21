import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

interface MakerJob {
  id: number
  projectId: number
  projectTitle: string
  recipeTitle: string
  status: string
  partsCost: number
  laborCost: number
  shippingCost: number
  totalCost: number
  partsStatus: string
  createdAt: string
}

const statusLabel: Record<string, string> = {
  Pending: 'در انتظار تأیید',
  Accepted: 'پذیرفته شده',
  PartsOrdered: 'قطعات سفارش داده شده',
  PartsReceived: 'قطعات دریافت شده',
  Building: 'در حال ساخت',
  Testing: 'در حال تست',
  Ready: 'آماده ارسال',
  Shipped: 'ارسال شده',
  Delivered: 'تحویل شده',
}

const statusTone: Record<string, string> = {
  Pending: 'bg-ink-100 text-ink-700',
  Accepted: 'bg-sky-100 text-sky-700',
  PartsOrdered: 'bg-amber-100 text-amber-700',
  PartsReceived: 'bg-teal-100 text-teal-700',
  Building: 'bg-purple-100 text-purple-700',
  Testing: 'bg-indigo-100 text-indigo-700',
  Ready: 'bg-green-100 text-green-700',
  Shipped: 'bg-blue-100 text-blue-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
}

const partsStatusLabel: Record<string, string> = {
  NotOrdered: 'هنوز سفارش داده نشده',
  Ordered: 'سفارش داده شده',
  Shipped: 'در حال ارسال',
  Received: 'دریافت شده',
}

function formatPrice(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('fa-IR').format(n) + ' تومان'
}

export default function MakerJobsPage() {
  const [jobs, setJobs] = useState<MakerJob[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    // در MVP، داده‌های ساختگی
    setTimeout(() => {
      setJobs([
        {
          id: 1, projectId: 1, projectTitle: 'چراغ رومیزی LED', recipeTitle: 'چراغ رومیزی LED با کنترل روشنایی',
          status: 'Building', partsCost: 180000, laborCost: 150000, shippingCost: 35000, totalCost: 365000,
          partsStatus: 'Received', createdAt: new Date().toISOString(),
        },
        {
          id: 2, projectId: 2, projectTitle: 'پاور بانک ۱۰۰۰۰', recipeTitle: 'پاور بانک USB با ظرفیت بالا',
          status: 'Delivered', partsCost: 320000, laborCost: 200000, shippingCost: 45000, totalCost: 565000,
          partsStatus: 'Received', createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const filtered = statusFilter ? jobs.filter(j => j.status === statusFilter) : jobs

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-ink-900">🔨 کارهای من</h1>
        <span className="rounded-full bg-ink-100 px-3 py-1 text-sm font-bold text-ink-600">{jobs.length} کار</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['', 'Pending', 'Accepted', 'Building', 'Ready', 'Delivered'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              statusFilter === s
                ? 'bg-brand-600 text-white'
                : 'border border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:bg-brand-50'
            }`}
          >
            {s ? statusLabel[s] : 'همه'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-ink-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white py-16 text-center text-ink-400">
          <span className="text-4xl">🔨</span>
          <p className="mt-3 text-sm font-bold">کاری یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((j) => (
            <div key={j.id} className="rounded-xl border border-ink-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink-900">{j.projectTitle}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[j.status] ?? 'bg-ink-100 text-ink-700'}`}>
                      {statusLabel[j.status] ?? j.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-400">{j.recipeTitle}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-500">
                    <span>🔧 قطعات: {formatPrice(j.partsCost)}</span>
                    <span>👷 دستمزد: {formatPrice(j.laborCost)}</span>
                    <span>🚚 ارسال: {formatPrice(j.shippingCost)}</span>
                  </div>
                  <div className="mt-1 text-xs text-ink-400">
                    وضعیت قطعات: <span className="font-semibold text-ink-600">{partsStatusLabel[j.partsStatus] ?? j.partsStatus}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black text-brand-700">{formatPrice(j.totalCost)}</span>
                  <div className="flex gap-2">
                    {j.status === 'Pending' && (
                      <button type="button" className="rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700">
                        ✅ پذیرش
                      </button>
                    )}
                    {j.status === 'Building' && (
                      <button type="button" className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700">
                        🔨 تکمیل ساخت
                      </button>
                    )}
                    {j.status === 'Ready' && (
                      <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
                        🚚 ارسال
                      </button>
                    )}
                    <Link to={`/projects/${j.projectId}`} className="rounded-lg border border-ink-200 px-4 py-2 text-xs font-semibold text-ink-600 hover:bg-ink-50">
                      جزئیات
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
