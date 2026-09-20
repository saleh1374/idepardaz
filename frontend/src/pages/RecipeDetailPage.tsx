import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { RecipeDetail } from '../lib/types'
import {
  difficultyLabel,
  formatTime,
  safetyLabel,
} from '../lib/format'
import Badge, { type Tone } from '../components/Badge'
import SafetyGate from '../components/SafetyGate'
import ParameterForm, { defaultsFromParameters, type ParamValues } from '../components/ParameterForm'
import BomPanel from '../components/BomPanel'

const safetyTone: Record<string, Tone> = {
  LOW: 'teal',
  MEDIUM: 'sky',
  HIGH: 'amber',
  CRITICAL: 'rose',
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [detail, setDetail] = useState<RecipeDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gatePassed, setGatePassed] = useState(false)
  const [params, setParams] = useState<ParamValues>({})

  useEffect(() => {
    if (!id) return
    let alive = true
    api
      .getRecipe(id)
      .then((d) => {
        if (!alive) return
        setDetail(d)
        setParams(defaultsFromParameters(d.payload.parameters))
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : 'خطا در بارگذاری')
      })
    return () => {
      alive = false
    }
  }, [id])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg font-bold text-rose-600">{error}</p>
        <Link to="/recipes" className="mt-4 inline-block text-sm font-bold text-brand-600">
          ← بازگشت به دستورها
        </Link>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="card h-64 animate-pulse" />
      </div>
    )
  }

  const payload = detail.payload
  const needsGate = detail.safetyLevel === 'HIGH' || detail.safetyLevel === 'CRITICAL'

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* سربرگ */}
      <nav className="mb-4 text-xs text-ink-400">
        <Link to="/recipes" className="hover:text-brand-600">
          دستورها
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-600">{detail.title}</span>
      </nav>

      <header className="grid gap-6 lg:grid-cols-3">
        <div className="card flex flex-col gap-4 p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-black leading-10 text-ink-900 sm:text-3xl">
              {detail.title}
            </h1>
            <Badge tone={safetyTone[detail.safetyLevel] ?? 'ink'}>
              ایمنی: {safetyLabel[detail.safetyLevel] ?? detail.safetyLevel}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge tone="ink">
              {detail.category === 'lighting' ? 'روشنایی' : detail.category === 'power' ? 'توان' : detail.category}
            </Badge>
            <Badge tone="sky">{difficultyLabel[detail.difficulty] ?? detail.difficulty}</Badge>
            <Badge tone="ink">⏱ {formatTime(detail.estimatedMinutes)}</Badge>
            <Badge tone="brand">نسخهٔ {detail.currentVersion ?? '—'}</Badge>
          </div>

          {payload.summary && (
            <p className="text-sm leading-7 text-ink-600">{payload.summary}</p>
          )}
          {payload.description && (
            <p className="text-sm leading-7 text-ink-500">{payload.description}</p>
          )}

          <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-4">
            {payload.tools?.map((t) => (
              <span key={t} className="rounded-lg bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-600">
                🛠 {t}
              </span>
            ))}
          </div>
        </div>

        {/* ایمنی */}
        {payload.safetyWarnings && payload.safetyWarnings.length > 0 && (
          <aside className="card flex flex-col gap-3 border-amber-200 bg-amber-50/50 p-5">
            <h2 className="text-sm font-extrabold text-ink-900">هشدارهای ایمنی</h2>
            <ul className="space-y-2">
              {payload.safetyWarnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-6 text-ink-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {w}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </header>

      {/* دروازهٔ ایمنی */}
      <div className="mt-8">
        <SafetyGate
          level={detail.safetyLevel}
          warnings={payload.safetyWarnings ?? []}
          onAccept={() => setGatePassed(true)}
        />
      </div>

      {/* ساخت: پارامترها + BOM */}
      <section className="mt-10">
        <h2 className="text-xl font-black text-ink-900">تنظیمات ساخت</h2>
        <p className="mt-1 text-sm text-ink-500">
          پارامترها را تنظیم کن و BOM زنده بگیر — تعداد قطعات، قیمت و موجودی به‌صورت خودکار
          محاسبه می‌شود.
        </p>

        {needsGate && !gatePassed ? null : (
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div className="card p-6 lg:col-span-2">
              <h3 className="mb-4 text-sm font-extrabold text-ink-800">پارامترهای دستور</h3>
              <ParameterForm parameters={payload.parameters} value={params} onChange={setParams} />
            </div>
            <div className="card p-6 lg:col-span-3">
              <h3 className="mb-4 text-sm font-extrabold text-ink-800">قیمت و لیست قطعات</h3>
              <BomPanel recipeId={detail.id} parameters={params} title={detail.title} />
            </div>
          </div>
        )}
      </section>

      {/* گام‌ها */}
      {payload.steps && payload.steps.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-black text-ink-900">گام‌به‌گام بساز</h2>
          <ol className="mt-6 space-y-4">
            {payload.steps.map((step) => (
              <li key={step.n} className="card flex gap-4 p-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-sm font-black text-brand-700">
                  {step.n}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-ink-900">{step.title}</h3>
                  {step.description && (
                    <p className="mt-1 text-sm leading-7 text-ink-600">{step.description}</p>
                  )}
                  {step.safety && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-800">
                      ⚠️ {step.safety}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* تست‌ها */}
      {payload.tests && payload.tests.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-black text-ink-900">تست پذیرش</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {payload.tests.map((t) => (
              <div key={t.name} className="card p-5">
                <h3 className="text-sm font-bold text-ink-800">{t.name}</h3>
                <p className="mt-1 text-xs leading-6 text-ink-500">{t.expected}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-center text-xs text-ink-400">
        لایسنس: {detail.license} · شناسه: {detail.id} · نسخه‌های ثبت‌شده: {detail.versions.map((v) => v.version).join('، ')}
      </p>
    </div>
  )
}