import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { Ic } from '../lib/icons'
import Avatar from '../components/Avatar'

interface Maker {
  id: string
  displayName: string
  bio: string | null
  specialties: string | null
  city: string | null
  avatarUrl: string | null
  isVerified: boolean
  rating: number
  ratingCount: number
  serviceCount: number
  createdAt: string
}

const cities = ['تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز', 'کرج']

function parseSpecialties(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) as string[] } catch { return [] }
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Ic key={`f${i}`} name="star" size={13} className="fill-current text-amber-400" />
      ))}
      {half && (
        <span className="relative inline-flex">
          <Ic name="star" size={13} className="text-amber-400" />
          <span className="absolute inset-0 overflow-hidden">
            <Ic name="star" size={13} className="fill-current text-amber-400 opacity-40" />
          </span>
        </span>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Ic key={`e${i}`} name="star" size={13} className="text-ink-300" />
      ))}
      <span className="mr-1 font-mono text-xs text-ink-500" dir="ltr">{rating.toFixed(1)}</span>
    </span>
  )
}

export default function MakersPage() {
  const [makers, setMakers] = useState<Maker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [city, setCity] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api
      .listMakers({ city: city || undefined, page })
      .then((data) => {
        setMakers(data.items ?? [])
        setTotal(data.total ?? 0)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'خطا در بارگذاری'))
      .finally(() => setLoading(false))
  }, [city, page])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-fadeInUp">
        <h1 className="flex items-center gap-2 text-2xl font-black text-ink-900 sm:text-3xl">
          <Ic name="factory" size={26} className="text-brand-600" />
          صنعتگران
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          فهرست صنعتگران و پیمانکاران تأییدشده برای ساخت پروژه‌های شما.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="text-sm font-semibold text-ink-700">شهر:</label>
        <select
          value={city}
          onChange={(e) => { setCity(e.target.value); setPage(1) }}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 sm:max-w-xs"
        >
          <option value="">همه شهرها</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="text-xs text-ink-400">{total} صنعتگر</span>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          <Ic name="circleX" size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-ink-100" />
            ))
          : makers.map((m) => {
              const specs = parseSpecialties(m.specialties)
              return (
                <Link
                  key={m.id}
                  to={`/makers/${m.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-ink-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-brand-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {m.avatarUrl ? (
                        <img src={m.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                      ) : (
                        <Avatar name={m.displayName} size="md" verified={m.isVerified} />
                      )}
                      <div>
                        <h3 className="text-base font-bold text-ink-900">{m.displayName}</h3>
                        <p className="flex items-center gap-1 text-xs text-ink-400">
                          <Ic name="mapPin" size={12} />
                          {m.city || '—'}
                        </p>
                      </div>
                    </div>
                    {m.isVerified && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
                        <Ic name="badgeCheck" size={12} />
                        تأیید شده
                      </span>
                    )}
                  </div>

                  {m.bio && (
                    <p className="line-clamp-2 text-xs leading-5 text-ink-500">{m.bio}</p>
                  )}

                  {specs.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-1.5">
                      {specs.slice(0, 3).map((s) => (
                        <span key={s} className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-2 text-xs text-ink-500">
                    <StarRating rating={m.rating} />
                    <span>{m.serviceCount} خدمات</span>
                  </div>
                </Link>
              )
            })}
      </div>

      {!loading && makers.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-400">
          صنعتگری یافت نشد.
        </p>
      )}

      {/* Pagination */}
      {!loading && total > 6 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-4 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-40"
          >
            <Ic name="arrowRight" size={13} />
            قبلی
          </button>
          <span className="text-sm font-semibold text-ink-600">صفحه {page}</span>
          <button
            type="button"
            disabled={makers.length < 6}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-4 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-40"
          >
            بعدی
            <Ic name="arrowLeft" size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
