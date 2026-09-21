import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useUser } from '../lib/UserContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, setUser } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('لطفاً ایمیل و رمز عبور را وارد کنید.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await api.login({
        email: email.trim(),
        password: password.trim(),
      })

      setUser({
        id: result.id,
        name: result.name,
        role: result.role as any,
        email: result.email,
        phone: result.phone,
      })

      redirectByRole(result.role)
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          setError('ایمیل یا رمز عبور اشتباه است.')
        } else {
          setError(e.message)
        }
      } else {
        setError('خطا در ورود.')
      }
    } finally {
      setLoading(false)
    }
  }

  const redirectByRole = (role: string) => {
    switch (role) {
      case 'Maker':
        navigate('/maker/dashboard')
        break
      case 'Supplier':
        navigate('/supplier/dashboard')
        break
      default:
        navigate('/')
    }
  }

  // آیا کاربر از قبل لاگین است؟
  if (user.role !== 'Guest') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="animate-fadeInUp text-center card p-8">
          <span className="text-4xl">✅</span>
          <h1 className="mt-3 text-2xl font-black text-ink-900">شما وارد شده‌اید</h1>
          <p className="mt-2 text-sm text-ink-500">
            {user.name} — نقش: {user.role === 'Member' ? 'کاربر' : user.role === 'Maker' ? 'صنعتگر' : user.role === 'Supplier' ? 'تأمین‌کننده' : user.role}
          </p>
          <Link to="/" className="btn-primary mt-6 inline-block">
            بازگشت به خانه
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="animate-fadeInUp text-center">
        <span className="text-4xl">🔐</span>
        <h1 className="mt-3 text-3xl font-black text-ink-900">ورود به بساز</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-ink-500">
          به حساب کاربری خود وارد شوید
        </p>
      </div>

      <div className="animate-fadeInUp mt-8 card p-6">
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-ink-700">ایمیل</label>
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-ink-700">رمز عبور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور خود را وارد کنید"
              className="input w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="btn-primary w-full py-3"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                در حال ورود…
              </span>
            ) : (
              '🔐 ورود'
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-ink-100 pt-4 text-center text-xs text-ink-400">
          حساب کاربری ندارید؟{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
            ثبت‌نام کنید
          </Link>
        </div>
      </div>

      {/* راهنمای ورود آزمایشی */}
      <div className="animate-fadeInUp mt-6 rounded-xl border border-dashed border-ink-200 bg-ink-50 p-4 text-xs leading-6 text-ink-400">
        <strong className="text-ink-600">💡 راهنمای MVP:</strong>
        <br />
        در نسخهٔ آزمایشی، اطلاعات ورود در مرورگر شما ذخیره می‌شود.
        ابتدا از صفحهٔ ثبت‌نام یک حساب بسازید، سپس با همان ایمیل و رمز وارد شوید.
      </div>
    </div>
  )
}
