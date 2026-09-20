import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { RecipeSummary } from '../lib/types'
import RecipeCard from '../components/RecipeCard'

const steps = [
  {
    n: '۱',
    icon: '💬',
    title: 'بگو چه می‌خواهی',
    desc: 'به زبان خودت بنویس؛ مثل صحبت با یک مهندس.',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    n: '۲',
    icon: '📋',
    title: 'Recipe تأییدشده',
    desc: 'سیستم خواسته‌ات را با کاتالوگ دستورهای مهندسی تطبیق می‌دهد.',
    color: 'bg-purple-50 text-purple-700',
  },
  {
    n: '۳',
    icon: '🔧',
    title: 'پارامترها را تنظیم کن',
    desc: 'تعداد LED، ظرفیت باتری و غیره؛ همه‌چیز زنده محاسبه می‌شود.',
    color: 'bg-brand-50 text-brand-700',
  },
  {
    n: '۴',
    icon: '💰',
    title: 'BOM با قیمت زنده',
    desc: 'لیست قطعات با قیمت و موجودی واقعی فروشگاه‌های ایرانی.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    n: '۵',
    icon: '🚀',
    title: 'بساز یا بسپار',
    desc: 'خودت گام‌به‌گام بساز یا به صنعتگر بسپار.',
    color: 'bg-rose-50 text-rose-700',
  },
]

const usps = [
  {
    icon: '🔗',
    title: 'حلقهٔ کامل',
    desc: 'تنها جایی که «ایده تا جسم» در یک محصول بسته می‌شود.',
    accent: 'from-blue-500 to-blue-600',
  },
  {
    icon: '🇮🇷',
    title: 'BOM زندهٔ ایران',
    desc: 'قیمت و موجودی واقعی ECA، روبوایران و کافه‌ربات.',
    accent: 'from-brand-500 to-teal-600',
  },
  {
    icon: '🛡️',
    title: 'ایمنی مهندسی‌شده',
    desc: 'Recipeهای بازبینی‌شده با سطح‌بندی ایمنی مشخص.',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    icon: '🚀',
    title: 'دو مسیر خروج',
    desc: 'DIY با آموزش یا بسپار به صنعتگر معتبر.',
    accent: 'from-rose-500 to-pink-500',
  },
]

const stats = [
  { value: '۲+', label: 'Recipe تأییدشده', icon: '📋' },
  { value: '۳', label: 'فروشگاه قطعات', icon: '🏪' },
  { value: '۱۴', label: 'قطعه در کاتالوگ', icon: '🧩' },
  { value: '۰', label: 'هزینهٔ ابهام', icon: '✨' },
]

export default function HomePage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    api
      .listRecipes({ status: 'Approved' })
      .then((r) => setRecipes(r.items.slice(0, 3)))
      .catch(() => setRecipes([]))
  }, [])

  const joinWaitlist = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    const list: unknown[] = JSON.parse(localStorage.getItem('besaz-waitlist') ?? '[]')
    list.push({ email: email.trim(), at: new Date().toISOString() })
    localStorage.setItem('besaz-waitlist', JSON.stringify(list))
    setJoined(true)
  }

  return (
    <div>
      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-ink-50">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-brand-200/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-40 h-64 w-64 rounded-full bg-teal-200/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="animate-fadeIn mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-4 py-1.5 text-xs font-bold text-brand-700 shadow-sm backdrop-blur-sm">
            <span className="animate-pulse-soft">⚡</span> کامپایلر ایده برای دنیای فیزیکی
          </p>

          <h1 className="animate-fadeInUp mx-auto max-w-3xl text-4xl font-black leading-[1.35] text-ink-900 sm:text-5xl sm:leading-[1.3]">
            ایده‌ات را بگو،
            <br />
            <span className="text-gradient">بساز</span>
          </h1>

          <p className="animate-fadeInUp mx-auto mt-5 max-w-2xl text-base leading-8 text-ink-500 sm:text-lg" style={{ animationDelay: '100ms' }}>
            خواسته‌ات را به زبان انسانی بگو؛ بساز آن را به یک پروژهٔ قابل ساخت «کامپایل» می‌کند —
            Recipe تأییدشده، BOM با قیمت زنده، و آموزش گام‌به‌گام.
          </p>

          <div className="animate-fadeInUp mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '200ms' }}>
            <Link to="/wizard" className="btn-primary px-8 py-3.5 text-base">
              ✨ شروع با ویزارد هوشمند
            </Link>
            <Link to="/recipes" className="btn-outline px-8 py-3.5 text-base">
              مرور دستورهای ساخت
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-fadeInUp stagger mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: '300ms' }}>
            {stats.map((s) => (
              <div key={s.label} className="card animate-fadeInUp px-4 py-5 text-center">
                <span className="text-xl">{s.icon}</span>
                <dt className="mt-1 text-2xl font-black text-brand-700 sm:text-3xl">{s.value}</dt>
                <dd className="mt-1 text-xs font-semibold text-ink-500">{s.label}</dd>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How it works ═══ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-ink-900 sm:text-3xl">
            از «فکر می‌کنم» تا «دارمش»
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-ink-500">
            مسیری که هفته‌ها طول می‌کشید را به چند ساعت تبدیل می‌کنیم.
          </p>
        </div>

        <ol className="stagger mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s) => (
            <li key={s.n} className="card card-hover animate-fadeInUp flex flex-col gap-3 p-5">
              <span className={`grid h-11 w-11 place-items-center rounded-xl text-lg ${s.color}`}>
                {s.icon}
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink-900">{s.title}</h3>
                <p className="mt-1 text-xs leading-6 text-ink-500">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ═══ USP ═══ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-ink-900 sm:text-3xl">
              چرا بساز؟
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-ink-500">
              چون کسی این حلقه را نبسته — از ایده تا خرید قطعه با قیمت واقعی.
            </p>
          </div>

          <div className="stagger mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {usps.map((u) => (
              <div key={u.title} className="card card-hover animate-fadeInUp group flex flex-col gap-3 p-6">
                <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${u.accent} text-xl text-white shadow-md`}>
                  {u.icon}
                </div>
                <h3 className="text-base font-bold text-ink-900 group-hover:text-brand-700 transition-colors">{u.title}</h3>
                <p className="text-xs leading-6 text-ink-500">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Featured recipes ═══ */}
      {recipes.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black text-ink-900 sm:text-3xl">دستورهای ویژه</h2>
              <p className="mt-2 text-sm text-ink-500">نسخه‌های تأییدشده و آمادهٔ ساخت</p>
            </div>
            <Link to="/recipes" className="hidden text-sm font-bold text-brand-600 hover:text-brand-700 sm:block link-hover">
              همهٔ دستورها ←
            </Link>
          </div>

          <div className="stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r) => (
              <div key={r.id} className="animate-fadeInUp">
                <RecipeCard recipe={r} />
              </div>
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link to="/recipes" className="text-sm font-bold text-brand-600">
              همهٔ دستورها ←
            </Link>
          </div>
        </section>
      )}

      {/* ═══ Quick links ═══ */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Link to="/parts" className="card card-hover group flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-xl">🧩</span>
            <div>
              <h3 className="text-sm font-bold text-ink-900 group-hover:text-blue-700 transition-colors">کاتالوگ قطعات</h3>
              <p className="text-xs text-ink-500">۱۴ قطعه با قیمت زنده از ۳ فروشگاه</p>
            </div>
            <span className="mr-auto text-ink-300 group-hover:text-blue-500 transition-colors">←</span>
          </Link>
          <Link to="/wizard" className="card card-hover group flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-xl">✨</span>
            <div>
              <h3 className="text-sm font-bold text-ink-900 group-hover:text-brand-700 transition-colors">ویزارد هوشمند</h3>
              <p className="text-xs text-ink-500">خواسته‌ات را بنویس، بهترین دستور را پیشنهاد بده</p>
            </div>
            <span className="mr-auto text-ink-300 group-hover:text-brand-500 transition-colors">←</span>
          </Link>
          <Link to="/recipes" className="card card-hover group flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-xl">📋</span>
            <div>
              <h3 className="text-sm font-bold text-ink-900 group-hover:text-amber-700 transition-colors">دستورهای ساخت</h3>
              <p className="text-xs text-ink-500">مرور همهٔ دستورهای تأییدشده</p>
            </div>
            <span className="mr-auto text-ink-300 group-hover:text-amber-500 transition-colors">←</span>
          </Link>
        </div>
      </section>

      {/* ═══ Waitlist ═══ */}
      <section className="relative overflow-hidden bg-ink-900 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-black text-white sm:text-3xl">به صف انتظار بپیوند</h2>
          <p className="mt-3 text-sm leading-7 text-ink-300">
            دسترسی آزمایشی محدود است. ایمیل‌ات را بگذار تا به‌محض باز شدن فاز عمومی، اولین نفر باشی.
          </p>

          {joined ? (
            <div className="animate-fadeInUp mt-8 rounded-2xl border border-brand-500/40 bg-brand-500/10 px-6 py-6 text-brand-200 backdrop-blur-sm">
              <p className="text-lg font-bold">✅ ثبت شد!</p>
              <p className="mt-1 text-sm text-brand-100">
                ایمیلت را نگه می‌داریم؛ خبر فاز عمومی اول به تو می‌رسد.
              </p>
            </div>
          ) : (
            <form
              onSubmit={joinWaitlist}
              className="animate-fadeInUp mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
            >
              <input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-ink-700 bg-ink-800 px-4 py-3 text-sm text-white placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 sm:w-80"
              />
              <button type="submit" className="btn-primary px-7 py-3">
                عضویت در صف انتظار
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
