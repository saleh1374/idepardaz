import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useUser, ROLE_LABELS, ROLE_ICONS } from '../lib/UserContext'

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

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 text-xl font-extrabold text-white shadow-md shadow-brand-500/30">
        ب
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-extrabold text-ink-900">بساز</span>
        <span className="block text-[11px] font-medium text-ink-400">ایده ← محصول فیزیکی</span>
      </span>
    </Link>
  )
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useUser()
  const navItems = navByRole[user.role] ?? navByRole.Guest

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/80 backdrop-blur-md">
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
          {/* نقش کاربر — فقط نمایش (غیرقابل کلیک) */}
          <span className="flex items-center gap-1.5 rounded-lg bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-600">
            <span>{ROLE_ICONS[user.role]}</span>
            <span className="hidden lg:inline">{ROLE_LABELS[user.role]}</span>
          </span>

          {user.role !== 'Guest' && (
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
              >
                {user.name.charAt(0)}
              </NavLink>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg px-2 py-1.5 text-xs text-ink-400 hover:bg-ink-100 hover:text-ink-600"
                title="خروج"
              >
                🚪
              </button>
            </>
          )}

          {user.role === 'Guest' && (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-100"
              >
                🔐 ورود
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
              >
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
          aria-label="منو"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? (
              <>
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </>
            ) : (
              <>
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="animate-fadeIn border-t border-ink-100 bg-white px-4 py-3 sm:hidden">
          {/* نمایش نقش کاربر */}
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2">
            <span className="text-lg">{ROLE_ICONS[user.role]}</span>
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
          <div className="my-2 border-t border-ink-100" />
          <NavLink
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              }`
            }
          >
            👤 پنل کاربری
          </NavLink>
          {user.role !== 'Guest' && (
            <button
              type="button"
              onClick={() => { logout(); setMobileOpen(false) }}
              className="block w-full rounded-lg px-3 py-2.5 text-right text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              🚪 خروج
            </button>
          )}
          {user.role === 'Guest' && (
            <div className="flex gap-2 mt-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-lg bg-ink-100 px-3 py-2.5 text-center text-sm font-semibold text-ink-700 hover:bg-ink-200"
              >
                🔐 ورود
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-lg bg-brand-500 px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-600"
              >
                ثبت‌نام
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  )
}
