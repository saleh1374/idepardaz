import { useState } from 'react'

/** دروازهٔ ایمنی (قانون ۳): برای سطح HIGH/CRITICAL قبل از نمایش BOM پذیرش لازم است. */
export default function SafetyGate({
  level,
  warnings,
  onAccept,
}: {
  level: string
  warnings: string[]
  onAccept: () => void
}) {
  const [checked, setChecked] = useState(false)
  const critical = level === 'CRITICAL'
  const needsGate = level === 'HIGH' || critical

  if (!needsGate) return null

  return (
    <div
      className={`animate-fadeInUp rounded-2xl border-2 p-6 ${
        critical
          ? 'border-rose-300 bg-gradient-to-br from-rose-50 to-red-50'
          : 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50'
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="mt-0.5 grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-sm">
          {critical ? '⛔' : '⚠️'}
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-ink-900">
            {critical ? 'سطح ایمنی بحرانی — توقف کن' : 'سطح ایمنی بالا — مطالعهٔ الزامی'}
          </h3>
          <p className="mt-1 text-sm leading-6 text-ink-600">
            ساخت این وسیله فقط با قطعات و نسخهٔ تأییدشدهٔ بساز مجاز است. پیش از ادامه، هشدارهای
            ایمنی را به‌دقت بخوان:
          </p>
          <ul className="mt-3 space-y-2">
            {warnings.length === 0 && (
              <li className="flex items-center gap-2 text-sm text-ink-500">
                <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
                هشدار اختصاصی برای این دستور ثبت نشده است.
              </li>
            )}
            {warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-6 text-ink-700">
                <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${critical ? 'bg-rose-500' : 'bg-amber-500'}`} />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-sm font-medium text-ink-700 backdrop-blur-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="h-5 w-5 rounded border-ink-300 accent-brand-600"
        />
        می‌فهمم که این کار خطرناک است و فقط با رعایت کامل دستورالعمل پیش می‌روم.
      </label>

      <button
        type="button"
        disabled={!checked}
        onClick={onAccept}
        className={`mt-4 w-full rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
          critical
            ? 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/30 hover:shadow-lg hover:shadow-rose-500/40'
            : 'bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-500/30 hover:shadow-lg hover:shadow-amber-500/40'
        }`}
      >
        ورود به بخش ساخت
      </button>
    </div>
  )
}
