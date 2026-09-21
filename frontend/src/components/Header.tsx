import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useUser, ROLE_LABELS, ROLE_ICONS, type UserRole } from '../lib/UserContext'

/** آیتم‌های ناوبری برای هر رول */
const navByRole: Record<UserRole, Array<{ to: string; label: string; icon?: string }>> = {
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
    { to: '/parts', label: 'قطعات' },
    { to: '/projects', label: 'پروژه‌ها' },
    { to: '/orders', label: 'سفارشات' },
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

function RoleSwitcher({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useUser()
  const navigate = useNavigate()

  const roles: UserRole[] = ['Guest', 'Member', 'Maker', 'Supplier', 'Admin']

  const handleSwitch = (role: UserRole) => {
    // در MVP، کاربر فرضی با نقش انتخاب‌شده
    setUser({
      id: role === 'Guest' ? '00000000-0000-0000-0000-000000000004' : '00000000-0000-0000-0000-000000000001',
      name: role === 'Guest' ? 'کاربر مهمان' : `${ROLE_LABELS[role]} نمونه`,
      role,
    })
    onClose()
    navigate('/')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">انتخاب نقش (نسخهٔ نمایشی)</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100">✕</button>
        </div>
        <p className="mb-4 text-xs text-ink-400">
          برای تست، نقش کاربر را عوض کنید. در نسخهٔ نهایی با ورود واقعی تعیین می‌شود.
        </p>
        <div className="space-y-2">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleSwitch(r)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right transition-all ${
                user.role === r
                  ? 'border-2 border-brand-500 bg-brand-50 text-brand-700'
                  : 'border border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50'
              }`}
            >
              <span className="text-xl">{ROLE_ICONS[r]}</span>
              <div className="flex-1">
                <div className="text-sm font-bold">{ROLE_LABELS[r]}</div>
                <div className="text-[11px] text-ink-400">
                  {r === 'Guest' && 'مشاهده عمومی'}
                  {r === 'Member' && 'خرید، پروژه، سفارش'}
                  {r === 'Maker' && 'مدیریت کارها و خدمات'}
                  {r === 'Supplier' && 'مدیریت محصولات و فروش'}
                  {r === 'Admin' && 'مدیریت کامل سیستم'}
                </div>
              </div>
              {user.role === r && <span className="text-brand-500">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const { user, logout } = useUser()
  const navItems = navByRole[user.role] ?? navByRole.Guest
  const dropdownRef = useRef<HTMLDivElement>(null)

  // بستن dropdown با کلیک بیرون
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        // handled by blur
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <>
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

          {/* Right side: role badge + profile */}
          <div className="hidden items-center gap-2 sm:flex">
            {/* Role switcher trigger */}
            <button
              type="button"
              onClick={() => setSwitcherOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              title="تغییر نقش (نسخهٔ نمایشی)"
            >
              <span>{ROLE_ICONS[user.role]}</span>
              <span className="hidden lg:inline">{ROLE_LABELS[user.role]}</span>
            </button>

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

            {user.role !== 'Guest' && (
              <button
                type="button"
                onClick={logout}
                className="rounded-lg px-2 py-1.5 text-xs text-ink-400 hover:bg-ink-100 hover:text-ink-600"
                title="خروج"
              >
                🚪
              </button>
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
            {/* Role indicator */}
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2">
              <span className="text-lg">{ROLE_ICONS[user.role]}</span>
              <div>
                <div className="text-xs font-bold text-ink-700">{ROLE_LABELS[user.role]}</div>
                <div className="text-[10px] text-ink-400">{user.name}</div>
              </div>
              <button
                type="button"
                onClick={() => { setSwitcherOpen(true); setMobileOpen(false) }}
                className="mr-auto text-[10px] text-brand-600 hover:text-brand-700"
              >
                تغییر نقش
              </button>
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
          </nav>
        )}
      </header>

      {/* Role Switcher Modal */}
      {switcherOpen && <RoleSwitcher onClose={() => setSwitcherOpen(false)} />}
    </>
  )
}
