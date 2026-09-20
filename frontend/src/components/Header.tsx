import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'خانه' },
  { to: '/recipes', label: 'دستورهای ساخت' },
  { to: '/wizard', label: 'ویزارد هوشمند' },
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
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="flex items-center gap-1">
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
      </div>
    </header>
  )
}