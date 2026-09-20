import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatPrice } from '../lib/format'
import Badge from '../components/Badge'

interface PartSummary {
  id: string
  nameFa: string
  nameEn: string
  category: string
  unit: string
  description?: string
  specCount: number
  minPriceToman?: number
  supplierCount: number
}

interface PartDetail {
  id: string
  nameFa: string
  nameEn: string
  category: string
  unit: string
  description?: string
  specifications: Array<{ key: string; value: string; unit?: string }>
  products: Array<{
    id: number
    supplier?: string
    sku?: string
    mpn?: string
    title: string
    price: number
    stock: string
    stockQty: number
    url?: string
  }>
}

const categoryLabels: Record<string, string> = {
  led: 'LED',
  resistor: 'مقاومت',
  cable: 'کابل',
  switch: 'کلید',
  battery: 'باتری',
  protection: 'حفاظت',
  converter: 'مبدل',
  charger: 'شارژر',
  enclosure: 'محفظه',
  wire: 'سیم',
}

const categoryIcons: Record<string, string> = {
  led: '💡',
  resistor: '⚡',
  cable: '🔌',
  switch: '🔘',
  battery: '🔋',
  protection: '🛡️',
  converter: '⚡',
  charger: '🔌',
  enclosure: '📦',
  wire: '〰️',
}

function StockDot({ status }: { status: string }) {
  const tone =
    status === 'InStock' ? 'bg-brand-500' :
    status === 'LowStock' ? 'bg-amber-500' :
    status === 'OutOfStock' ? 'bg-rose-500' : 'bg-ink-300'
  const label =
    status === 'InStock' ? 'موجود' :
    status === 'LowStock' ? 'موجودی محدود' :
    status === 'OutOfStock' ? 'ناموجود' : 'نامشخص'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
      <span className={`h-2 w-2 rounded-full ${tone}`} />
      {label}
    </span>
  )
}

export default function PartsPage() {
  const [parts, setParts] = useState<PartSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [selectedPart, setSelectedPart] = useState<PartDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api
      .listParts({ search: search || undefined, category: category || undefined })
      .then((r) => { setParts(r.items) })
      .catch((e) => { setError(e instanceof Error ? e.message : 'خطا') })
      .finally(() => { setLoading(false) })
  }, [search, category])

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const d = await api.getPart(id)
      setSelectedPart(d)
    } catch { /* ignore */ }
    setDetailLoading(false)
  }

  const categories = ['', 'led', 'resistor', 'cable', 'switch', 'battery', 'converter', 'charger', 'enclosure', 'wire']

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-ink-900 sm:text-3xl">کاتالوگ قطعات</h1>
        <p className="mt-2 text-sm text-ink-500">
          اطلاعات زنده از فروشگاه‌های ایرانی — قیمت و موجودی در لحظه به‌روز می‌شود.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در قطعات…"
          className="input sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                category === cat
                  ? 'bg-brand-600 text-white'
                  : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
              }`}
            >
              {cat ? `${categoryIcons[cat] ?? ''} ${categoryLabels[cat] ?? cat}` : 'همه'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Parts grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-40 animate-pulse bg-ink-100" />
            ))
          : parts.map((part) => (
              <button
                key={part.id}
                type="button"
                onClick={() => openDetail(part.id)}
                className={`card card-hover flex flex-col gap-2 p-5 text-right transition-all ${
                  selectedPart?.id === part.id ? 'border-brand-400 ring-2 ring-brand-400/30' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-ink-900">{part.nameFa}</h3>
                  <span className="text-lg">{categoryIcons[part.category] ?? '📦'}</span>
                </div>
                <p className="text-xs text-ink-400" dir="ltr">{part.nameEn}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="ink">{categoryLabels[part.category] ?? part.category}</Badge>
                  <Badge tone="brand">{part.supplierCount} تأمین‌کننده</Badge>
                </div>
                {part.description && (
                  <p className="line-clamp-2 text-xs leading-5 text-ink-500">{part.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-2 text-xs text-ink-500">
                  <span>از {formatPrice(part.minPriceToman)}</span>
                  <span className="font-mono text-ink-400" dir="ltr">{part.id}</span>
                </div>
              </button>
            ))}
      </div>

      {!loading && parts.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-400">
          قطعه‌ای یافت نشد.
        </p>
      )}

      {/* Detail panel */}
      {selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="card max-h-[85vh] w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-ink-900">{selectedPart.nameFa}</h2>
                <p className="text-sm text-ink-400" dir="ltr">{selectedPart.nameEn} · {selectedPart.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPart(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100"
              >
                ✕
              </button>
            </div>

            {selectedPart.description && (
              <p className="mb-4 text-sm leading-6 text-ink-600">{selectedPart.description}</p>
            )}

            {/* Specs */}
            {selectedPart.specifications.length > 0 && (
              <div className="mb-5">
                <h3 className="mb-2 text-sm font-bold text-ink-700">مشخصات فنی</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPart.specifications.map((s) => (
                    <div key={s.key} className="rounded-lg bg-ink-50 px-3 py-2">
                      <span className="text-[11px] text-ink-400">{s.key}</span>
                      <p className="text-sm font-semibold text-ink-800">
                        {s.value}{s.unit ? ` ${s.unit}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            <div>
              <h3 className="mb-3 text-sm font-bold text-ink-700">
                محصولات تأمین‌کنندگان ({selectedPart.products.length})
              </h3>
              <div className="space-y-3">
                {selectedPart.products.map((p) => (
                  <a
                    key={p.id}
                    href={p.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border border-ink-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink-800">{p.supplier ?? '—'}</p>
                        <p className="text-xs text-ink-400" dir="ltr">
                          SKU: {p.sku ?? '—'}
                          {p.mpn && ` · MPN: ${p.mpn}`}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-black text-brand-700">{formatPrice(p.price)}</p>
                        <StockDot status={p.stock} />
                      </div>
                    </div>
                    {p.url && (
                      <p className="mt-2 text-[11px] text-brand-600 truncate" dir="ltr">
                        {p.url}
                      </p>
                    )}
                  </a>
                ))}
                {selectedPart.products.length === 0 && (
                  <p className="text-sm text-ink-400">هنوز محصول فعالی ثبت نشده است.</p>
                )}
              </div>
            </div>

            {detailLoading && (
              <div className="absolute inset-0 grid place-items-center bg-white/80">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}