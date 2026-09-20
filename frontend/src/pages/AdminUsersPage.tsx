import { useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_API_BASE ?? '/api'

interface UserItem {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string
  createdAt: string
}

const roleBadge = (r: string) => {
  const map: Record<string, string> = {
    Admin: 'bg-red-100 text-red-700',
    Reviewer: 'bg-blue-100 text-blue-700',
    Member: 'bg-gray-100 text-gray-700',
  }
  return map[r] ?? 'bg-gray-100 text-gray-700'
}

const roleLabel = (r: string) => {
  const map: Record<string, string> = { Admin: 'مدیر', Reviewer: 'بازبین', Member: 'کاربر' }
  return map[r] ?? r
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('fa-IR')

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [changingId, setChangingId] = useState<string | null>(null)

  const load = (p: number) => {
    setLoading(true)
    setError(null)
    fetch(`${BASE}/admin/users?page=${p}`)
      .then(r => { if (!r.ok) throw new Error('خطا'); return r.json() })
      .then(d => { setUsers(d.items); setTotal(d.total) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  const changeRole = async (id: string, role: string) => {
    setChangingId(id)
    try {
      const res = await fetch(`${BASE}/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error('خطا در تغییر نقش')
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا')
    } finally {
      setChangingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-900">👥 مدیریت کاربران</h1>
        <span className="rounded-full bg-ink-100 px-3 py-1 text-sm font-bold text-ink-600">{total} کاربر</span>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">❌ {error}</div>}

      {loading ? (
        <div className="py-12 text-center text-ink-400">⏳ در حال بارگذاری...</div>
      ) : (
        <div className="rounded-xl border border-ink-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-right text-xs font-semibold text-ink-500">
                <th className="px-5 py-2.5">نام</th>
                <th className="px-5 py-2.5">ایمیل</th>
                <th className="px-5 py-2.5">تلفن</th>
                <th className="px-5 py-2.5">نقش</th>
                <th className="px-5 py-2.5">تاریخ عضویت</th>
                <th className="px-5 py-2.5">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-ink-50/50">
                  <td className="px-5 py-3 font-semibold text-ink-800">{u.name}</td>
                  <td className="px-5 py-3 text-ink-600">{u.email ?? '—'}</td>
                  <td className="px-5 py-3 text-ink-600" dir="ltr">{u.phone ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${roleBadge(u.role)}`}>{roleLabel(u.role)}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-500">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      disabled={changingId === u.id}
                      onChange={e => changeRole(u.id, e.target.value)}
                      className="rounded-lg border border-ink-200 px-2 py-1 text-xs font-semibold text-ink-700"
                    >
                      <option value="Member">کاربر</option>
                      <option value="Reviewer">بازبین</option>
                      <option value="Admin">مدیر</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-40">قبلی</button>
          <span className="text-sm text-ink-500">صفحه {page}</span>
          <button disabled={users.length < 50} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-40">بعدی</button>
        </div>
      )}
    </div>
  )
}
