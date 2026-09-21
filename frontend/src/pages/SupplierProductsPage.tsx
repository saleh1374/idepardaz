import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface SupplierProduct {
  id: number
  logicalPartId: string
  logicalPartName: string
  title: string
  mpn: string
  sku: string
  price: number
  stockQty: number
  stockStatus: string
  url: string
  isActive: boolean
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('fa-IR').format(n) + ' تومان'
}

const stockStatusLabel: Record<string, string> = {
  InStock: 'موجود',
  LowStock: 'موجودی کم',
  OutOfStock: 'ناموجود',
  PreOrder: 'پیش‌خرید',
}

const stockStatusTone: Record<string, string> = {
  InStock: 'bg-green-100 text-green-700',
  LowStock: 'bg-amber-100 text-amber-700',
  OutOfStock: 'bg-rose-100 text-rose-700',
  PreOrder: 'bg-sky-100 text-sky-700',
}

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [parts, setParts] = useState<Array<{ id: string; nameFa: string }>>([])
  const [form, setForm] = useState({
    logicalPartId: '', title: '', mpn: '', sku: '', price: '', stockQty: '', stockStatus: 'InStock', url: '',
  })

  useEffect(() => {
    // دریافت لیست قطعات
    api.listParts().then((d: any) => {
      setParts(d.items.map((p: any) => ({ id: p.id, nameFa: p.nameFa })))
    }).catch(() => {})

    // داده‌های ساختگی محصولات
    setTimeout(() => {
      setProducts([
        { id: 1, logicalPartId: 'LED-5MM-WHITE', logicalPartName: 'LED ۵ میلی‌متری سفید', title: 'LED 5mm سفید — بسته ۱۰ عددی', mpn: 'LED-5MM-W', sku: 'LED-W-10', price: 15000, stockQty: 500, stockStatus: 'InStock', url: '', isActive: true },
        { id: 2, logicalPartId: 'RES-470', logicalPartName: 'مقاومت ۴۷۰ اهم', title: 'مقاومت 470Ω — بسته ۱۰۰ عددی', mpn: 'RES-470-100', sku: 'RES-470', price: 8000, stockQty: 200, stockStatus: 'InStock', url: '', isActive: true },
        { id: 3, logicalPartId: 'SWITCH-SPDT', logicalPartName: 'کلید SPDT', title: 'کلید تبدیل SPDT', mpn: 'SW-SPDT', sku: 'SW-SPDT-1', price: 5000, stockQty: 30, stockStatus: 'LowStock', url: '', isActive: true },
        { id: 4, logicalPartId: 'TP4056-CHARGER', logicalPartName: 'ماژول شارژ TP4056', title: 'ماژول شارژ لیتیوم TP4056 با محافظ', mpn: 'TP4056', sku: 'CHG-TP4056', price: 12000, stockQty: 0, stockStatus: 'OutOfStock', url: '', isActive: true },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const addProduct = () => {
    if (!form.logicalPartId || !form.title || !form.price) return
    const partName = parts.find(p => p.id === form.logicalPartId)?.nameFa ?? form.logicalPartId
    setProducts(prev => [...prev, {
      id: Date.now(),
      logicalPartId: form.logicalPartId,
      logicalPartName: partName,
      title: form.title,
      mpn: form.mpn,
      sku: form.sku,
      price: Number(form.price),
      stockQty: Number(form.stockQty),
      stockStatus: form.stockStatus,
      url: form.url,
      isActive: true,
    }])
    setForm({ logicalPartId: '', title: '', mpn: '', sku: '', price: '', stockQty: '', stockStatus: 'InStock', url: '' })
    setShowAdd(false)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-ink-900">📦 محصولات من</h1>
        <button type="button" onClick={() => setShowAdd(true)} className="btn-primary px-5 py-2 text-sm">
          + افزودن محصول
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
          <h3 className="mb-3 text-sm font-bold text-brand-800">افزودن محصول جدید</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={form.logicalPartId}
              onChange={e => setForm(p => ({ ...p, logicalPartId: e.target.value }))}
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">انتخاب قطعه...</option>
              {parts.map(p => (
                <option key={p.id} value={p.id}>{p.nameFa} ({p.id})</option>
              ))}
            </select>
            <input type="text" placeholder="عنوان محصول" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm" />
            <input type="text" placeholder="MPN" value={form.mpn} onChange={e => setForm(p => ({ ...p, mpn: e.target.value }))} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm" />
            <input type="text" placeholder="SKU" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm" />
            <input type="number" placeholder="قیمت (تومان)" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm" />
            <input type="number" placeholder="موجودی" value={form.stockQty} onChange={e => setForm(p => ({ ...p, stockQty: e.target.value }))} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm" />
            <select value={form.stockStatus} onChange={e => setForm(p => ({ ...p, stockStatus: e.target.value }))} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm">
              <option value="InStock">موجود</option>
              <option value="LowStock">موجودی کم</option>
              <option value="OutOfStock">ناموجود</option>
              <option value="PreOrder">پیش‌خرید</option>
            </select>
            <input type="url" placeholder="لینک محصول (اختیاری)" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={addProduct} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">ذخیره</button>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-50">انصراف</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white py-16 text-center text-ink-400">
          <span className="text-4xl">📦</span>
          <p className="mt-3 text-sm font-bold">هنوز محصولی ندارید</p>
        </div>
      ) : (
        <div className="rounded-xl border border-ink-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50 text-right text-xs font-semibold text-ink-500">
                <th className="px-4 py-3">قطعه</th>
                <th className="px-4 py-3">عنوان</th>
                <th className="px-4 py-3">MPN</th>
                <th className="px-4 py-3">قیمت</th>
                <th className="px-4 py-3">موجودی</th>
                <th className="px-4 py-3">وضعیت</th>
                <th className="px-4 py-3">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50/50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink-800">{p.logicalPartName}</div>
                    <div className="text-[10px] text-ink-400" dir="ltr">{p.logicalPartId}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{p.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500" dir="ltr">{p.mpn}</td>
                  <td className="px-4 py-3 font-bold text-brand-700">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3 text-ink-600" dir="ltr">{p.stockQty}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stockStatusTone[p.stockStatus] ?? 'bg-ink-100 text-ink-700'}`}>
                      {stockStatusLabel[p.stockStatus] ?? p.stockStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
