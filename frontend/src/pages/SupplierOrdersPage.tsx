import { useEffect, useState } from 'react'
import { Ic } from '../lib/icons'

interface SupplierOrder {
  id: number
  projectTitle: string
  customerName: string
  parts: Array<{ name: string; quantity: number; unitPrice: number }>
  totalAmount: number
  status: string
  shippingAddress: string
  createdAt: string
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('fa-IR').format(n) + ' تومان'
}

const statusLabel: Record<string, string> = {
  Pending: 'در انتظار تأیید',
  Processing: 'در حال پردازش',
  Shipped: 'ارسال شده',
  Delivered: 'تحویل شده',
}

const statusTone: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Processing: 'bg-sky-100 text-sky-700',
  Shipped: 'bg-blue-100 text-blue-700',
  Delivered: 'bg-green-100 text-green-700',
}

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<SupplierOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setOrders([
        {
          id: 1, projectTitle: 'چراغ رومیزی LED', customerName: 'علی محمدی',
          parts: [
            { name: 'LED ۵ میلی‌متری سفید', quantity: 5, unitPrice: 1500 },
            { name: 'مقاومت ۴۷۰ اهم', quantity: 5, unitPrice: 80 },
          ],
          totalAmount: 7900, status: 'Pending', shippingAddress: 'تهران، خیابان ولیعصر', createdAt: new Date().toISOString(),
        },
        {
          id: 2, projectTitle: 'پاور بانک USB', customerName: 'سارا احمدی',
          parts: [
            { name: 'ماژول شارژ TP4056', quantity: 1, unitPrice: 12000 },
            { name: 'سلول ۱۸۶۵۰', quantity: 2, unitPrice: 45000 },
          ],
          totalAmount: 102000, status: 'Shipped', shippingAddress: 'اصفهان، خیابان چهارباغ', createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const updateStatus = (id: number, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-2 text-2xl font-black text-ink-900"><Ic name="clipboard" size={26} /> سفارشات دریافتی</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-ink-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white py-16 text-center text-ink-400">
          <img src="/empty-list.svg" alt="" className="mx-auto h-32 w-auto" />
          <p className="mt-3 text-sm font-bold">هنوز سفارشی ندارید</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-ink-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink-900">{o.projectTitle}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[o.status]}`}>
                      {statusLabel[o.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-400">
                    مشتری: <span className="font-semibold text-ink-600">{o.customerName}</span> — {o.shippingAddress}
                  </p>
                </div>
                <span className="text-lg font-black text-brand-700">{formatPrice(o.totalAmount)}</span>
              </div>

              {/* Parts list */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-ink-100 text-right text-ink-400">
                      <th className="pb-1 pr-0">قطعه</th>
                      <th className="pb-1">تعداد</th>
                      <th className="pb-1">قیمت واحد</th>
                      <th className="pb-1 pl-0">جمع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.parts.map((p, i) => (
                      <tr key={i} className="border-b border-ink-50 last:border-0">
                        <td className="py-1.5 pr-0 font-semibold text-ink-700">{p.name}</td>
                        <td className="py-1.5 text-ink-600">{p.quantity}</td>
                        <td className="py-1.5 text-ink-600">{formatPrice(p.unitPrice)}</td>
                        <td className="py-1.5 pl-0 font-bold text-brand-700">{formatPrice(p.unitPrice * p.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              {o.status === 'Pending' && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(o.id, 'Processing')}
                    className="rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700"
                  >
                    <Ic name="circleCheck" size={14} /> تأیید و پردازش
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(o.id, 'Shipped')}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    <Ic name="truck" size={14} /> ارسال شد
                  </button>
                </div>
              )}
              {o.status === 'Processing' && (
                <button
                  type="button"
                  onClick={() => updateStatus(o.id, 'Shipped')}
                  className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  <Ic name="truck" size={14} /> ارسال شد
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
