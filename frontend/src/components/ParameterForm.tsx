import type { RecipeParameter } from '../lib/types'
import { clampInteger } from '../lib/format'

export type ParamValues = Record<string, number | string | boolean>

/** مقادیر پیش‌فرض پارامترها از payload */
export function defaultsFromParameters(params: RecipeParameter[] | undefined | null): ParamValues {
  const out: ParamValues = {}
  for (const p of params ?? []) {
    let d = p.default
    if (p.type === 'integer') {
      const raw = typeof d === 'number' ? d : Number(d)
      out[p.key] = clampInteger(Number.isFinite(raw) ? raw : p.min ?? 1, p.min, p.max)
    } else if (p.type === 'enum') {
      out[p.key] = typeof d === 'string' ? d : p.options?.[0]?.value ?? ''
    } else {
      out[p.key] = typeof d === 'boolean' ? d : true
    }
  }
  return out
}

export default function ParameterForm({
  parameters,
  value,
  onChange,
}: {
  parameters: RecipeParameter[] | undefined | null
  value: ParamValues
  onChange: (next: ParamValues) => void
}) {
  if (!parameters || parameters.length === 0) {
    return (
      <p className="text-sm text-ink-400">این دستور پارامتر قابل تنظیمی ندارد؛ مستقیماً BOM بگیر.</p>
    )
  }

  const set = (key: string, v: number | string | boolean) => onChange({ ...value, [key]: v })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {parameters.map((p) => (
        <div key={p.key} className="space-y-1.5">
          <label className="flex items-center justify-between text-sm font-semibold text-ink-700">
            <span>{p.label}</span>
            <span className="font-mono text-[11px] font-normal text-ink-400" dir="ltr">
              {p.key}
            </span>
          </label>

          {p.type === 'integer' && (
            <div>
              <input
                type="number"
                min={p.min ?? undefined}
                max={p.max ?? undefined}
                step={p.step ?? 1}
                value={typeof value[p.key] === 'number' ? (value[p.key] as number) : 1}
                onChange={(e) => set(p.key, clampInteger(Number(e.target.value), p.min, p.max))}
                className="input"
              />
              {(p.min != null || p.max != null) && (
                <p className="mt-1 text-[11px] text-ink-400">
                  {p.min != null && p.max != null
                    ? `بین ${p.min} تا ${p.max}`
                    : p.min != null
                      ? `حداقل ${p.min}`
                      : `حداکثر ${p.max}`}
                </p>
              )}
            </div>
          )}

          {p.type === 'enum' && (
            <select
              value={(value[p.key] as string) ?? ''}
              onChange={(e) => set(p.key, e.target.value)}
              className="input"
            >
              {(p.options ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}

          {p.type === 'boolean' && (
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-ink-200 bg-white px-4 py-2.5">
              <span className="text-sm text-ink-600">{p.label}</span>
              <input
                type="checkbox"
                checked={Boolean(value[p.key])}
                onChange={(e) => set(p.key, e.target.checked)}
                className="h-5 w-5 rounded accent-brand-600"
              />
            </label>
          )}
        </div>
      ))}
    </div>
  )
}
