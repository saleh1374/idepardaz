import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatPrice } from '../lib/format'

const BASE = import.meta.env.VITE_API_BASE ?? '/api'

interface OrderItem {
  logicalPartId: string
  logicalPartName: string
  sku: string
  supplierName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  url: string | null
}

interface OrderDetail {
  id: number
  projectId: number
  status: string
  total: number
  recipientName: string | null
  shippingAddress: string | null
  createdAt: string
  items: OrderItem[]
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

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetch(`${BASE}/orders/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`خطای سرور (${res.status})`)
        return res.json()
      })
      .then((data: OrderDetail) => setOrder(data))
      .catch((e) => setError(e instanceof Error ? e.message : 'خطا در بارگذاری'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="card h-40 animate-pulse bg-ink-100" />
        <div className="card mt-4 h-60 animate-pulse bg-ink-100" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
        <Link to="/orders" className="btn-outline mt-4 inline-flex text-sm">
          ← بازگشت به سفارشات
        </Link>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/orders" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
        ← سفارشات من
      </Link>

      {/* Header */}
      <div className="card animate-fadeInUp p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-ink-900">جزئیات سفارش</h1>
            <p className="mt-1 text-sm text-ink-500">
              شماره سفارش: <span className="font-mono font-bold text-ink-700" dir="ltr">#{order.id}</span>
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusTone[order.status] ?? 'bg-ink-100 text-ink-700'}`}>
            {statusLabel[order.status] ?? order.status}
          </span>
        </div>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-ink-50 px-4 py-3">
            <span className="text-xs text-ink-400">پروژه</span>
            <p className="font-mono font-semibold text-ink-700" dir="ltr">#{order.projectId}</p>
          </div>
          <div className="rounded-lg bg-ink-50 px-4 py-3">
            <span className="text-xs text-ink-400">تاریخ ایجاد</span>
            <p className="font-semibold text-ink-700">{formatDate(order.createdAt)}</p>
          </div>
          {order.recipientName && (
            <div className="rounded-lg bg-ink-50 px-4 py-3">
              <span className="text-xs text-ink-400">نام گیرنده</span>
              <p className="font-semibold text-ink-700">{order.recipientName}</p>
            </div>
          )}
          {order.shippingAddress && (
            <div className="rounded-lg bg-ink-50 px-4 py-3">
              <span className="text-xs text-ink-400">آدرس ارسال</span>
              <p className="font-semibold text-ink-700">{order.shippingAddress}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="card animate-fadeInUp mt-6 p-6">
        <h2 className="text-lg font-bold text-ink-900">اقلام سفارش</h2>
        <p className="mt-1 text-xs text-ink-400">{order.items.length} قلم</p>

        {order.items.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-right text-xs font-semibold text-ink-500">
                  <th className="pb-2 pr-0">قلم</th>
                  <th className="pb-2">تأمین‌کننده</th>
                  <th className="pb-2">تعداد</th>
                  <th className="pb-2">قیمت واحد</th>
                  <th className="pb-2 pl-0">جمع</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-b border-ink-100 last:border-0">
                    <td className="py-3 pr-0">
                      <div className="font-semibold text-ink-800">{item.logicalPartName}</div>
                      <div className="text-[11px] text-ink-400" dir="ltr">
                        {item.sku && `SKU: ${item.sku}`}
                      </div>
                    </td>
                    <td className="py-3 text-ink-600">{item.supplierName || '—'}</td>
                    <td className="py-3 text-ink-600">{item.quantity}</td>
                    <td className="py-3 text-ink-600">{formatPrice(item.unitPrice)}</td>
                    <td className="py-3 pl-0 font-bold text-brand-700">{formatPrice(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-400">اقلامی ثبت نشده است.</p>
        )}

        {/* Total */}
        <div className="mt-4 flex items-center justify-between rounded-xl border-2 border-brand-200 bg-brand-50 px-5 py-4">
          <span className="text-base font-bold text-ink-700">جمع کل</span>
          <span className="text-xl font-black text-brand-700">{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  )
}
