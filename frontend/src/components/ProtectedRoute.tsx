import { Navigate, Link } from 'react-router-dom'
import { useUser, type UserRole } from '../lib/UserContext'

/**
 * محافظت مسیر — فقط کاربران دارای نقش مجاز به صفحه دسترسی دارند.
 * اگر نقش مجاز نباشد، به صفحهٔ مناسب هدایت می‌شود.
 */
export default function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[]
  children: React.ReactNode
}) {
  const { user } = useUser()

  // کاربر مهمان → هدایت به ورود
  if (user.role === 'Guest') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <span className="text-5xl">🔐</span>
        <h1 className="mt-4 text-2xl font-black text-ink-900">نیاز به ورود</h1>
        <p className="mt-3 text-sm leading-7 text-ink-500">
          برای دسترسی به این صفحه باید وارد حساب کاربری خود شوید.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login" className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600">
            🔐 ورود
          </Link>
          <Link to="/register" className="rounded-xl border border-ink-200 bg-white px-6 py-3 text-sm font-bold text-ink-700 hover:bg-ink-50">
            ثبت‌نام
          </Link>
        </div>
      </div>
    )
  }

  // نقش مجاز نیست → پیام عدم دسترسی
  if (!allowedRoles.includes(user.role)) {
    const roleNames: Record<string, string> = {
      Member: 'کاربر عادی',
      Maker: 'صنعتگر',
      Supplier: 'تأمین‌کننده',
      Admin: 'مدیر',
    }
    const allowedNames = allowedRoles.map(r => roleNames[r] ?? r).join(' یا ')

    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <span className="text-5xl">⛔</span>
        <h1 className="mt-4 text-2xl font-black text-ink-900">دسترسی غیرمجاز</h1>
        <p className="mt-3 text-sm leading-7 text-ink-500">
          این صفحه فقط برای <strong>{allowedNames}</strong> قابل دسترسی است.
        </p>
        <p className="mt-1 text-xs text-ink-400">
          نقش فعلی شما: <strong>{roleNames[user.role] ?? user.role}</strong>
        </p>
        <Link to="/" className="mt-6 inline-block rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600">
          بازگشت به خانه
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
