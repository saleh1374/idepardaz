import { Link } from 'react-router-dom'
import { Ic } from '../lib/icons'
import { LogoMark } from './Header'

const quickLinks = [
  { to: '/', label: 'خانه', icon: 'home' },
  { to: '/recipes', label: 'دستورهای ساخت', icon: 'clipboard' },
  { to: '/parts', label: 'کاتالوگ قطعات', icon: 'puzzle' },
  { to: '/makers', label: 'صنعتگران', icon: 'factory' },
  { to: '/wizard', label: 'ویزارد هوشمند', icon: 'sparkles' },
  { to: '/profile', label: 'پنل کاربری', icon: 'userRound' },
]

const usps = [
  { text: 'حلقهٔ کامل: ایده تا جسم', icon: 'link2' },
  { text: 'BOM زندهٔ ایران', icon: 'wallet' },
  { text: 'ایمنی مهندسی‌شده', icon: 'shield' },
  { text: 'ساخت خودت یا بسپار به صنعتگر', icon: 'hammer' },
]

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-800 bg-ink-900 text-ink-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="text-lg font-extrabold text-white">بساز</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-ink-400">
            کامپایلر ایده برای دنیای فیزیکی. خواسته‌ات را به زبان خودت بگو؛ ما آن را به یک پروژهٔ
            قابل ساخت تبدیل می‌کنیم — از Recipe تأییدشده تا سفارش قطعه.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-800/60 px-3 py-2">
            <Ic name="mapPin" size={15} className="shrink-0 text-brand-400" />
            <span className="text-xs text-ink-400">ساخته‌شده برای سازندگان ایرانی</span>
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Ic name="folder" size={15} className="text-brand-400" />
            دسترسی سریع
          </h3>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {quickLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="flex items-center gap-2 text-ink-400 transition-colors hover:text-white"
                >
                  <Ic name={l.icon} size={14} className="text-ink-500 transition-colors group-hover:text-brand-400" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Ic name="sparkles" size={15} className="text-brand-400" />
            تفاوت بساز
          </h3>
          <ul className="mt-3 space-y-2.5 text-sm text-ink-400">
            {usps.map((u) => (
              <li key={u.text} className="flex items-start gap-2">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-brand-500/15 text-brand-400">
                  <Ic name={u.icon} size={12} />
                </span>
                {u.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-800 py-5 text-center text-xs text-ink-500">
        MVP بساز — Modular Monolith (ASP.NET Core) + React — نسخهٔ پیش‌آزمایشی
        <span className="mx-2">·</span>
        <Link to="/terms" className="text-ink-400 transition-colors hover:text-white">
          شرایط استفاده
        </Link>
      </div>
    </footer>
  )
}
