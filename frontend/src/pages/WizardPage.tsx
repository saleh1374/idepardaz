import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { IntentResult } from '../lib/types'
import Badge from '../components/Badge'

const examples = [
  'می‌خواهم یک چراغ نور مطالعه با LED و USB بسازم',
  'یک پاوربانک با باتری لیتیومی ۱۸۶۵۰ می‌خواهم',
  'می‌خواهم فن خنک‌کننده برای کیس بسازم',
]

export default function WizardPage() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<IntentResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ask = async (value?: string) => {
    const input = (value ?? text).trim()
    if (!input) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      setResult(await api.intent(input))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'ارتباط با سرور برقرار نشد.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink-900">ویزارد هوشمند بساز</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-ink-500">
          دستیار AI، نه مرجع ایمنی. خواسته‌ات را بنویس؛ با کاتالوگ دستورهای تأییدشده تطبیق داده
          و مناسب‌ترین را پیشنهاد می‌دهد.
        </p>
      </div>

      <div className="card mt-8 p-6">
        <label htmlFor="idea" className="text-sm font-bold text-ink-800">
          چه چیزی می‌خواهی بسازی؟
        </label>
        <textarea
          id="idea"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="مثلاً: یک چراغ مطالعهٔ ساده می‌خواهم که با USB روشن شود…"
          className="input mt-3 resize-none"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setText(ex)
                  void ask(ex)
                }}
                className="rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs text-ink-500 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {ex.length > 34 ? ex.slice(0, 34) + '…' : ex}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void ask()}
            disabled={loading || !text.trim()}
            className="btn-primary px-7 py-3"
          >
            {loading ? 'در حال تحلیل…' : '✨ تحلیل خواسته'}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}

      {result && (
        <div className="card mt-8 p-6">
          {result.warnings.length > 0 && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-800">هشدارهای ایمنی</p>
              <ul className="mt-2 space-y-1 text-sm text-amber-800">
                {result.warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendedRecipeId ? (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-brand-600">پیشنهاد بساز</p>
                  <h2 className="mt-1 text-xl font-black text-ink-900">
                    {result.recommendedRecipeTitle ?? result.recommendedRecipeId}
                  </h2>
                </div>
                <Link
                  to={`/recipes/${encodeURIComponent(result.recommendedRecipeId)}`}
                  className="btn-primary shrink-0 text-xs"
                >
                  باز کردن دستور ←
                </Link>
              </div>

              {/* اطمینان */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-500">
                  <span>میزان تطابق</span>
                  <span>{Math.round(result.confidence * 100)}٪</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-brand-500 to-teal-500 transition-all"
                    style={{ width: `${Math.max(5, Math.round(result.confidence * 100))}%` }}
                  />
                </div>
              </div>

              {result.requirements.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-bold text-ink-500">نیازمندی‌های شناسایی‌شده</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.requirements.map((r) => (
                      <Badge key={r} tone="brand">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg font-black text-ink-800">هنوز دستوری برای این خواسته نداریم</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-ink-500">
                {result.missingRequirements[0] ?? 'پرسش خود را دقیق‌تر بپرسید.'}
              </p>
              <Link to="/recipes" className="btn-outline mt-5 inline-flex text-sm">
                مرور دستورهای موجود ←
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}