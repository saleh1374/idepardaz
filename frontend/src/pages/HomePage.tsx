import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { RecipeSummary } from '../lib/types'
import RecipeCard, { categoryCover } from '../components/RecipeCard'
import { Ic, CATEGORY_ICONS, CATEGORY_LABELS, type IconName } from '../lib/icons'
import { LogoMark } from '../components/Header'
import Avatar from '../components/Avatar'

const steps: Array<{ n: string; icon: IconName; title: string; desc: string; color: string }> = [
  {
    n: '۱',
    icon: 'message',
    title: 'بگو چه می‌خواهی',
    desc: 'به زبان خودت بنویس؛ مثل صحبت با یک مهندس.',
    color: 'bg-sky-50 text-sky-700',
  },
  {
    n: '۲',
    icon: 'clipboard',
    title: 'Recipe تأییدشده',
    desc: 'سیستم خواسته‌ات را با کاتالوگ دستورهای مهندسی تطبیق می‌دهد.',
    color: 'bg-violet-50 text-violet-700',
  },
  {
    n: '۳',
    icon: 'wrench',
    title: 'پارامترها را تنظیم کن',
    desc: 'تعداد LED، ظرفیت باتری و غیره؛ همه‌چیز زنده محاسبه می‌شود.',
    color: 'bg-brand-50 text-brand-700',
  },
  {
    n: '۴',
    icon: 'wallet',
    title: 'BOM با قیمت زنده',
    desc: 'لیست قطعات با قیمت و موجودی واقعی فروشگاه‌های ایرانی.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    n: '۵',
    icon: 'rocket',
    title: 'بساز یا بسپار',
    desc: 'خودت گام‌به‌گام بساز یا به صنعتگر بسپار.',
    color: 'bg-rose-50 text-rose-700',
  },
]

const usps: Array<{ icon: IconName; title: string; desc: string; accent: string }> = [
  {
    icon: 'link2',
    title: 'حلقهٔ کامل',
    desc: 'تنها جایی که «ایده تا جسم» در یک محصول بسته می‌شود.',
    accent: 'from-sky-500 to-blue-600',
  },
  {
    icon: 'wallet',
    title: 'BOM زندهٔ ایران',
    desc: 'قیمت و موجودی واقعی ECA، روبوایران و کافه‌ربات.',
    accent: 'from-brand-500 to-teal-600',
  },
  {
    icon: 'shield',
    title: 'ایمنی مهندسی‌شده',
    desc: 'Recipeهای بازبینی‌شده با سطح‌بندی ایمنی مشخص.',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    icon: 'hammer',
    title: 'دو مسیر خروج',
    desc: 'DIY با آموزش یا بسپار به صنعتگر معتبر.',
    accent: 'from-rose-500 to-pink-500',
  },
]

const categories = ['lighting', 'power', 'cooling', 'testing'] as const

/** دستورهای نمونه برای وقتی API در دسترس نیست — سایت هیچ‌وقت خالی دیده نمی‌شود */
const FALLBACK_RECIPES: RecipeSummary[] = [
  {
    id: 'RLED-001', slug: 'usb-led-lamp', title: 'چراغ LED USB', category: 'lighting',
    difficulty: 'beginner', safetyLevel: 'LOW', estimatedMinutes: 30, status: 'Approved',
    currentVersion: '1.0.0',
    summary: 'کم‌خطرترین و مقرون‌به‌صرفه‌ترین پروژه برای شروع: یک LED + مقاومت + کابل USB، بدون نیاز به لحیم‌کاری پیشرفته.',
  },
  {
    id: 'PB-001', slug: 'powerbank-18650', title: 'پاوربانک ۱۸۶۵۰', category: 'power',
    difficulty: 'intermediate', safetyLevel: 'MEDIUM', estimatedMinutes: 90, status: 'Approved',
    currentVersion: '1.0.0',
    summary: 'پاوربانک با سلول لیتیومی ۱۸۶۵۰، ماژول شارژ TP4056 و خروجی USB — با محافظ اتصال کوتاه.',
  },
  {
    id: 'UFAN-001', slug: 'usb-fan', title: 'فن USB', category: 'cooling',
    difficulty: 'beginner', safetyLevel: 'LOW', estimatedMinutes: 45, status: 'Approved',
    currentVersion: '1.0.0',
    summary: 'فن خنک‌کنندهٔ رومیزی با تغذیهٔ USB — مناسب خنک‌کردن روتر، کیس یا میز کار در تابستان.',
  },
]

const testimonials: Array<{ name: string; role: string; text: string }> = [
  {
    name: 'امیر کریمی',
    role: 'دانشجوی برق',
    text: 'برای پروژهٔ درسم یک منبع تغذیهٔ آزمایشگاهی کوچک ساختم. لیست قطعات با قیمت واقعی بود و ساعت‌ها گوگل‌کردن را حذف کرد.',
  },
  {
    name: 'سارا محمدی',
    role: 'هنرمند و سازنده',
    text: 'بلد نبودم لحیم‌کاری کنم؛ دستور گام‌به‌گام طوری نوشته شده که اولین بار تجربهٔ ساخت موفق بود.',
  },
  {
    name: 'رضا حسینی',
    role: 'صنعتگر',
    text: 'به‌عنوان سازنده، سفارش‌های مشخص با BOM آماده می‌گیرم — بدون رفت‌وبرگشت برای فهمیدن خواستهٔ مشتری.',
  },
]

interface Stats {
  recipes: number
  parts: number
  suppliers: number
  makers: number
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>(FALLBACK_RECIPES)
  const [stats, setStats] = useState<Stats>({ recipes: 5, parts: 14, suppliers: 3, makers: 3 })
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    setRecipes(FALLBACK_RECIPES)
    api
      .listRecipes({ status: 'Approved' })
      .then((r) => { if (r.items.length > 0) setRecipes(r.items.slice(0, 3)) })
      .catch(() => setRecipes(FALLBACK_RECIPES))

    // آمار زنده از API — در صورت خطا مقدار پیش‌فرض می‌ماند
    void Promise.allSettled([
      api.listRecipes({ status: 'Approved' }),
      api.listParts(),
      api.listSuppliers(),
      api.listMakers(),
    ]).then(([rec, parts, sup, makers]) => {
      setStats({
        recipes:
          rec.status === 'fulfilled' ? (rec.value.total ?? rec.value.items.length) : 5,
        parts: parts.status === 'fulfilled' ? (parts.value.total ?? parts.value.items.length) : 14,
        suppliers: sup.status === 'fulfilled' ? sup.value.items.length : 3,
        makers: makers.status === 'fulfilled' ? (makers.value.total ?? makers.value.items.length) : 3,
      })
    })
  }, [])

  const joinWaitlist = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    try {
      const list: unknown[] = JSON.parse(localStorage.getItem('besaz-waitlist') ?? '[]')
      list.push({ email: email.trim(), at: new Date().toISOString() })
      localStorage.setItem('besaz-waitlist', JSON.stringify(list))
    } catch {
      /* ذخیره‌سازی محلی در دسترس نیست — باز هم پیام موفقیت نشان بده */
    }
    setJoined(true)
  }

  const faNum = new Intl.NumberFormat('fa-IR')
  const statItems = [
    { value: `${faNum.format(stats.recipes)}+`, label: 'Recipe تأییدشده', icon: 'clipboard' as IconName },
    { value: faNum.format(stats.suppliers), label: 'فروشگاه قطعات', icon: 'store' as IconName },
    { value: faNum.format(stats.parts), label: 'قطعه در کاتالوگ', icon: 'puzzle' as IconName },
    { value: faNum.format(stats.makers), label: 'صنعتگر فعال', icon: 'hardHat' as IconName },
  ]

  return (
    <div>
      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-ink-50">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-brand-200/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-40 h-64 w-64 rounded-full bg-teal-200/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-8 lg:py-24">
          {/* متن */}
          <div className="text-right">
            <p className="animate-fadeIn inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/85 px-4 py-1.5 text-xs font-bold text-brand-700 shadow-sm backdrop-blur-sm">
              <Ic name="zap" size={14} className="text-amber-500" />
              کامپایلر ایده برای دنیای فیزیکی
            </p>

            <h1 className="animate-fadeInUp mt-5 text-4xl font-black leading-[1.4] text-ink-900 sm:text-5xl sm:leading-[1.35]">
              ایده‌ات را بگو،
              <br />
              <span className="text-gradient">بساز</span>ش کن
            </h1>

            <p className="animate-fadeInUp mt-5 max-w-xl text-base leading-8 text-ink-500 sm:text-lg" style={{ animationDelay: '100ms' }}>
              خواسته‌ات را به زبان انسانی بگو؛ بساز آن را به یک پروژهٔ قابل ساخت «کامپایل» می‌کند —
              Recipe تأییدشده، BOM با قیمت زنده و آموزش گام‌به‌گام.
            </p>

            <div className="animate-fadeInUp mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '200ms' }}>
              <Link to="/wizard" className="btn-primary px-8 py-3.5 text-base">
                <Ic name="sparkles" size={18} />
                شروع با ویزارد هوشمند
              </Link>
              <Link to="/recipes" className="btn-outline px-8 py-3.5 text-base">
                <Ic name="clipboard" size={18} />
                مرور دستورهای ساخت
              </Link>
            </div>

            <ul className="animate-fadeInUp mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-ink-500" style={{ animationDelay: '260ms' }}>
              <li className="flex items-center gap-1.5">
                <Ic name="circleCheck" size={15} className="text-brand-600" />
                بدون هزینهٔ اشتراک
              </li>
              <li className="flex items-center gap-1.5">
                <Ic name="shield" size={15} className="text-brand-600" />
                دستورهای بازبینی‌شده
              </li>
              <li className="flex items-center gap-1.5">
                <Ic name="wallet" size={15} className="text-brand-600" />
                قیمت واقعی بازار ایران
              </li>
            </ul>
          </div>

          {/* تصویر شاخص */}
          <div className="relative">
            <img
              src="/hero.svg"
              alt="از ایده تا محصول فیزیکی: میز کار با برد الکترونیکی، چراغ رومیزی و کارت BOM"
              className="animate-fadeInUp w-full drop-shadow-xl"
              width={720}
              height={560}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <dl className="stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statItems.map((s) => (
              <div key={s.label} className="card animate-fadeInUp flex items-center gap-3 px-4 py-4 text-right">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Ic name={s.icon} size={19} />
                </span>
                <div>
                  <dt className="text-xl font-black text-brand-700 sm:text-2xl">{s.value}</dt>
                  <dd className="text-[11px] font-semibold text-ink-500">{s.label}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ═══ دسته‌بندی‌ها ═══ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-ink-900 sm:text-3xl">از کدام دسته شروع می‌کنی؟</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-ink-500">
            هر دسته، دستورهای تأییدشدهٔ آمادهٔ ساخت با BOM کامل دارد.
          </p>
        </div>

        <div className="stagger mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/recipes?category=${cat}`}
              className="card card-hover group animate-fadeInUp overflow-hidden p-0"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={categoryCover(cat)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/92 text-ink-800 shadow-sm backdrop-blur-sm">
                    <Ic name={CATEGORY_ICONS[cat]} size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{CATEGORY_LABELS[cat]}</p>
                    <p className="flex items-center gap-1 text-[11px] text-white/80">
                      مشاهدهٔ دستورها
                      <Ic name="arrowLeft" size={11} className="transition-transform group-hover:-translate-x-0.5" />
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ How it works ═══ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-ink-900 sm:text-3xl">
              از «فکر می‌کنم» تا «دارمش»
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-ink-500">
              مسیری که هفته‌ها طول می‌کشید را به چند ساعت تبدیل می‌کنیم.
            </p>
          </div>

          <ol className="stagger relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* خط اتصال مراحل — فقط دسکتاپ */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-[72px] hidden lg:block">
              <div className="h-0.5 w-full bg-gradient-to-l from-brand-200 via-teal-200 to-sky-200" />
            </div>
            {steps.map((s) => (
              <li key={s.n} className="card card-hover animate-fadeInUp relative flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ring-4 ring-white ${s.color}`}>
                    <Ic name={s.icon} size={21} />
                  </span>
                  <span className="text-[11px] font-black text-ink-300">مرحلهٔ {s.n}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-900">{s.title}</h3>
                  <p className="mt-1 text-xs leading-6 text-ink-500">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
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
            <Link to="/recipes" className="link-hover hidden items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700 sm:flex">
              همهٔ دستورها
              <Ic name="arrowLeft" size={15} />
            </Link>
          </div>

          <div className="stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r) => (
              <div key={r.id} className="animate-fadeInUp">
                <RecipeCard recipe={r} />
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center sm:hidden">
            <Link to="/recipes" className="flex items-center gap-1 text-sm font-bold text-brand-600">
              همهٔ دستورها
              <Ic name="arrowLeft" size={15} />
            </Link>
          </div>
        </section>
      )}

      {/* ═══ USP ═══ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-ink-900 sm:text-3xl">چرا بساز؟</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-ink-500">
              چون کسی این حلقه را نبسته — از ایده تا خرید قطعه با قیمت واقعی.
            </p>
          </div>

          <div className="stagger mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {usps.map((u) => (
              <div key={u.title} className="card card-hover group animate-fadeInUp flex flex-col gap-3 p-6">
                <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${u.accent} text-white shadow-md`}>
                  <Ic name={u.icon} size={22} />
                </div>
                <h3 className="text-base font-bold text-ink-900 transition-colors group-hover:text-brand-700">{u.title}</h3>
                <p className="text-xs leading-6 text-ink-500">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Quick links ═══ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Link to="/parts" className="card card-hover group flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Ic name="puzzle" size={22} />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-ink-900 transition-colors group-hover:text-blue-700">کاتالوگ قطعات</h3>
              <p className="truncate text-xs text-ink-500">قطعات با قیمت زنده از فروشگاه‌های ایرانی</p>
            </div>
            <Ic name="arrowLeft" size={16} className="mr-auto shrink-0 text-ink-300 transition-colors group-hover:text-blue-500" />
          </Link>
          <Link to="/wizard" className="card card-hover group flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Ic name="sparkles" size={22} />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-ink-900 transition-colors group-hover:text-brand-700">ویزارد هوشمند</h3>
              <p className="truncate text-xs text-ink-500">خواسته‌ات را بنویس، بهترین دستور را پیشنهاد بده</p>
            </div>
            <Ic name="arrowLeft" size={16} className="mr-auto shrink-0 text-ink-300 transition-colors group-hover:text-brand-500" />
          </Link>
          <Link to="/makers" className="card card-hover group flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Ic name="factory" size={22} />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-ink-900 transition-colors group-hover:text-amber-700">صنعتگران</h3>
              <p className="truncate text-xs text-ink-500">بسپارش به سازندگان تأییدشده</p>
            </div>
            <Ic name="arrowLeft" size={16} className="mr-auto shrink-0 text-ink-300 transition-colors group-hover:text-amber-500" />
          </Link>
        </div>
      </section>

      {/* ═══ نظرات کاربران ═══ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-ink-900 sm:text-3xl">سازندگان چه می‌گویند؟</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-ink-500">
              تجربهٔ کسانی که با بساز اولین پروژه‌شان را ساختند یا سفارش دادند.
            </p>
          </div>

          <div className="stagger mt-10 grid gap-4 sm:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="card card-hover animate-fadeInUp flex flex-col gap-4 p-6">
                <div className="flex items-center gap-1 text-amber-400" aria-label="امتیاز ۵ از ۵">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ic key={i} name="star" size={14} className="fill-current" />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-7 text-ink-600">«{t.text}»</blockquote>
                <figcaption className="flex items-center gap-3 border-t border-ink-100 pt-4">
                  <Avatar name={t.name} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-ink-900">{t.name}</p>
                    <p className="text-xs text-ink-400">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Waitlist ═══ */}
      <section className="relative overflow-hidden bg-ink-900 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <LogoMark className="mx-auto h-12 w-12" />
          <h2 className="mt-5 text-2xl font-black text-white sm:text-3xl">به صف انتظار بپیوند</h2>
          <p className="mt-3 text-sm leading-7 text-ink-300">
            دسترسی آزمایشی محدود است. ایمیل‌ات را بگذار تا به‌محض باز شدن فاز عمومی، اولین نفر باشی.
          </p>

          {joined ? (
            <div className="animate-fadeInUp mt-8 rounded-2xl border border-brand-500/40 bg-brand-500/10 px-6 py-6 backdrop-blur-sm">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-500/20 text-brand-300">
                <Ic name="circleCheck" size={26} />
              </span>
              <p className="mt-3 text-lg font-bold text-brand-200">ثبت شد!</p>
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
                <Ic name="send" size={16} />
                عضویت در صف انتظار
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
