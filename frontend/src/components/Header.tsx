import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'خانه' },
  { to: '/recipes', label: 'دستورها' },
  { to: '/parts', label: 'قطعات' },
  { to: '/projects', label: 'پروژه‌ها' },
  { to: '/makers', label: 'صنعتگران' },
  { to: '/orders', label: 'سفارشات' },
  { to: '/wizard', label: 'ویزارد' },
]

const adminItems = [
  { to: '/admin', label: 'داشبورد' },
  { to: '/admin/users', label: 'کاربران' },
  { to: '/admin/recipes', label: 'دستورها' },
  { to: '/admin/orders', label: 'سفارشات' },
  { to: '/admin/audit', label: 'گزارش' },
]

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
  const [adminOpen, setAdminOpen] = useState(false)

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

          {/* Admin dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAdminOpen(!adminOpen)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-100 hover:text-ink-900 transition-colors"
            >
              ⚙️ مدیریت
            </button>
            {adminOpen && (
              <div className="absolute left-0 top-full mt-1 w-44 rounded-xl border border-ink-200 bg-white shadow-lg animate-fadeIn z-50">
                {adminItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setAdminOpen(false)}
                    className={({ isActive }) =>
                      `block px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `ml-1 grid h-8 w-8 place-items-center rounded-lg text-sm font-bold transition-colors ${
                isActive
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-ink-100 text-ink-600 hover:bg-brand-100 hover:text-brand-700'
              }`
            }
            title="پنل کاربری"
          >
            👤
          </NavLink>
        </nav>

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
          <p className="px-3 py-1 text-xs font-bold text-ink-400">مدیریت</p>
          {adminItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
        </nav>
      )}
    </header>
  )
}
