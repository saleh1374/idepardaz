import { Link } from 'react-router-dom'

const usps = ['حلقهٔ کامل: ایده تا جسم', 'BOM زندهٔ ایران', 'ایمنی مهندسی‌شده', 'ساخت خودت یا بسپار به صنعتگر']

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-800 bg-ink-900 text-ink-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-teal-600 text-lg font-extrabold text-white">
              ب
            </span>
            <span className="text-lg font-extrabold text-white">بساز</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-ink-400">
            کامپایلر ایده برای دنیای فیزیکی. خواسته‌ات را به زبان خودت بگو؛ ما آن را به یک پروژهٔ
            قابل ساخت تبدیل می‌کنیم — از Recipe تأییدشده تا سفارش قطعه.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white">دسترسی سریع</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/" className="text-ink-400 transition-colors hover:text-white">
                خانه
              </Link>
            </li>
            <li>
              <Link to="/recipes" className="text-ink-400 transition-colors hover:text-white">
                دستورهای ساخت
              </Link>
            </li>
            <li>
              <Link to="/parts" className="text-ink-400 transition-colors hover:text-white">
                کاتالوگ قطعات
              </Link>
            </li>
            <li>
              <Link to="/wizard" className="text-ink-400 transition-colors hover:text-white">
                ویزارد هوشمند
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white">تفاوت بساز</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-400">
            {usps.map((usp) => (
              <li key={usp} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                {usp}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-800 py-5 text-center text-xs text-ink-500">
        MVP بساز — Modular Monolith (ASP.NET Core) + React — نسخهٔ پیش‌آزمایشی
      </div>
    </footer>
  )
}
