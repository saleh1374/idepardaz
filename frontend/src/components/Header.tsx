import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useUser, ROLE_LABELS, ROLE_ICONS } from '../lib/UserContext'
import { Ic } from '../lib/icons'

/** آیتم‌های ناوبری برای هر رول */
const navByRole: Record<string, Array<{ to: string; label: string }>> = {
  Guest: [
    { to: '/', label: 'خانه' },
    { to: '/recipes', label: 'دستورها' },
    { to: '/parts', label: 'قطعات' },
    { to: '/makers', label: 'صنعتگران' },
    { to: '/wizard', label: 'ویزارد' },
  ],
  Member: [
    { to: '/', label: 'خانه' },
    { to: '/recipes', label: 'دستورها' },
    { to: '/projects', label: 'پروژه‌ها' },
    { to: '/makers', label: 'صنعتگران' },
    { to: '/wizard', label: 'ویزارد' },
  ],
  Engineer: [
    { to: '/', label: 'خانه' },
    { to: '/recipes', label: 'دستورها' },
    { to: '/parts', label: 'قطعات' },
    { to: '/projects', label: 'پروژه‌ها' },
    { to: '/wizard', label: 'ویزارد' },
  ],
  SafetyReviewer: [
    { to: '/', label: 'خانه' },
    { to: '/recipes', label: 'دستورها' },
    { to: '/projects', label: 'پروژه‌ها' },
  ],
  Supplier: [
    { to: '/', label: 'خانه' },
    { to: '/supplier/dashboard', label: 'داشبورد' },
    { to: '/supplier/products', label: 'محصولات من' },
    { to: '/supplier/orders', label: 'سفارشات دریافتی' },
  ],
  Maker: [
    { to: '/', label: 'خانه' },
    { to: '/maker/dashboard', label: 'داشبورد' },
    { to: '/maker/jobs', label: 'کارهای من' },
    { to: '/maker/services', label: 'خدمات من' },
  ],
  Admin: [
    { to: '/', label: 'خانه' },
    { to: '/recipes', label: 'دستورها' },
    { to: '/parts', label: 'قطعات' },
    { to: '/admin', label: 'داشبورد' },
    { to: '/admin/users', label: 'کاربران' },
    { to: '/admin/recipes', label: 'دستورها' },
    { to: '/admin/orders', label: 'سفارشات' },
    { to: '/admin/suppliers', label: 'تأمین‌کنندگان' },
    { to: '/admin/audit', label: 'گزارش' },
  ],
}

/** نشان برند بساز — همان مارک favicon */
export function LogoMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="besaz-mark" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" fill="url(#besaz-mark)" />
      <path d="M56 16 L30 56 h18 l-8 30 l32 -44 H52 z" fill="#ffffff" />
      <circle cx="76" cy="74" r="6" fill="#fde68a" />
    </svg>
  )
}

function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5">
      <LogoMark className="h-9 w-9" />
      <span className="leading-tight">
        <span className="block text-lg font-extrabold text-ink-900">بساز</span>
        <span className="flex items-center gap-1 text-[11px] font-medium text-ink-400">
          ایده
          <Ic name="arrowLeft" size={11} className="inline-block" />
          محصول فیزیکی
        </span>
      </span>
    </Link>
  )
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useUser()
  const navItems = navByRole[user.role] ?? navByRole.Guest
  const isAuthed = user.role !== 'Guest'

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side: user info / auth buttons */}
        <div className="hidden items-center gap-2 sm:flex">
          {/* نقش کاربر — فقط نمایش */}
          <span className="flex items-center gap-1.5 rounded-lg bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-600">
            <Ic name={ROLE_ICONS[user.role]} size={14} className="text-brand-600" />
            <span className="hidden lg:inline">{ROLE_LABELS[user.role]}</span>
          </span>

          {isAuthed && (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `grid h-8 w-8 place-items-center rounded-lg text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-ink-100 text-ink-600 hover:bg-brand-100 hover:text-brand-700'
                  }`
                }
                title="پنل کاربری"
                aria-label="پنل کاربری"
              >
                {user.name.charAt(0)}
              </NavLink>
              <button
                type="button"
                onClick={logout}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                title="خروج"
                aria-label="خروج از حساب"
              >
                <Ic name="logout" size={16} />
              </button>
            </>
          )}

          {!isAuthed && (
            <>
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:bg-ink-100"
              >
                <Ic name="login" size={14} />
                ورود
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
              >
                <Ic name="userPlus" size={14} />
                ثبت‌نام
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="grid h-10 w-10 place-items-center rounded-lg text-ink-600 hover:bg-ink-100 sm:hidden"
          aria-label={mobileOpen ? 'بستن منو' : 'باز کردن منو'}
          aria-expanded={mobileOpen}
        >
          <Ic name={mobileOpen ? 'close' : 'menu'} size={20} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="animate-fadeIn border-t border-ink-100 bg-white px-4 py-3 sm:hidden">
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-100 text-brand-700">
              <Ic name={ROLE_ICONS[user.role]} size={16} />
            </span>
            <div>
              <div className="text-xs font-bold text-ink-700">{ROLE_LABELS[user.role]}</div>
              <div className="text-[10px] text-ink-400">{user.name}</div>
            </div>
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          {isAuthed && (
            <>
              <div className="my-2 border-t border-ink-100" />
              <NavLink
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                  }`
                }
              >
                <Ic name="userRound" size={16} />
                پنل کاربری
              </NavLink>
              <button
                type="button"
                onClick={() => { logout(); setMobileOpen(false) }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-right text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                <Ic name="logout" size={16} />
                خروج
              </button>
            </>
          )}

          {!isAuthed && (
            <div className="mt-2 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink-100 px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-200"
              >
                <Ic name="login" size={15} />
                ورود
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
              >
                <Ic name="userPlus" size={15} />
                ثبت‌نام
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  )
}
