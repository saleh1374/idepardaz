import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { RecipeSummary } from '../lib/types'
import RecipeCard from '../components/RecipeCard'

const categories = [
  { value: '', label: 'همه', icon: '📋' },
  { value: 'lighting', label: 'روشنایی', icon: '💡' },
  { value: 'power', label: 'توان', icon: '⚡' },
]

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<string>('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let alive = true
    setError(null)
    api
      .listRecipes({ status: 'Approved', category: category || undefined, search: debouncedSearch || undefined })
      .then((r) => {
        if (alive) setRecipes(r.items)
      })
      .catch((e: unknown) => {
        if (alive) {
          setError(e instanceof Error ? e.message : 'خطا در بارگذاری دستورها')
          setRecipes([])
        }
      })
    return () => {
      alive = false
    }
  }, [category, debouncedSearch])

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
        <div className="flex gap-1.5">
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
              <span className="ml-1">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="animate-fadeIn mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {!recipes && !error && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-52 animate-pulse bg-ink-100" />
          ))}
        </div>
      )}

      {recipes && recipes.length === 0 && !error && (
        <div className="animate-fadeInUp mt-16 text-center">
          <span className="text-4xl">🔍</span>
          <p className="mt-4 text-base font-bold text-ink-600">
            دستوری با این فیلترها پیدا نشد
          </p>
          <p className="mt-1 text-sm text-ink-400">
            عبارت را عوض کن یا از ویزارد هوشمند بپرس.
          </p>
        </div>
      )}

      {recipes && recipes.length > 0 && (
        <div className="stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <div key={r.id} className="animate-fadeInUp">
              <RecipeCard recipe={r} />
            </div>
          ))}
        </div>
      )}

      {recipes && recipes.length > 0 && (
        <p className="mt-6 text-center text-xs text-ink-400">
          {recipes.length} دستور تأییدشده
        </p>
      )}
    </div>
  )
}
