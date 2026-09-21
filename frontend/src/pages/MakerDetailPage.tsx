import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatPrice } from '../lib/format'

interface MakerService {
  id: number
  title: string
  description: string | null
  price: number
  unit: string
  leadTimeDays: number
}

interface MakerDetail {
  id: string
  displayName: string
  bio: string | null
  specialties: string | null
  city: string | null
  avatarUrl: string | null
  isVerified: boolean
  rating: number
  ratingCount: number
  userName: string
  createdAt: string
  services: MakerService[]
}

function parseSpecialties(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) as string[] } catch { return [] }
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span className="inline-flex items-center gap-0.5 text-sm text-amber-500">
      {'★'.repeat(full)}
      {half && '½'}
      {'☆'.repeat(empty)}
      <span className="mr-1 font-mono text-ink-500" dir="ltr">{rating.toFixed(1)}</span>
    </span>
  )
}

const unitLabel = (u: string) => {
  const map: Record<string, string> = { per_item: 'به ازای هر عدد', per_hour: 'به ازای ساعت', fixed: 'ثابت' }
  return map[u] ?? u
}

export default function MakerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [maker, setMaker] = useState<MakerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [quoteOpen, setQuoteOpen] = useState(false)
  const [quoteDesc, setQuoteDesc] = useState('')
  const [quoteSending, setQuoteSending] = useState(false)
  const [quoteResult, setQuoteResult] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    api
      .getMaker(id)
      .then((data) => setMaker(data as unknown as MakerDetail))
      .catch((e) => setError(e instanceof Error ? e.message : 'خطا در بارگذاری'))
      .finally(() => setLoading(false))
  }, [id])

  const submitQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !quoteDesc.trim()) return
    setQuoteSending(true)
    setQuoteResult(null)
    try {
      await api.requestQuote({ makerId: id, description: quoteDesc.trim() })
      setQuoteResult('درخواست نقل‌قول با موفقیت ارسال شد.')
      setQuoteDesc('')
      setTimeout(() => { setQuoteOpen(false); setQuoteResult(null) }, 2000)
    } catch (e) {
      setQuoteResult(e instanceof Error ? e.message : 'خطا در ارسال')
    } finally {
      setQuoteSending(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="h-40 animate-pulse rounded-xl bg-ink-100" />
        <div className="mt-4 h-60 animate-pulse rounded-xl bg-ink-100" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          ❌ {error}
        </div>
        <Link to="/makers" className="mt-4 inline-flex rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-50">
          ← بازگشت به فهرست
        </Link>
      </div>
    )
  }

  if (!maker) return null

  const specs = parseSpecialties(maker.specialties)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-ink-400">
        <Link to="/" className="hover:text-brand-600 transition-colors">خانه</Link>
        <span>/</span>
        <Link to="/makers" className="hover:text-brand-600 transition-colors">صنعتگران</Link>
        <span>/</span>
        <span className="text-ink-600">{maker.displayName}</span>
      </nav>

      {/* Header */}
      <div className="animate-fadeInUp rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {maker.avatarUrl ? (
            <img src={maker.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
              {maker.displayName?.charAt(0) ?? '?'}
            </span>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-ink-900">{maker.displayName}</h1>
              {maker.isVerified && (
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                  ✓ تأیید شده
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-500">📍 {maker.city || '—'}</p>
            <div className="mt-2 flex items-center gap-4">
              <StarRating rating={maker.rating} />
              <span className="text-xs text-ink-400">{maker.ratingCount} امتیاز</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setQuoteOpen(true)}
            className="shrink-0 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700"
          >
            📨 درخواست نقل‌قول
          </button>
        </div>

        {maker.bio && (
          <p className="mt-4 text-sm leading-7 text-ink-600">{maker.bio}</p>
        )}

        {specs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {specs.map((s) => (
              <span key={s} className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                {s}
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-ink-400">
          عضو از {new Date(maker.createdAt).toLocaleDateString('fa-IR')}
        </p>
      </div>

      {/* Services */}
      <div className="mt-6 rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink-900">🛠️ خدمات</h2>
        <p className="mt-1 text-xs text-ink-400">{maker.services.length} خدمت</p>

        {maker.services.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-right text-xs font-semibold text-ink-500">
                  <th className="pb-2 pr-0">عنوان</th>
                  <th className="pb-2">توضیحات</th>
                  <th className="pb-2">قیمت</th>
                  <th className="pb-2">واحد</th>
                  <th className="pb-2 pl-0">مدت تحویل</th>
                </tr>
              </thead>
              <tbody>
                {maker.services.map((s) => (
                  <tr key={s.id} className="border-b border-ink-100 last:border-0">
                    <td className="py-3 pr-0 font-semibold text-ink-800">{s.title}</td>
                    <td className="max-w-[200px] truncate py-3 text-xs text-ink-500">{s.description ?? '—'}</td>
                    <td className="py-3 font-bold text-brand-700">{formatPrice(s.price)}</td>
                    <td className="py-3 text-ink-600">{unitLabel(s.unit)}</td>
                    <td className="py-3 pl-0 text-ink-600" dir="ltr">{s.leadTimeDays} روز</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-400">هنوز خدمتی ثبت نشده است.</p>
        )}
      </div>

      {/* Quote modal */}
      {quoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900">📨 درخواست نقل‌قول</h2>
              <button
                type="button"
                onClick={() => { setQuoteOpen(false); setQuoteResult(null) }}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100"
              >
                ✕
              </button>
            </div>

            {quoteResult && (
              <div className={`mb-4 rounded-lg p-3 text-sm font-medium ${
                quoteResult.includes('موفقیت')
                  ? 'border border-teal-200 bg-teal-50 text-teal-700'
                  : 'border border-rose-200 bg-rose-50 text-rose-700'
              }`}>
                {quoteResult}
              </div>
            )}

            <form onSubmit={submitQuote} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink-700">توضیحات درخواست</label>
                <textarea
                  required
                  value={quoteDesc}
                  onChange={(e) => setQuoteDesc(e.target.value)}
                  rows={4}
                  placeholder="توضیح دهید چه چیزی نیاز دارید..."
                  className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-800 placeholder:text-ink-400"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setQuoteOpen(false); setQuoteResult(null) }}
                  className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-50"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={quoteSending}
                  className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {quoteSending ? 'در حال ارسال...' : 'ارسال درخواست'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
