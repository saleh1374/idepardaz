import { useEffect, useState } from 'react'
import { Ic } from '../lib/icons'

interface Supplier {
  id: string
  name: string
  baseUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  status: string
  productCount: number
  createdAt: string
}

const statusLabel: Record<string, string> = {
  Pending: 'در انتظار تأیید',
  Approved: 'تأیید شده',
  Rejected: 'رد شده',
  Suspended: 'معلق',
}

const statusTone: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-rose-100 text-rose-700',
  Suspended: 'bg-ink-100 text-ink-700',
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)

  useEffect(() => {
    // داده‌های ساختگی
    setTimeout(() => {
      setSuppliers([
        { id: '1', name: 'ECA', baseUrl: 'https://eca.ir', contactEmail: 'info@eca.ir', contactPhone: '021-1234', status: 'Approved', productCount: 9, createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
        { id: '2', name: 'فروشگاه قطعات', baseUrl: 'https://parts.ir', contactEmail: 'sale@parts.ir', contactPhone: '021-5678', status: 'Approved', productCount: 10, createdAt: new Date(Date.now() - 86400000 * 15).toISOString() },
        { id: '3', name: 'الکترونیک کالا', baseUrl: 'https://elec.ir', contactEmail: 'info@elec.ir', contactPhone: '021-9012', status: 'Pending', productCount: 0, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: '4', name: 'قطعات صنعتی', baseUrl: null, contactEmail: null, contactPhone: null, status: 'Pending', productCount: 0, createdAt: new Date().toISOString() },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const updateStatus = (id: string, newStatus: string) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink-900">
          <Ic name="store" size={26} />
          مدیریت تأمین‌کنندگان
        </h1>
        <span className="rounded-full bg-ink-100 px-3 py-1 text-sm font-bold text-ink-600">
          {suppliers.filter(s => s.status === 'Pending').length} در انتظار تأیید
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <Ic name="circleX" size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-center text-ink-400">
          <Ic name="hourglass" size={16} />
          در حال بارگذاری...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending */}
          {suppliers.filter(s => s.status === 'Pending').length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-amber-700">
                <Ic name="hourglass" size={15} />
                در انتظار تأیید
              </h2>
              <div className="space-y-3">
                {suppliers.filter(s => s.status === 'Pending').map((s) => (
                  <div key={s.id} className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold text-ink-900">{s.name}</h3>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink-500">
                          {s.baseUrl && (
                            <span className="inline-flex items-center gap-1">
                              <Ic name="globe" size={13} />
                              {s.baseUrl}
                            </span>
                          )}
                          {s.contactEmail && (
                            <span className="inline-flex items-center gap-1">
                              <Ic name="mail" size={13} />
                              {s.contactEmail}
                            </span>
                          )}
                          {s.contactPhone && (
                            <span className="inline-flex items-center gap-1">
                              <Ic name="phone" size={13} />
                              {s.contactPhone}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-ink-400">
                          ثبت‌نام: {new Date(s.createdAt).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateStatus(s.id, 'Approved')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                        >
                          <Ic name="check" size={15} />
                          تأیید
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(s.id, 'Rejected')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600"
                        >
                          <Ic name="close" size={15} />
                          رد
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All suppliers */}
          <div className="rounded-xl border border-ink-200 bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50 text-right text-xs font-semibold text-ink-500">
                  <th className="px-5 py-2.5">نام</th>
                  <th className="px-5 py-2.5">وب‌سایت</th>
                  <th className="px-5 py-2.5">تماس</th>
                  <th className="px-5 py-2.5">وضعیت</th>
                  <th className="px-5 py-2.5">محصولات</th>
                  <th className="px-5 py-2.5">تاریخ</th>
                  <th className="px-5 py-2.5">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-ink-50/50">
                    <td className="px-5 py-3 font-bold text-ink-800">{s.name}</td>
                    <td className="px-5 py-3 text-xs text-ink-500">{s.baseUrl ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-ink-500">
                      {s.contactEmail ?? '—'}
                      {s.contactPhone && <span dir="ltr"> | {s.contactPhone}</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusTone[s.status]}`}>
                        {statusLabel[s.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-600">{s.productCount}</td>
                    <td className="px-5 py-3 text-xs text-ink-500">{new Date(s.createdAt).toLocaleDateString('fa-IR')}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        {s.status === 'Pending' && (
                          <>
                            <button onClick={() => updateStatus(s.id, 'Approved')} className="rounded px-2 py-1 text-xs font-semibold text-green-600 hover:bg-green-50">تأیید</button>
                            <button onClick={() => updateStatus(s.id, 'Rejected')} className="rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">رد</button>
                          </>
                        )}
                        {s.status === 'Approved' && (
                          <button onClick={() => updateStatus(s.id, 'Suspended')} className="rounded px-2 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50">تعلیق</button>
                        )}
                        {s.status === 'Suspended' && (
                          <button onClick={() => updateStatus(s.id, 'Approved')} className="rounded px-2 py-1 text-xs font-semibold text-green-600 hover:bg-green-50">فعال‌سازی</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
