import { useEffect, useState } from 'react'
import { Ic } from '../lib/icons'

interface MakerService {
  id: number
  title: string
  description: string
  price: number
  unit: string
  leadTimeDays: number
  isActive: boolean
}

const unitLabel = (u: string) => {
  const map: Record<string, string> = { per_item: 'به ازای هر عدد', per_hour: 'به ازای ساعت', fixed: 'ثابت' }
  return map[u] ?? u
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('fa-IR').format(n) + ' تومان'
}

export default function MakerServicesPage() {
  const [services, setServices] = useState<MakerService[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', price: '', unit: 'per_item', leadTimeDays: '3' })

  useEffect(() => {
    // داده‌های ساختگی
    setTimeout(() => {
      setServices([
        { id: 1, title: 'مونتاژ LED', description: 'مونتاژ و لحیم‌کاری مدار LED', price: 150000, unit: 'per_item', leadTimeDays: 2, isActive: true },
        { id: 2, title: 'چاپ سه‌بعدی', description: 'چاپ قطعات پلاستیکی با PLA/PETG', price: 80000, unit: 'per_item', leadTimeDays: 3, isActive: true },
        { id: 3, title: 'کابینت‌سازی', description: 'ساخت کابینت و محفظه', price: 200000, unit: 'per_item', leadTimeDays: 5, isActive: true },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const addService = () => {
    if (!form.title || !form.price) return
    setServices(prev => [...prev, {
      id: Date.now(),
      title: form.title,
      description: form.description,
      price: Number(form.price),
      unit: form.unit,
      leadTimeDays: Number(form.leadTimeDays),
      isActive: true,
    }])
    setForm({ title: '', description: '', price: '', unit: 'per_item', leadTimeDays: '3' })
    setShowAdd(false)
  }

  const removeService = (id: number) => {
    setServices(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-black text-ink-900">
          <Ic name="toolbox" size={26} />
          خدمات من
        </h1>
        <button type="button" onClick={() => setShowAdd(true)} className="btn-primary px-5 py-2 text-sm">
          + افزودن خدمت
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
          <h3 className="mb-3 text-sm font-bold text-brand-800">افزودن خدمت جدید</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="عنوان خدمت"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="قیمت (تومان)"
              value={form.price}
              onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
            />
            <select
              value={form.unit}
              onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
            >
              <option value="per_item">به ازای هر عدد</option>
              <option value="per_hour">به ازای ساعت</option>
              <option value="fixed">ثابت</option>
            </select>
            <input
              type="number"
              placeholder="مدت تحویل (روز)"
              value={form.leadTimeDays}
              onChange={e => setForm(p => ({ ...p, leadTimeDays: e.target.value }))}
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
            />
            <textarea
              placeholder="توضیحات"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm sm:col-span-2"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={addService} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">
              ذخیره
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-50">
              انصراف
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-ink-100" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white py-16 text-center text-ink-400">
          <img src="/empty-box.svg" alt="" className="mx-auto h-32 w-auto" />
          <p className="mt-3 text-sm font-bold">هنوز خدمتی ثبت نکرده‌اید</p>
          <p className="mt-1 text-xs">خدمات خود را اضافه کنید تا مشتریان بتوانند از شما سفارش بدهند.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.id} className="flex flex-col gap-3 rounded-xl border border-ink-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink-900">{s.title}</span>
                  {s.isActive ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">فعال</span>
                  ) : (
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500">غیرفعال</span>
                  )}
                </div>
                {s.description && <p className="mt-1 text-xs text-ink-400">{s.description}</p>}
                <div className="mt-1 flex gap-3 text-xs text-ink-500">
                  <span>واحد: {unitLabel(s.unit)}</span>
                  <span>تحویل: {s.leadTimeDays} روز</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-brand-700">{formatPrice(s.price)}</span>
                <button
                  type="button"
                  onClick={() => removeService(s.id)}
                  className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
