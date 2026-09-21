import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface AuditItem {
  id: number
  entityType: string
  entityId: string
  action: string
  actorId: string
  dataJson: string | null
  timestamp: string
}

const actionBadge = (a: string) => {
  if (a.includes('Approved')) return 'bg-green-100 text-green-700'
  if (a.includes('Rejected')) return 'bg-red-100 text-red-700'
  if (a.includes('Created')) return 'bg-blue-100 text-blue-700'
  if (a.includes('StatusChanged')) return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-700'
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = (p: number) => {
    setLoading(true)
    setError(null)
    api
      .adminAuditLog(p)
      .then((d) => { setLogs(d.items); setTotal(d.total) })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'خطا'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-900">📝 گزارش عملیات (Audit Log)</h1>
        <span className="rounded-full bg-ink-100 px-3 py-1 text-sm font-bold text-ink-600">{total} رکورد</span>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">❌ {error}</div>}

      {loading ? (
        <div className="py-12 text-center text-ink-400">⏳ در حال بارگذاری...</div>
      ) : (
        <div className="rounded-xl border border-ink-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-right text-xs font-semibold text-ink-500">
                <th className="px-5 py-2.5">زمان</th>
                <th className="px-5 py-2.5">نوع موجودیت</th>
                <th className="px-5 py-2.5">شناسه</th>
                <th className="px-5 py-2.5">عملیات</th>
                <th className="px-5 py-2.5">بازیگر</th>
                <th className="px-5 py-2.5">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-ink-50/50">
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-ink-500" dir="ltr">
                    {new Date(l.timestamp).toLocaleString('fa-IR')}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-bold text-ink-600">{l.entityType}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-500">{l.entityId}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${actionBadge(l.action)}`}>{l.action}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-600">{l.actorId}</td>
                  <td className="px-5 py-3">
                    {l.dataJson && (
                      <details className="group">
                        <summary className="cursor-pointer text-xs text-brand-600 hover:text-brand-700">مشاهده</summary>
                        <pre className="mt-1 max-w-xs overflow-x-auto rounded bg-ink-50 p-2 text-[10px] text-ink-600">{l.dataJson}</pre>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-ink-400">گزارشی وجود ندارد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {total > 50 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-40">قبلی</button>
          <span className="text-sm text-ink-500">صفحه {page}</span>
          <button disabled={logs.length < 50} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-40">بعدی</button>
        </div>
      )}
    </div>
  )
}
