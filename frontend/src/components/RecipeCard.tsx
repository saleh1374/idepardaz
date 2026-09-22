import { Link } from 'react-router-dom'
import type { RecipeSummary } from '../lib/types'
import { difficultyLabel, formatTime, safetyLabel } from '../lib/format'
import Badge, { type Tone } from './Badge'
import { CATEGORY_ICONS, CATEGORY_LABELS, Ic } from '../lib/icons'

const safetyTone: Record<string, Tone> = {
  LOW: 'teal',
  MEDIUM: 'sky',
  HIGH: 'amber',
  CRITICAL: 'rose',
}

/** تصویر پوشش هر دسته — برای دستهٔ ناشناخته پوشش پیش‌فرض */
export function categoryCover(category: string): string {
  switch (category) {
    case 'lighting':
      return '/cover-lighting.svg'
    case 'power':
      return '/cover-power.svg'
    case 'cooling':
      return '/cover-cooling.svg'
    case 'testing':
      return '/cover-testing.svg'
    default:
      return '/cover-lighting.svg'
  }
}

export default function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const catIcon = CATEGORY_ICONS[recipe.category] ?? 'clipboard'
  const catLabel = CATEGORY_LABELS[recipe.category] ?? recipe.category

  return (
    <Link
      to={`/recipes/${encodeURIComponent(recipe.id)}`}
      className="card card-hover group flex flex-col overflow-hidden p-0"
    >
      {/* پوشش تصویری */}
      <div className="relative aspect-[16/9] overflow-hidden bg-ink-100">
        <img
          src={categoryCover(recipe.category)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/45 to-transparent" />
        <span className="absolute bottom-2.5 right-3 flex items-center gap-1.5 rounded-lg bg-white/92 px-2.5 py-1 text-[11px] font-bold text-ink-800 shadow-sm backdrop-blur-sm">
          <Ic name={catIcon} size={13} className="text-brand-600" />
          {catLabel}
        </span>
        <span className="absolute bottom-2.5 left-3 flex items-center gap-1 rounded-md bg-ink-900/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <Ic name="timer" size={12} className="text-amber-300" />
          {formatTime(recipe.estimatedMinutes)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-base font-bold leading-7 text-ink-900 transition-colors group-hover:text-brand-700">
          {recipe.title}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          <Badge tone="sky">{difficultyLabel[recipe.difficulty] ?? recipe.difficulty}</Badge>
          <Badge tone={safetyTone[recipe.safetyLevel] ?? 'ink'}>
            <Ic
              name={recipe.safetyLevel === 'LOW' ? 'shield' : 'alert'}
              size={11}
              className="opacity-70"
            />
            {safetyLabel[recipe.safetyLevel] ?? recipe.safetyLevel}
          </Badge>
        </div>

        {recipe.summary && (
          <p className="line-clamp-3 text-sm leading-6 text-ink-500">{recipe.summary}</p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 text-xs font-medium text-ink-400">
          <span className="flex items-center gap-1.5">
            <Ic name="clipboard" size={13} />
            نسخه {recipe.currentVersion ?? '—'}
          </span>
          <span className="flex items-center gap-1 text-brand-600 transition-colors group-hover:text-brand-700">
            مشاهدهٔ دستور
            <Ic
              name="arrowLeft"
              size={14}
              className="transition-transform duration-200 group-hover:-translate-x-1"
            />
          </span>
        </div>
      </div>
    </Link>
  )
}
