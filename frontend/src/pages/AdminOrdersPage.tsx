import { useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_API_BASE ?? '/api'

interface OrderItem {
  id: number
  projectId: number
  status: string
  total: number
  recipientName: string | null
  createdAt: string
}

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Paid: 'bg-blue-100 text-blue-700',
    Shipped: 'bg-indigo-100 text-indigo-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
  }
  return map[s] ?? 'bg-gray-100 text-gray-700'
}

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    Pending: 'در انتظار', Paid: 'پرداخت شده', Shipped: 'ارسال شده', Delivered: 'تحویل شده', Cancelled: 'لغو شده',
  }
  return map[s] ?? s
}

const formatPrice = (n: number) => new Intl.NumberFormat('fa-IR').format(n) + ' تومان'
const formatDate = (d: string) => new Date(d).toLocaleDateString('fa-IR')

const statusOptions = [
  { value: '', label: 'همه وضعیت‌ها' },
  { value: 'Pending', label: '⏳ در انتظار' },
  { value: 'Paid', label: '💰 پرداخت شده' },
  { value: 'Shipped', label: '🚚 ارسال شده' },
  { value: 'Delivered', label: '✅ تحویل شده' },
  { value: 'Cancelled', label: '❌ لغو شده' },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = (p: number, status: string) => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ page: p.toString() })
    if (status) params.set('status', status)
    fetch(`${BASE}/admin/orders?${params}`)
      .then(r => { if (!r.ok) throw new Error('خطا'); return r.json() })
      .then(d => { setOrders(d.items); setTotal(d.total) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page, statusFilter) }, [page, statusFilter])

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-900">📦 مدیریت سفارشات</h1>
        <span className="rounded-full bg-ink-100 px-3 py-1 text-sm font-bold text-ink-600">{total} سفارش</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700"
        >
          {statusOptions.filter(o => o.value !== '').map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">❌ {error}</div>}

      {loading ? (
        <div className="py-12 text-center text-ink-400">⏳ در حال بارگذاری...</div>
      ) : (
        <div className="rounded-xl border border-ink-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-right text-xs font-semibold text-ink-500">
                <th className="px-5 py-2.5">شناسه</th>
                <th className="px-5 py-2.5">پروژه</th>
                <th className="px-5 py-2.5">دریافت‌کننده</th>
                <th className="px-5 py-2.5">وضعیت</th>
                <th className="px-5 py-2.5">مبلغ</th>
                <th className="px-5 py-2.5">تاریخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-ink-50/50">
                  <td className="px-5 py-3 font-mono text-xs text-ink-500">#{o.id}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-600">#{o.projectId}</td>
                  <td className="px-5 py-3 text-ink-700">{o.recipientName ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${statusBadge(o.status)}`}>{statusLabel(o.status)}</span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-ink-800">{formatPrice(o.total)}</td>
                  <td className="px-5 py-3 text-xs text-ink-500">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-ink-400">سفارشی یافت نشد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {total > 50 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-40">قبلی</button>
          <span className="text-sm text-ink-500">صفحه {page}</span>
          <button disabled={orders.length < 50} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-40">بعدی</button>
        </div>
      )}
    </div>
  )
}
