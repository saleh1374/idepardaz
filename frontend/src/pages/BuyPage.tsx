import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useUser } from '../lib/UserContext'
import { formatPrice } from '../lib/format'
import { Ic } from '../lib/icons'

interface BomItem {
  logicalPartId: string
  logicalPartName: string
  role: string
  quantity: number
  supplierName: string | null
  sku: string | null
  unitPrice: number | null
  lineTotal: number | null
  stockStatus: string | null
  url: string | null
}

interface ProjectInfo {
  id: number
  title: string
  recipeId: string
  bomId: number | null
}

interface SupplierGroup {
  name: string
  items: BomItem[]
  total: number
}

const stockLabel: Record<string, string> = {
  InStock: 'موجود',
  LowStock: 'موجودی محدود',
  OutOfStock: 'ناموجود',
}

const stockTone: Record<string, string> = {
  InStock: 'bg-brand-100 text-brand-700',
  LowStock: 'bg-amber-100 text-amber-700',
  OutOfStock: 'bg-rose-100 text-rose-700',
}

export default function BuyPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const { user } = useUser()

  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [items, setItems] = useState<BomItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderCreated, setOrderCreated] = useState(false)
  const [creating, setCreating] = useState(false)
  const [recipientName, setRecipientName] = useState(user?.name ?? '')
  const [shippingAddress, setShippingAddress] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!projectId) return
    let alive = true
    setLoading(true)

    Promise.all([
      api.getProject(Number(projectId)),
      api.getBomForProject(Number(projectId)),
    ])
      .then(([proj, bomData]) => {
        if (!alive) return
        setProject(proj as unknown as ProjectInfo)
        const bom = bomData as unknown as { items: BomItem[]; total: number }
        setItems(bom.items)
        setTotal(bom.total)
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : 'خطا در بارگذاری')
      })
      .finally(() => { if (alive) setLoading(false) })

    return () => { alive = false }
  }, [projectId])

  // گروه‌بندی بر اساس تأمین‌کننده
  const supplierGroups: SupplierGroup[] = []
  if (items.length > 0) {
    const map = new Map<string, BomItem[]>()
    for (const item of items) {
      const key = item.supplierName ?? 'نامشخص'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    for (const [name, groupItems] of map) {
      supplierGroups.push({
        name,
        items: groupItems,
        total: groupItems.reduce((s, i) => s + (i.lineTotal ?? 0), 0),
      })
    }
  }

  const handleCreateOrder = async () => {
    if (!projectId || !user) return
    setCreating(true)
    try {
      await api.createOrder({
        projectId: Number(projectId),
        recipientName: recipientName || user.name,
        shippingAddress,
      })
      setOrderCreated(true)
      setShowConfirm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در ایجاد سفارش')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="card h-20 animate-pulse bg-ink-100" />
        <div className="mt-4 card h-64 animate-pulse bg-ink-100" />
      </div>
    )
  }

  if (error && !items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <img src="/empty-search.svg" alt="" className="mx-auto h-32 w-auto" />
        <p className="mt-3 text-lg font-bold text-rose-600">{error}</p>
        <Link to={projectId ? `/projects/${projectId}` : '/projects'} className="mt-4 inline-block text-sm font-bold text-brand-600">
          <Ic name="arrowRight" size={14} /> بازگشت به پروژه
        </Link>
      </div>
    )
  }

  if (orderCreated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Ic name="circleCheck" size={64} className="mx-auto text-green-500" />
        <h1 className="mt-4 text-2xl font-black text-ink-900">سفارش ثبت شد!</h1>
        <p className="mt-2 text-sm text-ink-500">
          سفارش شما با موفقیت ثبت شد. قطعات از تأمین‌کنندگان ارسال خواهند شد.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={`/projects/${projectId}`} className="btn-outline text-sm">
            <Ic name="arrowRight" size={14} /> بازگشت به پروژه
          </Link>
          <Link to="/projects" className="btn-primary text-sm">
            <Ic name="folder" size={14} /> پروژه‌های من
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-ink-400">
        <Link to="/" className="hover:text-brand-600 transition-colors">خانه</Link>
        <span>/</span>
        <Link to="/projects" className="hover:text-brand-600 transition-colors">پروژه‌ها</Link>
        <span>/</span>
        <Link to={`/projects/${projectId}`} className="hover:text-brand-600 transition-colors">{project?.title ?? `#${projectId}`}</Link>
        <span>/</span>
        <span className="text-ink-600">خرید قطعات</span>
      </nav>

      {/* Header */}
      <div className="animate-fadeInUp mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-black text-ink-900 sm:text-3xl"><Ic name="cart" size={26} /> خرید قطعات</h1>
        <p className="mt-2 text-sm text-ink-500">
          قطعات مورد نیاز پروژه از تأمین‌کنندگان مختلف. روی دکمه خرید هر تأمین‌کننده کلیک کنید.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Supplier Groups */}
      <div className="space-y-6">
        {supplierGroups.map((group) => {
          // پیدا کردن لینک اولین قطعه از این تأمین‌کننده
          const firstUrl = group.items.find((i) => i.url)?.url
          return (
            <div key={group.name} className="animate-fadeInUp card overflow-hidden">
              {/* Supplier Header */}
              <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/50 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-lg">
                    <Ic name="store" size={20} />
                  </span>
                  <div>
                    <h3 className="font-black text-ink-900">{group.name}</h3>
                    <p className="text-xs text-ink-500">{group.items.length} قطعه</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-brand-700">{formatPrice(group.total)}</span>
                  {firstUrl && (
                    <a
                      href={firstUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-xs"
                    >
                      <Ic name="cart" size={14} /> خرید از {group.name}
                    </a>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-ink-50 text-xs font-semibold text-ink-500">
                    <tr>
                      <th className="px-5 py-2.5 text-right">قطعه</th>
                      <th className="px-5 py-2.5 text-center">تعداد</th>
                      <th className="px-5 py-2.5 text-center">قیمت واحد</th>
                      <th className="px-5 py-2.5 text-center">جمع</th>
                      <th className="px-5 py-2.5 text-center">موجودی</th>
                      <th className="px-5 py-2.5 text-center">لینک خرید</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {group.items.map((item) => (
                      <tr key={item.logicalPartId} className="hover:bg-brand-50/20 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-ink-800">{item.logicalPartName}</p>
                          {item.sku && (
                            <p className="font-mono text-[11px] text-ink-400" dir="ltr">SKU: {item.sku}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center font-semibold">{item.quantity}</td>
                        <td className="px-5 py-3 text-center">{formatPrice(item.unitPrice)}</td>
                        <td className="px-5 py-3 text-center font-bold text-ink-900">{formatPrice(item.lineTotal)}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${stockTone[item.stockStatus ?? ''] ?? 'bg-ink-100 text-ink-600'}`}>
                            {stockLabel[item.stockStatus ?? ''] ?? item.stockStatus ?? 'نامشخص'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {item.url ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 transition-colors"
                            >
                              <Ic name="externalLink" size={14} /> خرید
                            </a>
                          ) : (
                            <span className="text-xs text-ink-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary & Confirm */}
      <div className="animate-fadeInUp mt-8 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-teal-50 p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-brand-700">جمع کل خرید</p>
            <p className="text-3xl font-extrabold text-brand-800">{formatPrice(total)}</p>
            <p className="mt-1 text-xs text-brand-600">
              {supplierGroups.length} تأمین‌کننده · {items.length} قطعه
            </p>
          </div>
          <div className="flex gap-3">
            <Link to={`/projects/${projectId}`} className="btn-outline text-sm">
              <Ic name="arrowRight" size={14} /> بازگشت
            </Link>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="btn-primary text-sm"
            >
              <Ic name="circleCheck" size={14} /> تأیید و ثبت سفارش
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-fadeInUp">
            <h2 className="flex items-center gap-2 text-lg font-black text-ink-900"><Ic name="notebook" size={18} /> تأیید سفارش</h2>
            <p className="mt-2 text-sm text-ink-500">
              اطلاعات ارسال خود را وارد کنید. قطعات از تأمین‌کنندگان ارسال خواهند شد.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-ink-700">نام گیرنده</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="input w-full"
                  placeholder="نام کامل"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-ink-700">آدرس ارسال</label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="input w-full"
                  rows={3}
                  placeholder="آدرس کامل + کد پستی"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-ink-50 p-4">
              <div>
                <p className="text-xs text-ink-500">جمع کل</p>
                <p className="text-xl font-extrabold text-brand-800">{formatPrice(total)}</p>
              </div>
              <div className="text-xs text-ink-500">
                {items.length} قطعه از {supplierGroups.length} تأمین‌کننده
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="btn-outline flex-1 text-sm"
                disabled={creating}
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={creating || !shippingAddress.trim()}
                className="btn-primary flex-1 text-sm disabled:opacity-50"
              >
                {creating ? (
                  <><Ic name="hourglass" size={14} /> در حال ثبت...</>
                ) : (
                  <><Ic name="circleCheck" size={14} /> ثبت سفارش</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
