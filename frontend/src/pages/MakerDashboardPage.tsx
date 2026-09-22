import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useUser } from '../lib/UserContext'
import { Ic } from '../lib/icons'

interface MakerStats {
  totalJobs: number
  activeJobs: number
  completedJobs: number
  totalEarnings: number
}

interface MakerJob {
  id: number
  projectId: number
  projectTitle: string
  status: string
  partsCost: number
  laborCost: number
  shippingCost: number
  totalCost: number
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

function formatPrice(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('fa-IR').format(n) + ' تومان'
}

export default function MakerDashboardPage() {
  const { user } = useUser()
  const [stats, setStats] = useState<MakerStats | null>(null)
  const [jobs, setJobs] = useState<MakerJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    // در MVP، از endpoint عمومی استفاده می‌کنیم
    Promise.all([
      api.listOrders({ page: 1 }),
    ])
      .then(() => {
        // ساخت آمار ساختگی از داده‌های موجود
        setStats({
          totalJobs: 3,
          activeJobs: 1,
          completedJobs: 2,
          totalEarnings: 450000,
        })
        setJobs([
          {
            id: 1,
            projectId: 1,
            projectTitle: 'چراغ رومیزی LED',
            status: 'Building',
            partsCost: 180000,
            laborCost: 150000,
            shippingCost: 35000,
            totalCost: 365000,
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            projectId: 2,
            projectTitle: 'پاور بانک ۱۰۰۰۰',
            status: 'Delivered',
            partsCost: 320000,
            laborCost: 200000,
            shippingCost: 45000,
            totalCost: 565000,
            createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          },
        ])
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'خطا'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-ink-100" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-ink-900">
            <Ic name="factory" size={26} />
            داشبورد صنعتگر
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            خوش آمدید، <span className="font-bold text-ink-700">{user.name}</span>
          </p>
        </div>
        <Link to="/maker/services" className="btn-primary px-5 py-2 text-sm">
          + افزودن خدمت
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="stagger grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="card card-hover flex items-center gap-3 p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-600">
              <Ic name="clipboard" size={22} />
            </span>
            <div>
              <div className="text-xl font-black text-ink-900">{new Intl.NumberFormat('fa-IR').format(stats.totalJobs)}</div>
              <div className="text-xs font-semibold text-ink-500">کل کارها</div>
            </div>
          </div>
          <div className="card card-hover flex items-center gap-3 p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
              <Ic name="hammer" size={22} />
            </span>
            <div>
              <div className="text-xl font-black text-ink-900">{new Intl.NumberFormat('fa-IR').format(stats.activeJobs)}</div>
              <div className="text-xs font-semibold text-ink-500">در حال انجام</div>
            </div>
          </div>
          <div className="card card-hover flex items-center gap-3 p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-green-100 text-green-600">
              <Ic name="circleCheck" size={22} />
            </span>
            <div>
              <div className="text-xl font-black text-ink-900">{new Intl.NumberFormat('fa-IR').format(stats.completedJobs)}</div>
              <div className="text-xs font-semibold text-ink-500">تکمیل شده</div>
            </div>
          </div>
          <div className="card card-hover flex items-center gap-3 p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600">
              <Ic name="wallet" size={22} />
            </span>
            <div className="min-w-0">
              <div className="truncate text-base font-black text-brand-700">{formatPrice(stats.totalEarnings)}</div>
              <div className="text-xs font-semibold text-ink-500">درآمد کل</div>
            </div>
          </div>
        </div>
      )}

      {/* Active Jobs */}
      <div className="rounded-xl border border-ink-200 bg-white shadow-sm">
        <div className="border-b border-ink-100 px-5 py-3 font-bold text-ink-800">کارهای اخیر</div>
        <div className="divide-y divide-ink-50">
          {jobs.length === 0 ? (
            <div className="p-10 text-center text-ink-400">
              <img src="/empty-list.svg" alt="" className="mx-auto h-32 w-auto" />
              <p className="mt-3 text-sm font-bold">هنوز کاری ندارید</p>
              <p className="mt-1 text-xs">وقتی مشتری سفارشی بسازد، اینجا ظاهر می‌شود.</p>
            </div>
          ) : (
            jobs.map((j) => (
              <div key={j.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink-900">{j.projectTitle}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[j.status] ?? 'bg-ink-100 text-ink-700'}`}>
                      {statusLabel[j.status] ?? j.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <Ic name="wrench" size={14} />
                      قطعات: {formatPrice(j.partsCost)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Ic name="hardHat" size={14} />
                      دستمزد: {formatPrice(j.laborCost)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Ic name="truck" size={14} />
                      ارسال: {formatPrice(j.shippingCost)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-brand-700">{formatPrice(j.totalCost)}</span>
                  <Link to={`/projects/${j.projectId}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                    مشاهده
                    <Ic name="arrowLeft" size={14} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
