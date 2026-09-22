import type { ReactNode } from 'react'

/**
 * آواتار رنگی — بر اساس نام، یک رنگ پایدار انتخاب می‌کند
 * تا هر کاربر همیشه آواتار هم‌رنگ خودش را ببیند.
 */
const PALETTES = [
  'from-emerald-500 to-teal-600 shadow-emerald-500/30',
  'from-sky-500 to-blue-600 shadow-sky-500/30',
  'from-violet-500 to-purple-600 shadow-violet-500/30',
  'from-amber-500 to-orange-600 shadow-amber-500/30',
  'from-rose-500 to-pink-600 shadow-rose-500/30',
  'from-cyan-500 to-teal-600 shadow-cyan-500/30',
  'from-fuchsia-500 to-purple-600 shadow-fuchsia-500/30',
  'from-lime-500 to-emerald-600 shadow-lime-500/30',
]

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function avatarGradient(seed: string): string {
  return PALETTES[hashCode(seed || '?') % PALETTES.length]
}

export default function Avatar({
  name,
  size = 'md',
  verified = false,
  className = '',
}: {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  verified?: boolean
  className?: string
}) {
  const sizes = {
    xs: 'h-7 w-7 text-[11px]',
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-3xl',
  } as const

  const badge = {
    xs: 'h-3 w-3',
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-4.5 w-4.5',
    xl: 'h-6 w-6',
  } as const

  const initial = (name || '؟').trim().charAt(0) || '؟'

  return (
    <span className={`relative inline-block shrink-0 ${className}`}>
      <span
        className={`grid place-items-center rounded-full bg-gradient-to-br font-extrabold text-white shadow-md ${avatarGradient(name)} ${sizes[size]}`}
        aria-hidden="true"
      >
        {initial}
      </span>
      {verified && (
        <span
          className={`absolute -bottom-0.5 -left-0.5 grid place-items-center rounded-full bg-white ${badge[size]}`}
          title="تأیید شده"
        >
          <svg viewBox="0 0 24 24" className="h-full w-full" fill="#0d9488" aria-hidden="true">
            <path d="M12 1.5 14.8 4l3.7-.4 1 3.6 3 2.2-1.6 3.4 1.6 3.4-3 2.2-1 3.6-3.7-.4L12 22.5 9.2 20l-3.7.4-1-3.6-3-2.2L3.1 11.2 1.5 7.8l3-2.2 1-3.6L9.2 4 12 1.5z" />
            <path d="m8.4 12.2 2.4 2.4 4.8-5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </span>
      )}
    </span>
  )
}

/** گرهٔ کارت با آواتار — برای ترکیب با متن */
export function AvatarRow({
  name,
  subtitle,
  size = 'md',
  verified,
  children,
}: {
  name: string
  subtitle?: ReactNode
  size?: 'md' | 'lg'
  verified?: boolean
  children?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} size={size} verified={verified} />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-ink-900">{name}</p>
        {subtitle && <div className="text-xs text-ink-400">{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}
