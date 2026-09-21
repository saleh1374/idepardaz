import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

interface SupplierStats {
  totalProducts: number
  activeProducts: number
  pendingOrders: number
  totalSales: number
}

interface SupplierOrder {
  id: number
  projectTitle: string
  partsCount: number
  totalAmount: number
  status: string
  createdAt: string
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('fa-IR').format(n) + ' تومان'
}

export default function SupplierDashboardPage() {
  const [stats, setStats] = useState<SupplierStats | null>(null)
  const [orders, setOrders] = useState<SupplierOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalProducts: 12,
        activeProducts: 10,
        pendingOrders: 2,
        totalSales: 2450000,
      })
      setOrders([
        { id: 1, projectTitle: 'چراغ رومیزی LED', partsCount: 5, totalAmount: 85000, status: 'Pending', createdAt: new Date().toISOString() },
        { id: 2, projectTitle: 'پاور بانک USB', partsCount: 3, totalAmount: 120000, status: 'Shipped', createdAt: new Date(Date.now() - 86400000).toISOString() },
      ])
      setLoading(false)
    }, 500)
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-ink-900">🏪 داشبورد تأمین‌کننده</h1>
        <Link to="/supplier/products" className="btn-primary px-5 py-2 text-sm">
          + افزودن محصول
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-sky-50 p-4 text-sky-700">
            <div className="text-2xl">📦</div>
            <div className="mt-1 text-2xl font-extrabold">{stats.totalProducts}</div>
            <div className="text-sm font-medium">کل محصولات</div>
          </div>
          <div className="rounded-xl bg-green-50 p-4 text-green-700">
            <div className="text-2xl">✅</div>
            <div className="mt-1 text-2xl font-extrabold">{stats.activeProducts}</div>
            <div className="text-sm font-medium">فعال</div>
          </div>
          <div className="rounded-xl bg-amber-50 p-4 text-amber-700">
            <div className="text-2xl">⏳</div>
            <div className="mt-1 text-2xl font-extrabold">{stats.pendingOrders}</div>
            <div className="text-sm font-medium">سفارش در انتظار</div>
          </div>
          <div className="rounded-xl bg-brand-50 p-4 text-brand-700">
            <div className="text-2xl">💰</div>
            <div className="mt-1 text-2xl font-extrabold">{formatPrice(stats.totalSales)}</div>
            <div className="text-sm font-medium">فروش کل</div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="rounded-xl border border-ink-200 bg-white shadow-sm">
        <div className="border-b border-ink-100 px-5 py-3 font-bold text-ink-800">آخرین سفارشات دریافتی</div>
        <div className="divide-y divide-ink-50">
          {orders.length === 0 ? (
            <div className="p-10 text-center text-ink-400">
              <span className="text-4xl">📦</span>
              <p className="mt-3 text-sm font-bold">هنوز سفارشی ندارید</p>
            </div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <span className="font-bold text-ink-900">{o.projectTitle}</span>
                  <span className="mr-2 text-xs text-ink-400">{o.partsCount} قلم</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-brand-700">{formatPrice(o.totalAmount)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    o.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {o.status === 'Pending' ? 'در انتظار' : 'ارسال شده'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
