import { Link } from 'react-router-dom'
import type { RecipeSummary } from '../lib/types'
import { difficultyLabel, formatTime, safetyLabel } from '../lib/format'
import Badge, { type Tone } from './Badge'

const safetyTone: Record<string, Tone> = {
  LOW: 'teal',
  MEDIUM: 'sky',
  HIGH: 'amber',
  CRITICAL: 'rose',
}

const catIcon: Record<string, string> = {
  lighting: '💡',
  power: '⚡',
}

export default function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  return (
    <Link
      to={`/recipes/${encodeURIComponent(recipe.id)}`}
      className="card card-hover group flex flex-col gap-3 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{catIcon[recipe.category] ?? '📋'}</span>
          <h3 className="text-base font-bold leading-7 text-ink-900 transition-colors group-hover:text-brand-700">
            {recipe.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="ink">{recipe.category === 'lighting' ? 'روشنایی' : recipe.category === 'power' ? 'توان' : recipe.category}</Badge>
        <Badge tone="sky">{difficultyLabel[recipe.difficulty] ?? recipe.difficulty}</Badge>
        <Badge tone={safetyTone[recipe.safetyLevel] ?? 'ink'}>
          {safetyLabel[recipe.safetyLevel] ?? recipe.safetyLevel}
        </Badge>
      </div>

      {recipe.summary && (
        <p className="line-clamp-3 text-sm leading-6 text-ink-500">{recipe.summary}</p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 text-xs font-medium text-ink-400">
        <span>⏱ {formatTime(recipe.estimatedMinutes)}</span>
        <span className="text-brand-600 transition-colors group-hover:text-brand-700 group-hover:translate-x-[-4px] transition-transform duration-200">
          مشاهدهٔ دستور ←
        </span>
      </div>
    </Link>
  )
}
