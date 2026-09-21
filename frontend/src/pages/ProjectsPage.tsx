import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatPrice } from '../lib/format'

interface Project {
  id: number
  title: string
  recipeId: string
  recipeVersion: string
  status: string
  bomId: number | null
  createdAt: string
  orderId: number | null
  orderStatus: string | null
  orderTotal: number | null
}

const statusLabel: Record<string, string> = {
  Draft: 'پیش‌نویس',
  Planning: 'در حال برنامه‌ریزی',
  BomReady: 'BOM آماده',
  Ordered: 'سفارش‌داده',
  Building: 'در حال ساخت',
  Completed: 'تکمیل‌شده',
  Cancelled: 'لغوشده',
}

const statusTone: Record<string, string> = {
  Draft: 'bg-ink-100 text-ink-700',
  Planning: 'bg-sky-100 text-sky-700',
  BomReady: 'bg-brand-100 text-brand-700',
  Ordered: 'bg-amber-100 text-amber-700',
  Building: 'bg-purple-100 text-purple-700',
  Completed: 'bg-teal-100 text-teal-700',
  Cancelled: 'bg-rose-100 text-rose-700',
}

const orderStatusLabel: Record<string, string> = {
  Pending: 'در انتظار پرداخت',
  Paid: 'پرداخت شده',
  Processing: 'در حال پردازش',
  Shipped: 'ارسال شده',
  Delivered: 'تحویل شده',
  Cancelled: 'لغو شده',
}

const orderStatusTone: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Paid: 'bg-brand-100 text-brand-700',
  Processing: 'bg-sky-100 text-sky-700',
  Shipped: 'bg-purple-100 text-purple-700',
  Delivered: 'bg-teal-100 text-teal-700',
  Cancelled: 'bg-rose-100 text-rose-700',
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api
      .listProjects()
      .then((r) => setProjects(r.items as unknown as Project[]))
      .catch((e) => setError(e instanceof Error ? e.message : 'خطا در بارگذاری'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-fadeInUp">
        <h1 className="text-2xl font-black text-ink-900 sm:text-3xl">پروژه‌های من</h1>
        <p className="mt-2 text-sm text-ink-500">
          پروژه‌هایی که از دستورهای ساخت ایجاد کرده‌اید.
        </p>
      </div>

      {error && (
        <div className="animate-fadeIn mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-40 animate-pulse bg-ink-100" />
          ))}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="animate-fadeInUp mt-16 text-center">
          <span className="text-4xl">📁</span>
          <p className="mt-4 text-base font-bold text-ink-600">هنوز پروژه‌ای ندارید</p>
          <p className="mt-1 text-sm text-ink-400">
            از یک دستور ساخت شروع کنید و پروژه ایجاد کنید.
          </p>
          <Link to="/recipes" className="btn-primary mt-5 inline-flex text-sm">
            مرور دستورها ←
          </Link>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="card card-hover animate-fadeInUp p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold text-ink-900">{p.title}</h3>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[p.status] ?? 'bg-ink-100 text-ink-700'}`}>
                  {statusLabel[p.status] ?? p.status}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-ink-500">
                <p>📦 دستور: <span className="font-semibold text-ink-700">{p.recipeId}</span></p>
                <p>🔖 نسخه: <span className="font-mono text-ink-600" dir="ltr">{p.recipeVersion}</span></p>
                {p.bomId && <p>💰 BOM: <span className="font-mono text-ink-600" dir="ltr">#{p.bomId}</span></p>}
                <p>📅 {formatDate(p.createdAt)}</p>
              </div>

              {/* وضعیت سفارش */}
              {p.orderId && (
                <div className="mt-3 rounded-lg border border-ink-200 bg-ink-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🛒</span>
                      <span className="text-xs font-bold text-ink-700">سفارش #{p.orderId}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${orderStatusTone[p.orderStatus ?? ''] ?? 'bg-ink-100 text-ink-600'}`}>
                      {orderStatusLabel[p.orderStatus ?? ''] ?? p.orderStatus}
                    </span>
                  </div>
                  {p.orderTotal && (
                    <p className="mt-1.5 text-xs text-ink-500">
                      مبلغ: <span className="font-bold text-brand-700">{formatPrice(p.orderTotal)}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Link
                  to={`/projects/${p.id}`}
                  className="btn-primary flex-1 text-center text-xs"
                >
                  مشاهدهٔ پروژه ←
                </Link>
                {p.orderId ? (
                  <Link
                    to={`/orders/${p.orderId}`}
                    className="btn-outline flex-1 text-center text-xs"
                  >
                    🛒 پیگیری سفارش
                  </Link>
                ) : p.bomId ? (
                  <Link
                    to={`/projects/${p.id}/buy`}
                    className="btn-outline flex-1 text-center text-xs"
                  >
                    🛒 خرید قطعات
                  </Link>
                ) : (
                  <Link
                    to={`/recipes/${encodeURIComponent(p.recipeId)}`}
                    className="btn-outline flex-1 text-center text-xs"
                  >
                    مشاهدهٔ دستور
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
