import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { RecipeSummary } from '../lib/types'
import RecipeCard from '../components/RecipeCard'

const steps = [
  {
    n: '۱',
    title: 'بگو چه می‌خواهی بسازی',
    desc: 'به زبان خودت؛ مثل صحبت با یک مهندس.',
  },
  {
    n: '۲',
    title: 'Recipe تأییدشده بگیر',
    desc: 'سیستم خواسته‌ات را با کاتالوگ دستورهای تأییدشده تطبیق می‌دهد.',
  },
  {
    n: '۳',
    title: 'پارامترها را تنظیم کن',
    desc: 'مثلاً تعداد LED یا ظرفیت پاوربانک؛ همه‌چیز به‌صورت زنده محاسبه می‌شود.',
  },
  {
    n: '۴',
    title: 'BOM با قیمت زندهٔ ایران',
    desc: 'لیست قطعات با cheapest موجود از ECA، روبوایران و کافه‌ربات.',
  },
  {
    n: '۵',
    title: 'بساز یا بسپار',
    desc: 'خودت گام‌به‌گام بساز، یا سفارش ساخت را به صنعتگر بسپار.',
  },
]

const usps = [
  {
    icon: '🔗',
    title: 'حلقهٔ کامل',
    desc: 'تنها جایی که «ایده تا جسم» در یک محصول بسته می‌شود؛ هیچ رقیبی مثل این ندارد.',
  },
  {
    icon: '🇮🇷',
    title: 'BOM زندهٔ ایران',
    desc: 'قیمت و موجودی واقعی فروشگاه‌های ایرانی در لحظهٔ تصمیم خرید، نه مثال‌های خیالی.',
  },
  {
    icon: '🛡️',
    title: 'ایمنی مهندسی‌شده',
    desc: 'Recipeهای بازبینی توسط مهندس، نه خروجی خام AI. سطح‌بندی ایمنی مشخص.',
  },
  {
    icon: '🚀',
    title: 'دو مسیر خروج',
    desc: 'DIY با آموزش گام‌به‌گام، یا بسپار به صنعتگر. هفته‌ها سرگردانی → چند ساعت.',
  },
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
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-ink-50">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-xs font-bold text-brand-700 shadow-sm">
            ⚡ کامپایلر ایده برای دنیای فیزیکی
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-black leading-[1.35] text-ink-900 sm:text-5xl sm:leading-[1.3]">
            ایده‌ات را بگو،
            <span className="bg-gradient-to-l from-brand-600 to-teal-600 bg-clip-text text-transparent">
              {' '}
              بساز
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-ink-500 sm:text-lg">
            خواسته‌ات را به زبان انسانی بگو؛ بساز آن را به یک پروژهٔ قابل ساخت «کامپایل» می‌کند —
            Recipe تأییدشده، BOM با قیمت زندهٔ فروشگاه‌های ایرانی، و آموزش گام‌به‌گام.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/wizard" className="btn-primary px-7 py-3 text-base">
              ✨ شروع با ویزارد هوشمند
            </Link>
            <Link to="/recipes" className="btn-outline px-7 py-3 text-base">
              مرور دستورهای ساخت
            </Link>
          </div>

          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4">
            {[
              ['۲+', 'Recipe تأییدشده'],
              ['۳', 'فروشگاه قطعات زنده'],
              ['۰', 'هزینهٔ ابهام'],
            ].map(([num, label]) => (
              <div key={label} className="card px-4 py-5">
                <dt className="text-2xl font-black text-brand-700 sm:text-3xl">{num}</dt>
                <dd className="mt-1 text-xs font-semibold text-ink-500 sm:text-sm">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-black text-ink-900 sm:text-3xl">
          از «فکر می‌کنم» تا «دارمش»
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-7 text-ink-500">
          مسیری که هفته‌ها طول می‌کشید را به چند ساعت تبدیل می‌کنیم — با قیمت واقعی و ایمنی
          مهندسی‌شده.
        </p>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s) => (
            <li key={s.n} className="card flex flex-col gap-2 p-5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-100 text-lg font-black text-brand-700">
                {s.n}
              </span>
              <h3 className="text-sm font-bold text-ink-900">{s.title}</h3>
              <p className="text-xs leading-6 text-ink-500">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* USP */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-black text-ink-900 sm:text-3xl">
            چرا بساز؟ چون کسی این حلقه را نبسته
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {usps.map((u) => (
              <div key={u.title} className="card card-hover flex flex-col gap-2 p-6">
                <span className="text-2xl">{u.icon}</span>
                <h3 className="text-base font-bold text-ink-900">{u.title}</h3>
                <p className="text-xs leading-6 text-ink-500">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured recipes */}
      {recipes.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black text-ink-900 sm:text-3xl">دستورهای ویژه</h2>
              <p className="mt-2 text-sm text-ink-500">نسخه‌های تأییدشده و آمادهٔ ساخت</p>
            </div>
            <Link to="/recipes" className="hidden text-sm font-bold text-brand-600 hover:text-brand-700 sm:block">
              همهٔ دستورها ←
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </section>
      )}

      {/* Waitlist */}
      <section className="relative overflow-hidden bg-ink-900 py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-black text-white sm:text-3xl">به صف انتظار بپیوند</h2>
          <p className="mt-3 text-sm leading-7 text-ink-300">
            دسترسی آزمایشی محدود است. ایمیل‌ات را بگذار تا به‌محض باز شدن فاز عمومی، اولین نفر
            باشی — همراه با کالکشن دستورهای پاداش.
          </p>

          {joined ? (
            <div className="mt-8 rounded-2xl border border-brand-500/40 bg-brand-500/10 px-6 py-6 text-brand-200">
              <p className="text-lg font-bold">✅ ثبت شد!</p>
              <p className="mt-1 text-sm text-brand-100">
                ایمیلت را نگه می‌داریم؛ خبر فاز عمومی اول به تو می‌رسد.
              </p>
            </div>
          ) : (
            <form
              onSubmit={joinWaitlist}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
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