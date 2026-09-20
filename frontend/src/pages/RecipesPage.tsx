import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { RecipeSummary } from '../lib/types'
import RecipeCard from '../components/RecipeCard'

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
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-ink-900 sm:text-3xl">دستورهای ساخت</h1>
        <p className="text-sm text-ink-500">
          همهٔ دستورها توسط مهندس بازبینی و تأیید شده‌اند؛ هر کدام با BOM زنده و پارامترهای
          قابل تنظیم.
        </p>
      </div>

      {/* فیلترها */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در دستورها…"
          className="input sm:max-w-xs"
        />
        <div className="flex gap-1.5">
          {[
            ['', 'همه'],
            ['lighting', 'روشنایی'],
            ['power', 'توان'],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setCategory(val)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                category === val
                  ? 'bg-brand-600 text-white'
                  : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}

      {!recipes && !error && (
        <div className="mt-10 animate-pulse space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-40" />
          ))}
        </div>
      )}

      {recipes && recipes.length === 0 && !error && (
        <p className="mt-10 text-center text-sm text-ink-400">
          دستوری با این فیلترها پیدا نشد؛ عبارت را عوض کن یا از ویزارد هوشمند بپرس.
        </p>
      )}

      {recipes && recipes.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </div>
  )
}