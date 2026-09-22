import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useUser } from '../lib/UserContext'
import { Ic, type IconName } from '../lib/icons'

const roles = [
  {
    value: 'Member',
    label: 'کاربر عادی',
    icon: 'userRound' as IconName,
    desc: 'پروژه بساز، BOM بگیر، یاد بگیر',
    color: 'border-brand-300 bg-brand-50 hover:border-brand-500',
    active: 'border-brand-500 bg-brand-100 shadow-md',
  },
  {
    value: 'Maker',
    label: 'صنعتگر',
    icon: 'hardHat' as IconName,
    desc: 'خدمات ساخت ارائه بده، مشتری پیدا کن',
    color: 'border-teal-300 bg-teal-50 hover:border-teal-500',
    active: 'border-teal-500 bg-teal-100 shadow-md',
  },
  {
    value: 'Supplier',
    label: 'تأمین‌کننده',
    icon: 'store' as IconName,
    desc: 'قطعات بفروش، قیمت و موجودی بده',
    color: 'border-amber-300 bg-amber-50 hover:border-amber-500',
    active: 'border-amber-500 bg-amber-100 shadow-md',
  },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useUser()
  const [step, setStep] = useState<'role' | 'info'>('role')
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRoleSelect = () => {
    if (!selectedRole) return
    setStep('info')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('لطفاً نام، ایمیل و رمز عبور را وارد کنید.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // ثبت‌نام در بک‌اند
      const result = await api.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password: password.trim(),
        role: selectedRole!,
      })

      // ورود خودکار
      setUser({
        id: result.id,
        name: result.name,
        role: result.role as any,
        email: result.email,
        phone: result.phone,
      })

      // هدایت بر اساس نقش
      redirectByRole(selectedRole!)
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
      } else {
        setError('خطا در ثبت‌نام.')
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

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="animate-fadeInUp text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Ic name="rocket" size={32} />
        </span>
        <h1 className="mt-3 text-3xl font-black text-ink-900">ثبت‌نام در بساز</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-500">
          حساب کاربری بسازید و شروع کنید
        </p>
      </div>

      {/* مرحله ۱: انتخاب نقش */}
      {step === 'role' && (
        <div className="animate-fadeInUp mt-8 card p-6">
          <h2 className="text-lg font-bold text-ink-900 mb-4">شما کی هستید؟</h2>
          <p className="text-sm text-ink-500 mb-6">نقش خود را انتخاب کنید تا تجربهٔ مناسبی داشته باشید:</p>

          <div className="space-y-3">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRole(r.value)}
                className={`w-full rounded-xl border-2 p-4 text-right transition-all ${
                  selectedRole === r.value
                    ? r.active
                    : r.color
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm">
                    <Ic name={r.icon} size={20} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-ink-900">{r.label}</h3>
                    <p className="text-xs text-ink-500 mt-0.5">{r.desc}</p>
                  </div>
                  {selectedRole === r.value && (
                    <span className="mr-auto text-brand-600">
                      <Ic name="check" size={18} strokeWidth={3} />
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRoleSelect}
            disabled={!selectedRole}
            className="btn-primary w-full mt-6 py-3"
          >
            ادامه
            <Ic name="arrowLeft" size={16} />
          </button>
        </div>
      )}

      {/* مرحله ۲: اطلاعات فردی */}
      {step === 'info' && (
        <div className="animate-fadeInUp mt-8 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-ink-900">اطلاعات فردی</h2>
              <p className="text-xs text-ink-500 mt-1">
                نقش: <span className="font-bold text-brand-600">{roles.find(r => r.value === selectedRole)?.label}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep('role')}
              className="inline-flex items-center gap-1 text-xs text-ink-400 hover:text-ink-600"
            >
              <Ic name="arrowRight" size={14} />
              تغییر نقش
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-ink-700">نام *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: علی رضایی"
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-ink-700">ایمیل *</label>
              <input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-ink-700">رمز عبور *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل ۶ کاراکتر"
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-ink-700">تلفن (اختیاری)</label>
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912xxxxxxx"
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-ink-700">شهر (اختیاری)</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="مثال: تهران"
                className="input w-full"
              />
            </div>

            {/* فیلدهای اختصاصی صنعتگر */}
            {selectedRole === 'Maker' && (
              <div>
                <label className="mb-1 block text-xs font-bold text-ink-700">تخصص (اختیاری)</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="مثال: PCB, SMD, چاپ سه‌بعدی"
                  className="input w-full"
                />
              </div>
            )}

            {/* فیلدهای اختصاصی تأمین‌کننده */}
            {selectedRole === 'Supplier' && (
              <div>
                <label className="mb-1 block text-xs font-bold text-ink-700">نام فروشگاه (اختیاری)</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="مثال: فروشگاه الکترونیک من"
                  className="input w-full"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim() || !password.trim()}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  در حال ثبت‌نام…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Ic name="userPlus" size={16} />
                  ثبت‌نام
                </span>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-ink-400">
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <a href="/login" className="font-bold text-brand-600 hover:text-brand-700">
              وارد شوید
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
