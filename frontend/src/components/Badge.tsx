import type { ReactNode } from 'react'

export type Tone = 'brand' | 'ink' | 'amber' | 'rose' | 'sky' | 'teal'

const tones: Record<Tone, string> = {
  brand: 'bg-brand-100 text-brand-800',
  teal: 'bg-teal-100 text-teal-800',
  ink: 'bg-ink-100 text-ink-700',
  amber: 'bg-amber-100 text-amber-800',
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-800',
}

export default function Badge({
  tone = 'ink',
  children,
}: {
  tone?: Tone
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  )
}