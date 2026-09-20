import { useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_API_BASE ?? '/api'

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
  const map: Record<string, string> = { LOW: '🟢 کم', MEDIUM: '🟡 متوسط', HIGH: '🟠 زیاد', CRITICAL: '🔴 بحرانی' }
  return map[s] ?? s
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('fa-IR')

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<RecipeItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    fetch(`${BASE}/admin/recipes/pending`)
      .then(r => { if (!r.ok) throw new Error('خطا'); return r.json() })
      .then(d => { setRecipes(d.items); setTotal(d.total) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const approve = async (id: string) => {
    setActionId(id)
    try {
      const res = await fetch(`${BASE}/admin/recipes/${id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error('خطا در تأیید')
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
      const res = await fetch(`${BASE}/admin/recipes/${id}/reject`, { method: 'POST' })
      if (!res.ok) throw new Error('خطا در رد')
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
        <h1 className="text-2xl font-extrabold text-ink-900">📋 مدیریت دستورها — در انتظار بررسی</h1>
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-700">{total} در انتظار</span>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">❌ {error}</div>}

      {loading ? (
        <div className="py-12 text-center text-ink-400">⏳ در حال بارگذاری...</div>
      ) : recipes.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white py-16 text-center text-ink-400">
          ✅ همه دستورها بررسی شده‌اند
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
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 font-semibold text-ink-600">{safetyLabel(r.safetyLevel)}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-600">{r.status}</span>
                  </div>
                  <div className="text-xs text-ink-400">تاریخ ایجاد: {formatDate(r.createdAt)}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={actionId === r.id}
                    onClick={() => approve(r.id)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    ✅ تأیید
                  </button>
                  <button
                    disabled={actionId === r.id}
                    onClick={() => reject(r.id)}
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    ❌ رد
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
