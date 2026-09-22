import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { RecipeSummary } from '../lib/types'
import RecipeCard from '../components/RecipeCard'
import { Ic, type IconName } from '../lib/icons'

const categories: Array<{ value: string; label: string; icon: IconName }> = [
  { value: '', label: 'همه', icon: 'clipboard' },
  { value: 'lighting', label: 'روشنایی', icon: 'lightbulb' },
  { value: 'power', label: 'توان', icon: 'batteryCharging' },
  { value: 'cooling', label: 'خنک‌کننده', icon: 'fan' },
  { value: 'testing', label: 'تست', icon: 'microscope' },
]

const PAGE_SIZE = 12

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') ?? ''
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const setCategory = (value: string) => {
    setPage(1)
    setSearchParams(value ? { category: value } : {}, { replace: true })
  }

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let alive = true
    setError(null)
    api
      .listRecipes({ status: 'Approved', category: category || undefined, search: debouncedSearch || undefined })
      .then((r) => {
        if (alive) {
          setTotal(r.total ?? r.items.length)
          setRecipes(r.items)
        }
      })
      .catch((e: unknown) => {
        if (alive) {
          setError(e instanceof Error ? e.message : 'خطا در بارگذاری دستورها')
          setRecipes([])
        }
      })
    return () => { alive = false }
  }, [category, debouncedSearch])

  // Client-side pagination
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const paginatedRecipes = recipes?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-fadeInUp flex flex-col gap-1">
        <h1 className="text-2xl font-black text-ink-900 sm:text-3xl">دستورهای ساخت</h1>
        <p className="text-sm text-ink-500">
          همهٔ دستورها توسط مهندس بازبینی و تأیید شده‌اند؛ هر کدام با BOM زنده و پارامترهای
          قابل تنظیم.
        </p>
      </div>

      {/* فیلترها */}
      <div className="animate-fadeInUp mt-6 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ animationDelay: '100ms' }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در دستورها…"
          className="input sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                category === cat.value
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                  : 'border border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700'
              }`}
            >
              <Ic name={cat.icon} size={14} className="ml-1 inline-block align-[-2px]" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="animate-fadeIn mt-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          <Ic name="alertCircle" size={17} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {!recipes && !error && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-52 animate-pulse bg-ink-100" />
          ))}
        </div>
      )}

      {recipes && recipes.length === 0 && !error && (
        <div className="animate-fadeInUp mt-16 text-center">
          <img src="/empty-search.svg" alt="" className="mx-auto h-40 w-auto" />
          <p className="mt-4 text-base font-bold text-ink-600">
            دستوری با این فیلترها پیدا نشد
          </p>
          <p className="mt-1 text-sm text-ink-400">
            عبارت را عوض کن یا از ویزارد هوشمند بپرس.
          </p>
        </div>
      )}

      {paginatedRecipes && paginatedRecipes.length > 0 && (
        <div className="stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedRecipes.map((r) => (
            <div key={r.id} className="animate-fadeInUp">
              <RecipeCard recipe={r} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-outline inline-flex items-center gap-1 px-4 py-1.5 text-xs disabled:opacity-40"
          >
            <Ic name="arrowRight" size={13} />
            قبلی
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | '...')[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
              acc.push(p)
              return acc
            }, [])
            .map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="text-ink-400">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                    page === p
                      ? 'bg-brand-600 text-white'
                      : 'border border-ink-200 text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-outline inline-flex items-center gap-1 px-4 py-1.5 text-xs disabled:opacity-40"
          >
            بعدی
            <Ic name="arrowLeft" size={13} />
          </button>
        </div>
      )}

      {recipes && recipes.length > 0 && (
        <p className="mt-6 text-center text-xs text-ink-400">
          {total} دستور تأییدشده
        </p>
      )}
    </div>
  )
}
