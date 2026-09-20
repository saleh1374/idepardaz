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
      className={`rounded-2xl border p-5 ${
        critical ? 'border-rose-300 bg-rose-50' : 'border-amber-300 bg-amber-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-xl shadow-sm">
          {critical ? '⛔' : '⚠️'}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-ink-900">
            {critical ? 'سطح ایمنی بحرانی — توقف کن' : 'سطح ایمنی بالا — مطالعهٔ الزامی'}
          </h3>
          <p className="mt-1 text-sm leading-6 text-ink-600">
            ساخت این وسیله فقط با قطعات و نسخهٔ تأییدشدهٔ بساز مجاز است. پیش از ادامه، هشدارهای
            ایمنی را به‌دقت بخوان:
          </p>
          <ul className="mt-3 space-y-1.5">
            {warnings.length === 0 && (
              <li className="text-sm text-ink-500">هشدار اختصاصی برای این دستور ثبت نشده است.</li>
            )}
            {warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-6 text-ink-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-700">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="h-4 w-4 rounded border-ink-300 accent-brand-600"
        />
        می‌فهمم که این کار خطرناک است و فقط با رعایت کامل دستورالعمل پیش می‌روم.
      </label>

      <button
        type="button"
        disabled={!checked}
        onClick={onAccept}
        className={`mt-4 w-full rounded-xl px-5 py-3 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          critical
            ? 'bg-rose-600 hover:bg-rose-700'
            : 'bg-amber-600 hover:bg-amber-700'
        }`}
      >
        ورود به بخش ساخت
      </button>
    </div>
  )
}