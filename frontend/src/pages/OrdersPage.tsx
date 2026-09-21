import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatPrice } from '../lib/format'

interface OrderSummary {
  id: number
  projectId: number
  status: string
  total: number
  recipientName: string | null
  itemCount: number
  createdAt: string
}

const statusLabel: Record<string, string> = {
  Pending: 'در انتظار',
  Paid: 'پرداخت‌شده',
  Processing: 'در حال پردازش',
  Shipped: 'ارسال‌شده',
  Delivered: 'تحویل‌شده',
  Cancelled: 'لغوشده',
}

const statusTone: Record<string, string> = {
  Pending: 'bg-ink-100 text-ink-700',
  Paid: 'bg-brand-100 text-brand-700',
  Processing: 'bg-sky-100 text-sky-700',
  Shipped: 'bg-amber-100 text-amber-700',
  Delivered: 'bg-teal-100 text-teal-700',
  Cancelled: 'bg-rose-100 text-rose-700',
}

const statusOptions = ['', 'Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api
      .listOrders({ status: status || undefined, page })
      .then((data) => setOrders(data.items ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'خطا در بارگذاری'))
      .finally(() => setLoading(false))
  }, [status, page])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-fadeInUp">
        <h1 className="text-2xl font-black text-ink-900 sm:text-3xl">سفارشات من</h1>
        <p className="mt-2 text-sm text-ink-500">
          لیست سفارشات و وضعیت آن‌ها.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="text-sm font-semibold text-ink-700">وضعیت:</label>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="input sm:max-w-xs"
        >
          <option value="">همه وضعیت‌ها</option>
          {statusOptions.filter(Boolean).map((s) => (
            <option key={s} value={s}>{statusLabel[s] ?? s}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card animate-fadeInUp overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-ink-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <span className="text-4xl">📦</span>
            <p className="mt-4 text-base font-bold text-ink-600">هنوز سفارشی ثبت نشده</p>
            <p className="mt-1 text-sm text-ink-400">سفارشات شما اینجا نمایش داده خواهند شد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50 text-right text-xs font-semibold text-ink-500">
                  <th className="px-4 py-3">شماره سفارش</th>
                  <th className="px-4 py-3">پروژه</th>
                  <th className="px-4 py-3">وضعیت</th>
                  <th className="px-4 py-3">مبلغ</th>
                  <th className="px-4 py-3">تعداد اقلام</th>
                  <th className="px-4 py-3">تاریخ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-ink-800" dir="ltr">#{o.id}</td>
                    <td className="px-4 py-3 font-mono text-ink-600" dir="ltr">#{o.projectId}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[o.status] ?? 'bg-ink-100 text-ink-700'}`}>
                        {statusLabel[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-700">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3 text-ink-600">{o.itemCount}</td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${o.id}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        جزئیات ←
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && orders.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-outline px-4 py-1.5 text-xs disabled:opacity-40"
          >
            ← قبلی
          </button>
          <span className="text-sm font-semibold text-ink-600">صفحه {page}</span>
          <button
            type="button"
            disabled={orders.length < 10}
            onClick={() => setPage((p) => p + 1)}
            className="btn-outline px-4 py-1.5 text-xs disabled:opacity-40"
          >
            بعدی →
          </button>
        </div>
      )}
    </div>
  )
}
