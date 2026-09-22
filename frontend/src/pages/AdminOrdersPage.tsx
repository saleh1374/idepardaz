import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { Ic } from '../lib/icons'

interface OrderItem {
  id: number
  projectId: number
  status: string
  total: number
  recipientName: string | null
  createdAt: string
}

interface OrderDetail {
  id: number
  projectId: number
  status: string
  total: number
  recipientName: string | null
  shippingAddress: string | null
  createdAt: string
  items: Array<{
    logicalPartId: string
    logicalPartName: string
    sku: string | null
    supplierName: string | null
    quantity: number
    unitPrice: number | null
    lineTotal: number | null
    url?: string | null
  }>
}

const statusLabel: Record<string, string> = {
  Pending: 'در انتظار',
  Paid: 'پرداخت شده',
  Processing: 'در حال پردازش',
  Shipped: 'ارسال شده',
  Delivered: 'تحویل شده',
  Cancelled: 'لغو شده',
}

const statusBadge: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Paid: 'bg-brand-100 text-brand-700',
  Processing: 'bg-sky-100 text-sky-700',
  Shipped: 'bg-indigo-100 text-indigo-700',
  Delivered: 'bg-teal-100 text-teal-700',
  Cancelled: 'bg-rose-100 text-rose-700',
}

/** ترتیب منطقی چرخهٔ عمر سفارش */
const ORDER_FLOW = ['Pending', 'Paid', 'Shipped', 'Delivered'] as const
const ALL_STATUSES = [...ORDER_FLOW, 'Cancelled'] as const

/** وضعیت‌های مجاز بعدی — همان قوانین بک‌اند */
function allowedNext(status: string): string[] {
  if (status === 'Cancelled') return []
  const idx = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number])
  if (idx === -1) return [...ORDER_FLOW, 'Cancelled']
  const nexts: string[] = []
  if (idx + 1 < ORDER_FLOW.length) nexts.push(ORDER_FLOW[idx + 1])
  // لغو فقط قبل از ارسال مجاز است
  if (idx < ORDER_FLOW.indexOf('Shipped')) nexts.push('Cancelled')
  return nexts
}

const changeIcon: Record<string, string> = {
  Paid: 'creditCard',
  Shipped: 'truck',
  Delivered: 'circleCheck',
  Cancelled: 'ban',
}

const changeTone: Record<string, string> = {
  Paid: 'bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-500/30',
  Shipped: 'bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/30',
  Delivered: 'bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-500/30',
  Cancelled: 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-500/30',
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch { return dateStr }
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(n) + ' تومان'
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // تغییر وضعیت
  const [changingId, setChangingId] = useState<number | null>(null)
  const [changedId, setChangedId] = useState<number | null>(null)
  const [rowError, setRowError] = useState<{ id: number; msg: string } | null>(null)

  // جزئیات
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = (p: number) => {
    setLoading(true)
    setError(null)
    api
      .adminListOrders(p)
      .then((d) => { setOrders(d.items); setTotal(d.total) })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'خطا'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  const changeStatus = async (id: number, status: string) => {
    setChangingId(id)
    setRowError(null)
    setChangedId(null)
    try {
      await api.changeOrderStatus(id, status)
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)))
      setChangedId(id)
      setTimeout(() => setChangedId(c => (c === id ? null : c)), 2500)
    } catch (e) {
      setRowError({
        id,
        msg: e instanceof ApiError ? e.message : 'خطا در تغییر وضعیت',
      })
    } finally {
      setChangingId(null)
    }
  }

  const openDetail = async (id: number) => {
    setDetailLoading(true)
    setDetail(null)
    try {
      const d = await api.getOrder(id)
      setDetail({
        ...d,
        items: (d.items ?? []).map(it => ({
          logicalPartId: it.logicalPartId,
          logicalPartName: it.logicalPartName,
          sku: it.sku ?? null,
          supplierName: it.supplierName ?? null,
          quantity: Number(it.quantity) || 0,
          unitPrice: it.unitPrice ?? null,
          lineTotal: it.lineTotal ?? null,
        })),
      })
    } catch {
      /* در صورت خطا پنل خالی می‌ماند */
    }
    setDetailLoading(false)
  }

  const counts = ALL_STATUSES.map(s => ({
    status: s,
    count: orders.filter(o => o.status === s).length,
  }))
  const revenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0)

  const filteredOrders = statusFilter
    ? orders.filter(o => o.status === statusFilter)
    : orders

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink-900">
            <Ic name="boxes" size={26} />
            مدیریت سفارشات
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            تغییر وضعیت سفارش‌ها و پیگیری روند ارسال — دقیقاً با همان قوانین چرخهٔ عمر بک‌اند.
          </p>
        </div>
        <span className="rounded-full bg-ink-100 px-3 py-1 text-sm font-bold text-ink-600">
          {new Intl.NumberFormat('fa-IR').format(total)} سفارش
        </span>
      </div>

      {/* خلاصهٔ وضعیت‌ها */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <div className="card flex items-center gap-2.5 p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Ic name="wallet" size={17} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-brand-700">{formatPrice(revenue)}</p>
            <p className="text-[10px] font-semibold text-ink-400">فروش فعال</p>
          </div>
        </div>
        {counts.map(c => (
          <button
            key={c.status}
            type="button"
            onClick={() => { setStatusFilter(statusFilter === c.status ? '' : c.status); setPage(1) }}
            className={`card card-hover flex items-center gap-2.5 p-3 text-right transition-all ${
              statusFilter === c.status ? 'border-brand-400 ring-2 ring-brand-400/30' : ''
            }`}
          >
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[11px] font-black ${statusBadge[c.status]}`}>
              {new Intl.NumberFormat('fa-IR').format(c.count)}
            </span>
            <span className="truncate text-xs font-semibold text-ink-600">{statusLabel[c.status]}</span>
          </button>
        ))}
      </div>

      {/* فیلتر */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="input sm:max-w-xs"
        >
          <option value="">همه وضعیت‌ها</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{statusLabel[s]}</option>
          ))}
        </select>
        {statusFilter && (
          <button
            type="button"
            onClick={() => { setStatusFilter(''); setPage(1) }}
            className="inline-flex items-center gap-1 text-xs font-bold text-ink-500 hover:text-ink-700"
          >
            <Ic name="close" size={13} />
            حذف فیلتر
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <Ic name="circleX" size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(o => {
            const nexts = allowedNext(o.status)
            return (
              <div key={o.id} className="card animate-fadeIn overflow-hidden">
                {/* ردیف اصلی */}
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between lg:flex-row-reverse lg:justify-end lg:gap-6">
                  {/* شناسه و مبلغ */}
                  <div className="flex items-center gap-4 lg:min-w-[220px]">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-100 font-mono text-sm font-black text-ink-600">
                      {new Intl.NumberFormat('fa-IR').format(o.id)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-black text-brand-700">{formatPrice(o.total)}</p>
                      <p className="text-[11px] text-ink-400">
                        {formatDate(o.createdAt)} · {o.recipientName ?? 'بدون نام'}
                      </p>
                    </div>
                  </div>

                  {/* پروژه و وضعیت */}
                  <div className="flex flex-wrap items-center gap-2 lg:flex-1 lg:justify-start">
                    <Link
                      to={`/projects/${o.projectId}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-ink-50 px-2.5 py-1 font-mono text-[11px] font-bold text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                      title="مشاهدهٔ پروژه"
                    >
                      <Ic name="folder" size={12} />
                      پروژه #{o.projectId}
                    </Link>
                    <Link
                      to={`/orders/${o.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-ink-50 px-2.5 py-1 text-[11px] font-bold text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                      title="مشاهدهٔ سفارش"
                    >
                      جزئیات
                      <Ic name="arrowLeft" size={12} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => (detail?.id === o.id ? setDetail(null) : openDetail(o.id))}
                      className="inline-flex items-center gap-1 rounded-lg bg-ink-50 px-2.5 py-1 text-[11px] font-bold text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                    >
                      <Ic name={detail?.id === o.id ? 'chevronUp' : 'chevronDown'} size={12} />
                      اقلام
                    </button>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${statusBadge[o.status] ?? 'bg-ink-100 text-ink-700'}`}>
                      {statusLabel[o.status] ?? o.status}
                    </span>
                    {changedId === o.id && (
                      <span className="animate-fadeIn inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-600">
                        <Ic name="circleCheck" size={12} />
                        ذخیره شد
                      </span>
                    )}
                  </div>

                  {/* اکشن‌های تغییر وضعیت */}
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {nexts.length === 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-3 py-1.5 text-[11px] font-semibold text-ink-400">
                        <Ic name="circleDashed" size={13} />
                        {o.status === 'Cancelled' ? 'لغو شده — بدون تغییر' : 'پایان چرخه'}
                      </span>
                    ) : (
                      nexts.map(ns => (
                        <button
                          key={ns}
                          type="button"
                          disabled={changingId === o.id}
                          onClick={() => changeStatus(o.id, ns)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white transition-all disabled:cursor-wait disabled:opacity-50 ${changeTone[ns] ?? 'bg-ink-600 hover:bg-ink-700'}`}
                        >
                          {changingId === o.id ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Ic name={changeIcon[ns] ?? 'arrowLeft'} size={13} />
                          )}
                          {statusLabel[ns]}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* خطای ردیف */}
                {rowError?.id === o.id && (
                  <div className="flex items-center gap-2 border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700">
                    <Ic name="alertCircle" size={14} />
                    {rowError.msg}
                  </div>
                )}

                {/* پنل اقلام */}
                {detail?.id === o.id && (
                  <div className="animate-fadeIn border-t border-ink-100 bg-ink-50/60 px-4 py-4">
                    {detailLoading ? (
                      <div className="h-16 animate-pulse rounded-lg bg-ink-100" />
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
                        <table className="w-full text-xs">
                          <thead className="bg-ink-50 text-[11px] font-bold text-ink-500">
                            <tr>
                              <th className="px-4 py-2 text-right">قطعه</th>
                              <th className="px-4 py-2 text-center">تأمین‌کننده</th>
                              <th className="px-4 py-2 text-center">تعداد</th>
                              <th className="px-4 py-2 text-center">قیمت واحد</th>
                              <th className="px-4 py-2 text-center">جمع</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ink-100">
                            {detail.items.map((it, i) => (
                              <tr key={i}>
                                <td className="px-4 py-2">
                                  <span className="font-semibold text-ink-800">{it.logicalPartName}</span>
                                  {it.sku && <span className="mr-2 font-mono text-[10px] text-ink-400" dir="ltr">{it.sku}</span>}
                                </td>
                                <td className="px-4 py-2 text-center text-ink-600">{it.supplierName ?? '—'}</td>
                                <td className="px-4 py-2 text-center font-semibold">{new Intl.NumberFormat('fa-IR').format(it.quantity)}</td>
                                <td className="px-4 py-2 text-center text-ink-600">{it.unitPrice != null ? formatPrice(it.unitPrice) : '—'}</td>
                                <td className="px-4 py-2 text-center font-bold text-ink-800">{it.lineTotal != null ? formatPrice(it.lineTotal) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {detail.shippingAddress && (
                          <div className="flex items-start gap-2 border-t border-ink-100 px-4 py-2.5 text-[11px] text-ink-500">
                            <Ic name="mapPin" size={13} className="mt-0.5 shrink-0 text-brand-500" />
                            <span>آدرس: {detail.recipientName ?? '—'} — {detail.shippingAddress}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {filteredOrders.length === 0 && (
            <div className="card py-14 text-center">
              <img src="/empty-box.svg" alt="" className="mx-auto h-28 w-auto" />
              <p className="mt-3 text-sm font-bold text-ink-500">سفارشی با این فیلتر پیدا نشد</p>
            </div>
          )}
        </div>
      )}

      {/* صفحه‌بندی */}
      {total > 50 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="btn-outline px-4 py-1.5 text-xs disabled:opacity-40"
          >
            <Ic name="arrowRight" size={14} /> قبلی
          </button>
          <span className="text-sm font-semibold text-ink-500">صفحه {new Intl.NumberFormat('fa-IR').format(page)}</span>
          <button
            disabled={orders.length < 50}
            onClick={() => setPage(p => p + 1)}
            className="btn-outline px-4 py-1.5 text-xs disabled:opacity-40"
          >
            بعدی <Ic name="arrowLeft" size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
