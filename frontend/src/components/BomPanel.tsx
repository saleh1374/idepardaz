import { useState } from 'react'
import { api, ApiError } from '../lib/api'
import type { BomItem, BomResult } from '../lib/types'
import { formatNumber, formatPrice, roleLabel, stockLabel } from '../lib/format'
import type { ParamValues } from './ParameterForm'
import Badge from './Badge'

function StockDot({ status }: { status?: string | null }) {
  const tone =
    status === 'InStock'
      ? 'bg-brand-500'
      : status === 'LowStock'
        ? 'bg-amber-500'
        : 'bg-rose-500'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
      <span className={`h-2 w-2 rounded-full ${tone}`} />
      {stockLabel[status ?? ''] ?? status ?? '—'}
    </span>
  )
}

export default function BomPanel({
  recipeId,
  parameters,
  title,
  onBomGenerated,
}: {
  recipeId: string
  parameters: ParamValues
  title: string
  onBomGenerated?: (total: number | null) => void
}) {
  const [bom, setBom] = useState<BomResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectMsg, setProjectMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [projectCreated, setProjectCreated] = useState(false)
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    setProjectMsg(null)
    try {
      const result = await api.generateBom({ recipeId, parameters })
      setBom(result)
      onBomGenerated?.(result.total)
    } catch (e) {
      onBomGenerated?.(null)
      if (e instanceof ApiError) {
        setBom({ isValid: false, errors: e.errors ?? [e.message], warnings: [], bomId: null, total: null, recipeTitle: '', recipeVersion: '', items: [] })
        setError(e.message)
      } else {
        setError('ارتباط با سرور برقرار نشد.')
      }
    } finally {
      setLoading(false)
    }
  }

  const createProject = async () => {
    if (!bom?.isValid || projectCreated) return
    setSaving(true)
    setError(null)
    try {
      const res = await api.createProject({ title, recipeId, parameters })
      setProjectCreated(true)
      setCreatedProjectId(res.project.id)
      setProjectMsg(
        `پروژهٔ «${res.project.title}» ساخته شد — وضعیت: ${res.project.status} — شناسهٔ پروژه: ${res.project.id}`,
      )
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'خطا در ساخت پروژه')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {!bom && (
        <button type="button" onClick={generate} disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              در حال محاسبه…
            </span>
          ) : (
            '💰 محاسبهٔ BOM با قیمت زنده'
          )}
        </button>
      )}

      {bom && (
        <div className="space-y-4">
          {bom.warnings.length > 0 && (
            <div className="animate-fadeIn rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-800">⚠️ هشدارها</p>
              <ul className="mt-2 space-y-1 text-sm text-amber-800">
                {bom.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bom.errors.length > 0 && (
            <div className="animate-fadeIn rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-bold text-rose-800">❌ BOM معتبر نیست</p>
              <ul className="mt-2 space-y-1 text-sm text-rose-800">
                {bom.errors.map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bom.isValid && (
            <div className="animate-fadeIn">
              <div className="overflow-x-auto rounded-xl border border-ink-200">
                <table className="w-full min-w-[640px] text-right text-sm">
                  <thead className="bg-ink-50 text-xs font-bold text-ink-500">
                    <tr>
                      <th className="px-4 py-3">قطعه</th>
                      <th className="px-4 py-3">نقش</th>
                      <th className="px-4 py-3">تعداد</th>
                      <th className="px-4 py-3">تأمین‌کننده</th>
                      <th className="px-4 py-3">قیمت واحد</th>
                      <th className="px-4 py-3">جمع</th>
                      <th className="px-4 py-3">موجودی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {bom.items.map((item: BomItem) => (
                      <tr key={item.logicalPartId} className="bg-white transition-colors hover:bg-brand-50/30">
                        <td className="max-w-[220px] px-4 py-3">
                          <p className="font-semibold text-ink-800">{item.logicalPartName}</p>
                          <p className="font-mono text-[11px] text-ink-400" dir="ltr">
                            {item.sku ? `${item.sku} · ` : ''}
                            {item.logicalPartId}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={item.role === 'Required' ? 'brand' : 'ink'}>
                            {roleLabel[item.role] ?? item.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-semibold">{formatNumber(item.quantity)}</td>
                        <td className="px-4 py-3 text-ink-600">{item.supplierName ?? '—'}</td>
                        <td className="px-4 py-3">{formatPrice(item.unitPrice)}</td>
                        <td className="px-4 py-3 font-bold text-ink-900">
                          {formatPrice(item.lineTotal)}
                        </td>
                        <td className="px-4 py-3">
                          <StockDot status={item.stockStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col gap-3 rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-teal-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-brand-700">جمع کل سبد (بدون ارسال)</p>
                  <p className="text-2xl font-extrabold text-brand-800">{formatPrice(bom.total)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={generate} className="btn-outline text-xs">
                    🔄 محاسبهٔ دوباره
                  </button>
                  <button
                    type="button"
                    onClick={createProject}
                    disabled={saving || projectCreated}
                    className="btn-primary text-xs"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        در حال ثبت…
                      </span>
                    ) : projectCreated ? (
                      '✅ ثبت شده'
                    ) : (
                      '📝 ثبت به‌عنوان پروژهٔ من'
                    )}
                  </button>
                </div>
              </div>

              {projectMsg && (
                <div className="animate-fadeIn mt-3 rounded-xl border border-brand-300 bg-brand-50 p-4">
                  <p className="text-sm font-medium text-brand-800">✅ {projectMsg}</p>
                  {createdProjectId && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={`/projects/${createdProjectId}/buy`}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 transition-colors"
                      >
                        🛒 خرید قطعات
                      </a>
                      <a
                        href={`/projects/${createdProjectId}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-white px-5 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50 transition-colors"
                      >
                        📁 مشاهده پروژه
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && !projectMsg && (
            <p className="text-sm font-medium text-rose-600">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
