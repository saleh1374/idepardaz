import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

interface DashboardStats {
  recipes: number
  approvedRecipes: number
  pendingRecipes: number
  users: number
  projects: number
  orders: number
  parts: number
  suppliers: number
}

interface DashboardData {
  stats: DashboardStats
  recentProjects: Array<{ id: number; title: string; recipeId: string; status: string; createdAt: string }>
  recentOrders: Array<{ id: number; projectId: number; status: string; total: number; createdAt: string }>
}

const statCards = (s: DashboardStats) => [
  { label: 'دستورها', value: s.recipes, icon: '📋', color: 'bg-blue-50 text-blue-700' },
  { label: 'تأیید شده', value: s.approvedRecipes, icon: '✅', color: 'bg-green-50 text-green-700' },
  { label: 'در انتظار', value: s.pendingRecipes, icon: '⏳', color: 'bg-yellow-50 text-yellow-700' },
  { label: 'کاربران', value: s.users, icon: '👥', color: 'bg-purple-50 text-purple-700' },
  { label: 'پروژه‌ها', value: s.projects, icon: '🔧', color: 'bg-indigo-50 text-indigo-700' },
  { label: 'سفارشات', value: s.orders, icon: '📦', color: 'bg-orange-50 text-orange-700' },
  { label: 'قطعات', value: s.parts, icon: '⚡', color: 'bg-teal-50 text-teal-700' },
  { label: 'تأمین‌کنندگان', value: s.suppliers, icon: '🏭', color: 'bg-pink-50 text-pink-700' },
]

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-700',
    Planning: 'bg-blue-100 text-blue-700',
    BomReady: 'bg-cyan-100 text-cyan-700',
    PartsSelected: 'bg-indigo-100 text-indigo-700',
    Ordered: 'bg-orange-100 text-orange-700',
    Building: 'bg-yellow-100 text-yellow-700',
    Testing: 'bg-purple-100 text-purple-700',
    Completed: 'bg-green-100 text-green-700',
    Published: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Paid: 'bg-blue-100 text-blue-700',
    Shipped: 'bg-indigo-100 text-indigo-700',
    Delivered: 'bg-green-100 text-green-700',
  }
  return map[s] ?? 'bg-gray-100 text-gray-700'
}

export default function AdminPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .adminDashboard()
      .then(setData as never)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'خطا در بارگذاری'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-ink-500">⏳ در حال بارگذاری...</div>
  if (error) return <div className="m-8 rounded-xl bg-red-50 p-4 text-red-700">❌ {error}</div>
  if (!data) return null

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-extrabold text-ink-900">⚙️ پنل مدیریت — داشبورد</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards(data.stats).map(c => (
          <div key={c.label} className={`rounded-xl p-4 ${c.color}`}>
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-1 text-2xl font-extrabold">{c.value}</div>
            <div className="text-sm font-medium">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link to="/admin/users" className="rounded-xl border border-ink-200 bg-white p-4 text-center font-semibold text-ink-700 shadow-sm hover:bg-ink-50 transition-colors">👥 مدیریت کاربران</Link>
        <Link to="/admin/recipes" className="rounded-xl border border-ink-200 bg-white p-4 text-center font-semibold text-ink-700 shadow-sm hover:bg-ink-50 transition-colors">📋 مدیریت دستورها</Link>
        <Link to="/admin/orders" className="rounded-xl border border-ink-200 bg-white p-4 text-center font-semibold text-ink-700 shadow-sm hover:bg-ink-50 transition-colors">📦 مدیریت سفارشات</Link>
        <Link to="/admin/audit" className="rounded-xl border border-ink-200 bg-white p-4 text-center font-semibold text-ink-700 shadow-sm hover:bg-ink-50 transition-colors">📝 گزارش عملیات</Link>
      </div>

      {/* Recent Projects */}
      <div className="rounded-xl border border-ink-200 bg-white shadow-sm">
        <div className="border-b border-ink-100 px-5 py-3 font-bold text-ink-800">آخرین پروژه‌ها</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-right text-xs font-semibold text-ink-500">
                <th className="px-5 py-2.5">شناسه</th>
                <th className="px-5 py-2.5">عنوان</th>
                <th className="px-5 py-2.5">دستور</th>
                <th className="px-5 py-2.5">وضعیت</th>
                <th className="px-5 py-2.5">تاریخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {data.recentProjects.map(p => (
                <tr key={p.id} className="hover:bg-ink-50/50">
                  <td className="px-5 py-3 font-mono text-xs text-ink-500">#{p.id}</td>
                  <td className="px-5 py-3 font-semibold text-ink-800">{p.title || 'بدون عنوان'}</td>
                  <td className="px-5 py-3 text-ink-600">{p.recipeId}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${statusBadge(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-500">{new Date(p.createdAt).toLocaleDateString('fa-IR')}</td>
                </tr>
              ))}
              {data.recentProjects.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-ink-400">پروژه‌ای وجود ندارد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border border-ink-200 bg-white shadow-sm">
        <div className="border-b border-ink-100 px-5 py-3 font-bold text-ink-800">آخرین سفارشات</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-right text-xs font-semibold text-ink-500">
                <th className="px-5 py-2.5">شناسه</th>
                <th className="px-5 py-2.5">پروژه</th>
                <th className="px-5 py-2.5">وضعیت</th>
                <th className="px-5 py-2.5">مبلغ</th>
                <th className="px-5 py-2.5">تاریخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {data.recentOrders.map(o => (
                <tr key={o.id} className="hover:bg-ink-50/50">
                  <td className="px-5 py-3 font-mono text-xs text-ink-500">#{o.id}</td>
                  <td className="px-5 py-3 text-ink-600">#{o.projectId}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${statusBadge(o.status)}`}>{o.status}</span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-ink-800">{new Intl.NumberFormat('fa-IR').format(o.total)} تومان</td>
                  <td className="px-5 py-3 text-xs text-ink-500">{new Date(o.createdAt).toLocaleDateString('fa-IR')}</td>
                </tr>
              ))}
              {data.recentOrders.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-ink-400">سفارشی وجود ندارد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
