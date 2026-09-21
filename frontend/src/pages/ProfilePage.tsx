import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useUser, ROLE_LABELS, ROLE_ICONS, type UserRole } from '../lib/UserContext'

interface ProjectSummary {
  id: number
  title: string
  recipeId: string
  recipeVersion: string
  status: string
  bomId: number | null
  createdAt: string
}

const statusLabel: Record<string, string> = {
  Draft: 'پیش‌نویس',
  Planning: 'برنامه‌ریزی',
  BomReady: 'BOM آماده',
  PartsSelected: 'قطعات انتخاب‌شده',
  Ordered: 'سفارش‌داده',
  Building: 'در حال ساخت',
  Testing: 'تست',
  Completed: 'تکمیل‌شده',
  Published: 'منتشرشده',
}

const statusTone: Record<string, string> = {
  Draft: 'bg-ink-100 text-ink-700',
  Planning: 'bg-sky-100 text-sky-700',
  BomReady: 'bg-brand-100 text-brand-700',
  PartsSelected: 'bg-purple-100 text-purple-700',
  Ordered: 'bg-amber-100 text-amber-700',
  Building: 'bg-orange-100 text-orange-700',
  Testing: 'bg-cyan-100 text-cyan-700',
  Completed: 'bg-teal-100 text-teal-700',
  Published: 'bg-green-100 text-green-700',
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch { return dateStr }
}

export default function ProfilePage() {
  const { user, setUser } = useUser()
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(user.name)
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)

  useEffect(() => {
    setProjectsLoading(true)
    api.listProjects()
      .then((r) => setProjects(r.items as unknown as ProjectSummary[]))
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false))
  }, [])

  const saveProfile = () => {
    setUser({ ...user, name: nameInput.trim() || user.name })
    setEditing(false)
  }

  const projectCount = projects.length
  const completedCount = projects.filter(p => p.status === 'Completed' || p.status === 'Published').length

  // لینک‌های متناسب با نقش
  const roleLinks: Record<UserRole, Array<{ to: string; label: string; icon: string }>> = {
    Guest: [
      { to: '/recipes', label: 'دستورها', icon: '📋' },
      { to: '/parts', label: 'قطعات', icon: '🧩' },
      { to: '/makers', label: 'صنعتگران', icon: '🏭' },
      { to: '/wizard', label: 'ویزارد', icon: '✨' },
    ],
    Member: [
      { to: '/recipes', label: 'دستورها', icon: '📋' },
      { to: '/parts', label: 'قطعات', icon: '🧩' },
      { to: '/projects', label: 'پروژه‌ها', icon: '📁' },
      { to: '/orders', label: 'سفارشات', icon: '📦' },
    ],
    Engineer: [
      { to: '/recipes', label: 'دستورها', icon: '📋' },
      { to: '/parts', label: 'قطعات', icon: '🧩' },
      { to: '/projects', label: 'پروژه‌ها', icon: '📁' },
      { to: '/wizard', label: 'ویزارد', icon: '✨' },
    ],
    SafetyReviewer: [
      { to: '/recipes', label: 'دستورها', icon: '📋' },
      { to: '/projects', label: 'پروژه‌ها', icon: '📁' },
    ],
    Supplier: [
      { to: '/supplier/dashboard', label: 'داشبورد', icon: '📊' },
      { to: '/supplier/products', label: 'محصولات', icon: '📦' },
      { to: '/supplier/orders', label: 'سفارشات', icon: '📋' },
    ],
    Maker: [
      { to: '/maker/dashboard', label: 'داشبورد', icon: '📊' },
      { to: '/maker/jobs', label: 'کارها', icon: '🔨' },
      { to: '/maker/services', label: 'خدمات', icon: '🛠️' },
    ],
    Admin: [
      { to: '/admin', label: 'داشبورد', icon: '⚙️' },
      { to: '/admin/users', label: 'کاربران', icon: '👥' },
      { to: '/admin/recipes', label: 'دستورها', icon: '📋' },
      { to: '/admin/orders', label: 'سفارشات', icon: '📦' },
      { to: '/admin/suppliers', label: 'تأمین‌کنندگان', icon: '🏪' },
    ],
  }

  const links = roleLinks[user.role] ?? roleLinks.Guest

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-ink-400">
        <Link to="/" className="hover:text-brand-600 transition-colors">خانه</Link>
        <span>/</span>
        <span className="text-ink-600">پنل کاربری</span>
      </nav>

      {/* Profile Card */}
      <div className="animate-fadeInUp card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex shrink-0 flex-col items-center gap-3">
            <span className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-600 text-3xl font-extrabold text-white shadow-lg shadow-brand-500/30">
              {user.name.charAt(0)}
            </span>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
              {ROLE_ICONS[user.role]} {ROLE_LABELS[user.role]}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-ink-700">نام نمایشی</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="input mt-1"
                    placeholder="نام شما"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={saveProfile} className="btn-primary text-xs">ذخیره</button>
                  <button type="button" onClick={() => setEditing(false)} className="btn-outline text-xs">لغو</button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-black text-ink-900">{user.name}</h1>
                <p className="mt-1 text-sm text-ink-500">
                  شناسه: <span className="font-mono text-ink-400 text-xs" dir="ltr">{user.id.slice(0, 8)}…</span>
                </p>
                <button type="button" onClick={() => setEditing(true)} className="mt-3 btn-outline text-xs">
                  ✏️ ویرایش نام
                </button>
              </>
            )}
          </div>

          {/* Stats */}
          {(user.role === 'Member' || user.role === 'Guest') && (
            <div className="flex gap-4 sm:flex-col">
              <div className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-center">
                <p className="text-2xl font-black text-brand-700">{projectCount}</p>
                <p className="text-xs text-ink-500">پروژه</p>
              </div>
              <div className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-center">
                <p className="text-2xl font-black text-teal-700">{completedCount}</p>
                <p className="text-xs text-ink-500">تکمیل‌شده</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links — متناسب با نقش */}
      <div className="animate-fadeInUp mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: '100ms' }}>
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="card card-hover group flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-lg group-hover:scale-110 transition-transform">
              {link.icon}
            </span>
            <div>
              <p className="text-sm font-bold text-ink-900">{link.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Projects — فقط برای Member و Guest */}
      {(user.role === 'Member' || user.role === 'Guest') && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-ink-900">پروژه‌های اخیر</h2>
            <Link to="/projects" className="text-xs font-bold text-brand-600 hover:text-brand-700">همه ←</Link>
          </div>

          {projectsLoading && (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card h-16 animate-pulse bg-ink-100" />
              ))}
            </div>
          )}

          {!projectsLoading && projects.length === 0 && (
            <div className="animate-fadeInUp mt-6 rounded-xl border border-dashed border-ink-300 bg-ink-50/50 p-8 text-center">
              <span className="text-3xl">📁</span>
              <p className="mt-3 text-sm font-bold text-ink-600">هنوز پروژه‌ای ندارید</p>
              <Link to="/recipes" className="btn-primary mt-4 inline-flex text-xs">
                شروع اولین پروژه ←
              </Link>
            </div>
          )}

          {!projectsLoading && projects.length > 0 && (
            <div className="mt-4 space-y-2">
              {projects.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="card card-hover flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink-900 truncate">{p.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {p.recipeId} · {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[p.status] ?? 'bg-ink-100 text-ink-700'}`}>
                    {statusLabel[p.status] ?? p.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Account Info */}
      <div className="animate-fadeInUp mt-8 card p-5" style={{ animationDelay: '200ms' }}>
        <h3 className="text-sm font-bold text-ink-800">ℹ️ دربارهٔ حساب</h3>
        <p className="mt-2 text-xs leading-6 text-ink-500">
          در نسخهٔ آزمایشی، احراز هویت واقعی (JWT) متصل نیست. اطلاعات کاربر در مرورگر ذخیره می‌شود.
          شناسهٔ کاربری فعلی شما <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-ink-600" dir="ltr">{user.id.slice(0, 8)}…</code> است.
          نقش فعلی: <span className="font-bold text-brand-700">{ROLE_LABELS[user.role]}</span>.
        </p>
      </div>
    </div>
  )
}
