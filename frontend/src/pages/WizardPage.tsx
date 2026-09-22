import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { IntentResult } from '../lib/types'
import Badge from '../components/Badge'
import { Ic, type IconName } from '../lib/icons'

const examples: Array<{ text: string; icon: IconName }> = [
  { text: 'می‌خواهم یک چراغ نور مطالعه با LED و USB بسازم', icon: 'lightbulb' },
  { text: 'یک پاوربانک با باتری لیتیومی ۱۸۶۵۰ می‌خواهم', icon: 'batteryCharging' },
  { text: 'می‌خواهم فن خنک‌کننده برای کیس بسازم', icon: 'fan' },
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
      <div className="animate-fadeInUp text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-600 text-white shadow-lg shadow-brand-500/25">
          <Ic name="sparkles" size={30} />
        </span>
        <h1 className="mt-4 text-3xl font-black text-ink-900">ویزارد هوشمند بساز</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-ink-500">
          خواسته‌ات را بنویس؛ با کاتالوگ دستورهای تأییدشده تطبیق داده و مناسب‌ترین را پیشنهاد
          می‌دهد.
        </p>
      </div>

      <div className="animate-fadeInUp card mt-8 p-6" style={{ animationDelay: '100ms' }}>
        <label htmlFor="idea" className="flex items-center gap-2 text-sm font-bold text-ink-800">
          <Ic name="message" size={16} className="text-brand-600" />
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
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button
                key={ex.text}
                type="button"
                onClick={() => {
                  setText(ex.text)
                  void ask(ex.text)
                }}
                className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs text-ink-500 transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 hover:shadow-sm"
              >
                <Ic name={ex.icon} size={13} className="shrink-0" />
                {ex.text.length > 30 ? ex.text.slice(0, 30) + '…' : ex.text}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void ask()}
            disabled={loading || !text.trim()}
            className="btn-primary shrink-0 px-7 py-3"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                در حال تحلیل…
              </span>
            ) : (
              <>
                <Ic name="target" size={16} />
                تحلیل خواسته
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="animate-fadeIn mt-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          <Ic name="alertCircle" size={17} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="animate-fadeInUp card mt-8 p-6">
          {result.warnings.length > 0 && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
                <Ic name="alert" size={16} />
                هشدارهای ایمنی
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-800">
                {result.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendedRecipeId ? (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold text-brand-600">
                    <Ic name="target" size={14} />
                    پیشنهاد بساز
                  </p>
                  <h2 className="mt-1 text-xl font-black text-ink-900">
                    {result.recommendedRecipeTitle ?? result.recommendedRecipeId}
                  </h2>
                </div>
                <Link
                  to={`/recipes/${encodeURIComponent(result.recommendedRecipeId)}`}
                  className="btn-primary flex shrink-0 items-center gap-1.5 text-xs"
                >
                  باز کردن دستور
                  <Ic name="arrowLeft" size={14} />
                </Link>
              </div>

              {/* Confidence bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-500">
                  <span>میزان تطابق</span>
                  <span>{Math.round(result.confidence * 100)}٪</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-brand-500 to-teal-500 transition-all duration-700 ease-out"
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
              <img src="/empty-search.svg" alt="" className="mx-auto h-36 w-auto" />
              <p className="mt-2 text-lg font-black text-ink-800">هنوز دستوری برای این خواسته نداریم</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-ink-500">
                {result.missingRequirements[0] ?? 'پرسش خود را دقیق‌تر بپرسید.'}
              </p>
              <Link to="/recipes" className="btn-outline mt-5 inline-flex items-center gap-1.5 text-sm">
                مرور دستورهای موجود
                <Ic name="arrowLeft" size={15} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
