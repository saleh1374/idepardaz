import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { RecipeDetail } from '../lib/types'
import { difficultyLabel, formatTime, safetyLabel } from '../lib/format'
import Badge, { type Tone } from '../components/Badge'
import SafetyGate from '../components/SafetyGate'
import ParameterForm, { defaultsFromParameters, type ParamValues } from '../components/ParameterForm'
import BomPanel from '../components/BomPanel'
import { useUser } from '../lib/UserContext'

const safetyTone: Record<string, Tone> = {
  LOW: 'teal',
  MEDIUM: 'sky',
  HIGH: 'amber',
  CRITICAL: 'rose',
}

const catLabel: Record<string, string> = {
  lighting: 'روشنایی',
  power: 'توان',
  cooling: 'خنک‌کننده',
  testing: 'تست',
}

const catIcon: Record<string, string> = {
  lighting: '💡',
  power: '⚡',
  cooling: '🌀',
  testing: '🔬',
}

const roleLabel: Record<string, string> = {
  Required: 'الزامی',
  Optional: 'اختیاری',
  Alternative: 'جایگزین',
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasRole } = useUser()
  const [detail, setDetail] = useState<RecipeDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gatePassed, setGatePassed] = useState(false)
  const [params, setParams] = useState<ParamValues>({})
  const [activeTab, setActiveTab] = useState<'build' | 'details'>('build')
  const [orderMode, setOrderMode] = useState<'none' | 'diy' | 'maker'>('none')
  const [selectedMaker, setSelectedMaker] = useState<string | null>(null)
  const [makers, setMakers] = useState<Array<{ id: string; displayName: string; city: string; rating: number; specialties: string }>>([])
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let alive = true
    setDetail(null)
    setError(null)
    setGatePassed(false)
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
    return () => { alive = false }
  }, [id])

  // بارگذاری صنعتگران
  useEffect(() => {
    api.listMakers().then(d => {
      setMakers(d.items.map((m: any) => ({
        id: m.id,
        displayName: m.displayName,
        city: m.city,
        rating: m.rating,
        specialties: m.specialties,
      })))
    }).catch(() => {})
  }, [])

  // ثبت سفارش DIY
  const submitDIYOrder = async () => {
    if (!id || !hasRole('Member', 'Guest')) {
      navigate('/profile')
      return
    }
    setOrderSubmitting(true)
    setOrderResult(null)
    try {
      // ایجاد پروژه
      const project = await api.createProject({
        recipeId: id,
        title: detail?.title ?? 'پروژه جدید',
        parametersJson: JSON.stringify(params),
      })
      setOrderResult(`✅ پروژه شما ایجاد شد! شماره پروژه: ${project.project.id}. حالا قطعات را تهیه کنید و بسازید.`)
    } catch (e) {
      setOrderResult(e instanceof Error ? e.message : 'خطا در ثبت')
    } finally {
      setOrderSubmitting(false)
    }
  }

  // ثبت سفارش صنعتگر
  const submitMakerOrder = async () => {
    if (!id || !selectedMaker || !hasRole('Member', 'Guest')) {
      navigate('/profile')
      return
    }
    setOrderSubmitting(true)
    setOrderResult(null)
    try {
      const project = await api.createProject({
        recipeId: id,
        title: detail?.title ?? 'پروژه جدید',
        parametersJson: JSON.stringify(params),
        makerId: selectedMaker,
      })
      setOrderResult(`✅ سفارش ثبت شد! شماره پروژه: ${project.project.id}. صنعتگر قطعات را تهیه کرده و می‌سازد.`)
    } catch (e) {
      setOrderResult(e instanceof Error ? e.message : 'خطا در ثبت')
    } finally {
      setOrderSubmitting(false)
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <span className="text-4xl">😔</span>
        <p className="mt-3 text-lg font-bold text-rose-600">{error}</p>
        <Link to="/recipes" className="mt-4 inline-block text-sm font-bold text-brand-600">← بازگشت به دستورها</Link>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="card h-32 animate-pulse bg-ink-100" />
        <div className="mt-4 grid gap-6 lg:grid-cols-5">
          <div className="card h-64 animate-pulse bg-ink-100 lg:col-span-2" />
          <div className="card h-64 animate-pulse bg-ink-100 lg:col-span-3" />
        </div>
      </div>
    )
  }

  const payload = detail.payload
  const needsGate = detail.safetyLevel === 'HIGH' || detail.safetyLevel === 'CRITICAL'
  const components = payload.components ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-ink-400">
        <Link to="/" className="hover:text-brand-600 transition-colors">خانه</Link>
        <span>/</span>
        <Link to="/recipes" className="hover:text-brand-600 transition-colors">دستورها</Link>
        <span>/</span>
        <span className="text-ink-600">{detail.title}</span>
      </nav>

      {/* Title + Badges */}
      <div className="mb-6 animate-fadeInUp">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{catIcon[detail.category] ?? '📋'}</span>
            <h1 className="text-2xl font-black leading-10 text-ink-900 sm:text-3xl">{detail.title}</h1>
          </div>
          <Badge tone={safetyTone[detail.safetyLevel] ?? 'ink'}>
            {safetyLabel[detail.safetyLevel] ?? detail.safetyLevel}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="ink">{catLabel[detail.category] ?? detail.category}</Badge>
          <Badge tone="sky">{difficultyLabel[detail.difficulty] ?? detail.difficulty}</Badge>
          <Badge tone="ink">⏱ {formatTime(detail.estimatedMinutes)}</Badge>
          <Badge tone="brand">نسخه {detail.currentVersion ?? '—'}</Badge>
        </div>
        {payload.summary && <p className="mt-4 text-sm leading-7 text-ink-600">{payload.summary}</p>}
        {payload.description && payload.description !== payload.summary && (
          <p className="mt-2 text-sm leading-7 text-ink-500">{payload.description}</p>
        )}
      </div>

      {/* Safety Gate */}
      <SafetyGate
        level={detail.safetyLevel}
        warnings={payload.safetyWarnings ?? []}
        onAccept={() => setGatePassed(true)}
      />

      {/* Only show build section if gate passed (or not needed) */}
      {(!needsGate || gatePassed) && (
        <>
          {/* Tabs */}
          <div className="mt-8 flex gap-1 border-b border-ink-200">
            <button
              type="button"
              onClick={() => setActiveTab('build')}
              className={`px-4 py-2.5 text-sm font-bold transition-colors ${
                activeTab === 'build'
                  ? 'border-b-2 border-brand-600 text-brand-700'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              🔧 ساخت و BOM
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2.5 text-sm font-bold transition-colors ${
                activeTab === 'details'
                  ? 'border-b-2 border-brand-600 text-brand-700'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              📋 جزئیات دستور
            </button>
          </div>

          {/* Tab: Build + BOM */}
          {activeTab === 'build' && (
            <div className="animate-fadeIn">
              {/* Build section */}
              <section className="mt-6">
                <h2 className="text-xl font-black text-ink-900">تنظیمات ساخت</h2>
                <p className="mt-1 text-sm text-ink-500">
                  پارامترها را تنظیم کن و BOM زنده بگیر — قیمت و موجودی واقعی فروشگاه‌های ایرانی.
                </p>
                <div className="mt-6 grid gap-6 lg:grid-cols-5">
                  <div className="card p-6 lg:col-span-2">
                    <h3 className="mb-4 text-sm font-extrabold text-ink-800">پارامترهای دستور</h3>
                    <ParameterForm parameters={payload.parameters} value={params} onChange={setParams} />
                  </div>
                  <div className="card p-6 lg:col-span-3">
                    <h3 className="mb-4 text-sm font-extrabold text-ink-800">لیست قطعات و قیمت</h3>
                    <BomPanel recipeId={detail.id} parameters={params} title={detail.title} />
                  </div>
                </div>
              </section>

              {/* Tools */}
              {payload.tools && payload.tools.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-lg font-black text-ink-900">ابزارهای مورد نیاز</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {payload.tools.map((t) => (
                      <span key={t} className="rounded-lg bg-ink-100 px-3 py-1.5 text-sm font-semibold text-ink-700">
                        🛠 {t}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Safety Warnings */}
              {payload.safetyWarnings && payload.safetyWarnings.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-lg font-black text-ink-900">هشدارهای ایمنی</h2>
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <ul className="space-y-2">
                      {payload.safetyWarnings.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm leading-6 text-ink-700">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* ═══════ جریان سفارش: DIY vs صنعتگر ═══════ */}
              <section className="mt-10 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-teal-50 p-6">
                <h2 className="text-xl font-black text-ink-900">🛒 چگونه بسازم؟</h2>
                <p className="mt-2 text-sm text-ink-600">
                  دو راه دارید: خودتان قطعات را بخرید و بسازید، یا به صنعتگران ما بسپارید.
                </p>

                {orderResult && (
                  <div className={`mt-4 rounded-xl p-4 text-sm font-medium ${
                    orderResult.includes('✅')
                      ? 'border border-green-200 bg-green-50 text-green-700'
                      : 'border border-rose-200 bg-rose-50 text-rose-700'
                  }`}>
                    {orderResult}
                  </div>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {/* DIY */}
                  <div
                    className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                      orderMode === 'diy'
                        ? 'border-brand-500 bg-white shadow-md'
                        : 'border-ink-200 bg-white hover:border-brand-300 hover:shadow-sm'
                    }`}
                    onClick={() => setOrderMode('diy')}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🔨</span>
                      <div>
                        <h3 className="text-base font-bold text-ink-900">خودم می‌سازم (DIY)</h3>
                        <p className="text-xs text-ink-500">قطعات را می‌خرم و با دستور می‌سازم</p>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-ink-600">
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> قیمت فقط قطعات</li>
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> آموزش گام‌به‌گام</li>
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> بدون هزینه دستمزد</li>
                    </ul>
                    {orderMode === 'diy' && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); submitDIYOrder() }}
                        disabled={orderSubmitting}
                        className="mt-4 w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
                      >
                        {orderSubmitting ? 'در حال ثبت...' : '🔨 شروع ساخت'}
                      </button>
                    )}
                  </div>

                  {/* Maker */}
                  <div
                    className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                      orderMode === 'maker'
                        ? 'border-teal-500 bg-white shadow-md'
                        : 'border-ink-200 bg-white hover:border-teal-300 hover:shadow-sm'
                    }`}
                    onClick={() => setOrderMode('maker')}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🏭</span>
                      <div>
                        <h3 className="text-base font-bold text-ink-900">صنعتگر بسازد</h3>
                        <p className="text-xs text-ink-500">قطعات و ساخت را به صنعتگر بسپارید</p>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-ink-600">
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> قطعات + دستمزد + ارسال</li>
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> تحویل آماده</li>
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> ضمانت کیفیت</li>
                    </ul>
                    {orderMode === 'maker' && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-ink-700">صنعتگر را انتخاب کنید:</label>
                          <select
                            value={selectedMaker ?? ''}
                            onChange={e => setSelectedMaker(e.target.value || null)}
                            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
                          >
                            <option value="">انتخاب صنعتگر...</option>
                            {makers.map(m => (
                              <option key={m.id} value={m.id}>{m.displayName} ({m.city}) — ⭐ {m.rating.toFixed(1)}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); submitMakerOrder() }}
                          disabled={orderSubmitting || !selectedMaker}
                          className="w-full rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
                        >
                          {orderSubmitting ? 'در حال ثبت...' : '🏭 ثبت سفارش'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* قیمت تخمینی */}
                {orderMode === 'maker' && (
                  <div className="mt-4 rounded-xl bg-white p-4 text-sm">
                    <h4 className="font-bold text-ink-800">💰 تخمین قیمت نهایی</h4>
                    <div className="mt-2 space-y-1 text-ink-600">
                      <div className="flex justify-between"><span>قطعات (تخمینی)</span><span className="font-semibold">— تومان</span></div>
                      <div className="flex justify-between"><span>دستمزد صنعتگر</span><span className="font-semibold">— تومان</span></div>
                      <div className="flex justify-between"><span>هزینه ارسال</span><span className="font-semibold">— تومان</span></div>
                      <div className="border-t border-ink-200 pt-2 font-bold text-brand-700">
                        <div className="flex justify-between"><span>جمع کل</span><span>پس از BOM مشخص می‌شود</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Tab: Details */}
          {activeTab === 'details' && (
            <div className="animate-fadeIn mt-6 space-y-8">
              {/* Components */}
              {components.length > 0 && (
                <section>
                  <h2 className="text-lg font-black text-ink-900">قطعات مورد نیاز</h2>
                  <p className="mt-1 text-sm text-ink-500">لیست منطقی قطعات — قیمت واقعی در مرحلهٔ BOM محاسبه می‌شود.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {components.map((c) => (
                      <div key={c.logicalPartId} className="card flex items-start gap-3 p-4">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
                          {c.role === 'Required' ? '●' : '○'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-ink-800">{c.logicalPartId}</p>
                            <Badge tone={c.role === 'Required' ? 'brand' : 'ink'}>
                              {roleLabel[c.role] ?? c.role}
                            </Badge>
                          </div>
                          {c.qtyFormula && (
                            <p className="mt-1 text-xs text-ink-500" dir="ltr">
                              qty: {c.qtyFormula}
                            </p>
                          )}
                          {c.alternatives && c.alternatives.length > 0 && (
                            <p className="mt-1 text-xs text-ink-400">
                              جایگزین: {c.alternatives.join('، ')}
                            </p>
                          )}
                          {c.notes && (
                            <p className="mt-1 text-xs leading-5 text-ink-500">{c.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Skills */}
              {payload.skills && payload.skills.length > 0 && (
                <section>
                  <h2 className="text-lg font-black text-ink-900">مهارت‌های مورد نیاز</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {payload.skills.map((s) => (
                      <span key={s} className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">
                        ✅ {s}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Steps */}
              {payload.steps && payload.steps.length > 0 && (
                <section>
                  <h2 className="text-xl font-black text-ink-900">گام‌به‌گام بساز</h2>
                  <ol className="mt-4 space-y-3">
                    {payload.steps.map((step) => (
                      <li key={step.n} className="card flex gap-4 p-5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-sm font-black text-brand-700">
                          {step.n}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-ink-900">{step.title}</h3>
                          {step.description && (
                            <p className="mt-1 text-sm leading-7 text-ink-600">{step.description}</p>
                          )}
                          {step.safety && (
                            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                              <p className="text-xs leading-6 text-amber-800">⚠️ {step.safety}</p>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Tests */}
              {payload.tests && payload.tests.length > 0 && (
                <section>
                  <h2 className="text-lg font-black text-ink-900">تست پذیرش</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {payload.tests.map((t) => (
                      <div key={t.name} className="card p-4">
                        <h3 className="text-sm font-bold text-ink-800">{t.name}</h3>
                        <p className="mt-1 text-xs leading-5 text-ink-500">{t.expected}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {/* Footer info */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-4 text-xs text-ink-400">
        <span>
          لایسنس: {payload.license ?? '—'} · شناسه: {detail.id}
        </span>
        <span>
          نسخه‌ها: {detail.versions.map((v) => v.version).join('، ')}
        </span>
      </div>
    </div>
  )
}
