import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Ic } from '../lib/icons'

interface RecipeItem {
  id: string
  title: string
  category: string
  difficulty: string
  safetyLevel: string
  status: string
  createdAt: string
}

const diffBadge = (d: string) => {
  const map: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  }
  return map[d] ?? 'bg-gray-100 text-gray-700'
}

const diffLabel = (d: string) => {
  const map: Record<string, string> = { beginner: 'مبتدی', intermediate: 'متوسط', advanced: 'پیشرفته' }
  return map[d] ?? d
}

const safetyLabel = (s: string) => {
  const map: Record<string, string> = { LOW: 'کم', MEDIUM: 'متوسط', HIGH: 'زیاد', CRITICAL: 'بحرانی' }
  return map[s] ?? s
}

const safetyDot = (s: string) => {
  const map: Record<string, string> = {
    LOW: 'bg-emerald-500',
    MEDIUM: 'bg-amber-500',
    HIGH: 'bg-orange-500',
    CRITICAL: 'bg-rose-500',
  }
  const bg = map[s] ?? 'bg-ink-400'
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${bg}`} aria-hidden="true" />
}

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<RecipeItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .adminPendingRecipes()
      .then((d) => { setRecipes(d.items); setTotal(d.total) })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'خطا'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const approve = async (id: string) => {
    setActionId(id)
    try {
      await api.adminApproveRecipe(id)
      setRecipes(prev => prev.filter(r => r.id !== id))
      setTotal(prev => prev - 1)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا')
    } finally {
      setActionId(null)
    }
  }

  const reject = async (id: string) => {
    setActionId(id)
    try {
      await api.adminRejectRecipe(id)
      setRecipes(prev => prev.filter(r => r.id !== id))
      setTotal(prev => prev - 1)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink-900">
          <Ic name="clipboard" size={26} />
          مدیریت دستورها — در انتظار بررسی
        </h1>
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-700">{total} در انتظار</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <Ic name="circleX" size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-center text-ink-400">
          <Ic name="hourglass" size={16} />
          در حال بارگذاری...
        </div>
      ) : recipes.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white py-16 text-center text-ink-400">
          <img src="/empty-list.svg" alt="" className="mx-auto h-32 w-auto" />
          <p className="mt-4 text-sm font-bold text-ink-500">همه دستورها بررسی شده‌اند</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recipes.map(r => (
            <div key={r.id} className="rounded-xl border border-ink-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-ink-900">{r.title}</h3>
                    <span className="font-mono text-xs text-ink-400">{r.id}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 font-semibold text-ink-600">{r.category}</span>
                    <span className={`rounded-full px-2 py-0.5 font-bold ${diffBadge(r.difficulty)}`}>{diffLabel(r.difficulty)}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2 py-0.5 font-semibold text-ink-600">
                      {safetyDot(r.safetyLevel)}
                      {safetyLabel(r.safetyLevel)}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-600">{r.status}</span>
                  </div>
                  <div className="text-xs text-ink-400">تاریخ ایجاد: {new Date(r.createdAt).toLocaleDateString('fa-IR')}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={actionId === r.id}
                    onClick={() => approve(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <Ic name="check" size={15} />
                    تأیید
                  </button>
                  <button
                    disabled={actionId === r.id}
                    onClick={() => reject(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    <Ic name="close" size={15} />
                    رد
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
