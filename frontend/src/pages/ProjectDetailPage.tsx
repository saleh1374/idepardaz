import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatPrice } from '../lib/format'
import { Ic } from '../lib/icons'

interface ProjectDetail {
  id: number
  title: string
  description: string | null
  userDisplayName: string
  recipeId: string
  recipeVersion: string
  status: string
  isPublic: boolean
  bomId: number | null
  parameters: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

interface BomDetail {
  isValid: boolean
  bomId: number | null
  total: number | null
  recipeTitle: string
  recipeVersion: string
  items: Array<{
    logicalPartId: string
    logicalPartName: string
    role: string
    quantity: number
    supplierName: string | null
    sku: string | null
    unitPrice: number | null
    lineTotal: number | null
    stockStatus: string | null
  }>
  errors: string[]
  warnings: string[]
}

const statusLabel: Record<string, string> = {
  Draft: 'پیش‌نویس',
  Planning: 'برنامه‌ریزی',
  BomReady: 'BOM آماده',
  PartsSelected: 'قطعات انتخاب‌شده',
  Ordered: 'سفارش‌داده',
  Building: 'در حال ساخت',
  Testing: 'تست',
  Completed: 'تکمیل‌شده',
  Published: 'منتشرشده',
  Cancelled: 'لغوشده',
}

const statusTone: Record<string, string> = {
  Draft: 'bg-ink-100 text-ink-700',
  Planning: 'bg-sky-100 text-sky-700',
  BomReady: 'bg-brand-100 text-brand-700',
  PartsSelected: 'bg-purple-100 text-purple-700',
  Ordered: 'bg-amber-100 text-amber-700',
  Building: 'bg-orange-100 text-orange-700',
  Testing: 'bg-cyan-100 text-cyan-700',
  Completed: 'bg-teal-100 text-teal-700',
  Published: 'bg-green-100 text-green-700',
  Cancelled: 'bg-rose-100 text-rose-700',
}

const nextStatuses: Record<string, string[]> = {
  Draft: ['Planning'],
  Planning: ['BomReady'],
  BomReady: ['PartsSelected', 'Ordered'],
  PartsSelected: ['Ordered'],
  Ordered: ['Building'],
  Building: ['Testing'],
  Testing: ['Completed'],
  Completed: ['Published'],
  Published: ['Archived'],
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return dateStr }
}

function StockDot({ status }: { status: string | null }) {
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

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [bom, setBom] = useState<BomDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [changingStatus, setChangingStatus] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [statusOk, setStatusOk] = useState<boolean | null>(null)

  useEffect(() => {
    if (!id) return
    let alive = true
    setLoading(true)
    setError(null)

    Promise.all([
      api.getProject(Number(id)),
      api.getBomForProject(Number(id)).catch(() => null),
    ])
      .then(([proj, bomData]) => {
        if (!alive) return
        setProject(proj as unknown as ProjectDetail)
        setBom(bomData as unknown as BomDetail | null)
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : 'خطا در بارگذاری')
      })
      .finally(() => { if (alive) setLoading(false) })

    return () => { alive = false }
  }, [id])

  const changeStatus = async (newStatus: string) => {
    if (!id) return
    setChangingStatus(true)
    setStatusMsg(null)
    setStatusOk(null)
    try {
      await api.changeProjectStatus(Number(id), newStatus)
      setProject((p) => p ? { ...p, status: newStatus } : p)
      setStatusOk(true)
      setStatusMsg(`وضعیت به «${statusLabel[newStatus] ?? newStatus}» تغییر کرد`)
    } catch (e) {
      setStatusOk(false)
      setStatusMsg(e instanceof Error ? e.message : 'خطا در تغییر وضعیت')
    } finally {
      setChangingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="card h-24 animate-pulse bg-ink-100" />
        <div className="mt-4 card h-48 animate-pulse bg-ink-100" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <img src="/empty-search.svg" alt="" className="mx-auto h-32 w-auto" />
        <p className="mt-3 text-lg font-bold text-rose-600">{error ?? 'پروژه یافت نشد'}</p>
        <Link to="/projects" className="mt-4 inline-block text-sm font-bold text-brand-600"><Ic name="arrowRight" size={14} /> بازگشت به پروژه‌ها</Link>
      </div>
    )
  }

  const nexts = nextStatuses[project.status] ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-ink-400">
        <Link to="/" className="hover:text-brand-600 transition-colors">خانه</Link>
        <span>/</span>
        <Link to="/projects" className="hover:text-brand-600 transition-colors">پروژه‌ها</Link>
        <span>/</span>
        <span className="text-ink-600">{project.title}</span>
      </nav>

      {/* Header */}
      <div className="animate-fadeInUp mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-ink-900 sm:text-3xl">{project.title}</h1>
            {project.description && (
              <p className="mt-2 text-sm text-ink-500">{project.description}</p>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${statusTone[project.status] ?? 'bg-ink-100 text-ink-700'}`}>
            {statusLabel[project.status] ?? project.status}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1.5"><Ic name="boxes" size={14} /> دستور: <Link to={`/recipes/${encodeURIComponent(project.recipeId)}`} className="font-semibold text-brand-600 hover:underline">{project.recipeId}</Link></span>
          <span className="inline-flex items-center gap-1.5"><Ic name="tag" size={14} /> نسخه: <span className="font-mono text-ink-600" dir="ltr">{project.recipeVersion}</span></span>
          {project.bomId && <span className="inline-flex items-center gap-1.5"><Ic name="wallet" size={14} /> BOM: <span className="font-mono text-ink-600" dir="ltr">#{project.bomId}</span></span>}
          <span className="inline-flex items-center gap-1.5"><Ic name="user" size={14} /> {project.userDisplayName}</span>
          <span className="inline-flex items-center gap-1.5"><Ic name="calendar" size={14} /> {formatDate(project.createdAt)}</span>
        </div>
      </div>

      {/* Status Actions */}
      {nexts.length > 0 && (
        <div className="animate-fadeIn card mb-6 p-4">
          <h3 className="mb-3 text-sm font-bold text-ink-800">تغییر وضعیت</h3>
          <div className="flex flex-wrap gap-2">
            {nexts.map((ns) => (
              <button
                key={ns}
                type="button"
                onClick={() => void changeStatus(ns)}
                disabled={changingStatus}
                className="btn-outline text-xs"
              >
                {changingStatus ? (
                  <>
                    <Ic name="hourglass" size={14} /> {statusLabel[ns] ?? ns}
                  </>
                ) : (
                  <>
                    {statusLabel[ns] ?? ns} <Ic name="arrowLeft" size={14} />
                  </>
                )}
              </button>
            ))}
          </div>
          {statusMsg && (
            <p className="mt-3 text-sm font-medium text-ink-600">
              {statusOk ? <Ic name="circleCheck" size={14} className="inline-block align-middle" /> : <Ic name="circleX" size={14} className="inline-block align-middle" />}{' '}
              {statusMsg}
            </p>
          )}
        </div>
      )}

      {/* Parameters */}
      {project.parameters && Object.keys(project.parameters).length > 0 && (
        <div className="animate-fadeIn card mb-6 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-800"><Ic name="settings" size={16} /> پارامترهای انتخاب‌شده</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(project.parameters).map(([k, v]) => (
              <span key={k} className="rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700">
                <span className="text-ink-500">{k}:</span>{' '}
                <span className="font-mono" dir="ltr">{String(v)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* BOM */}
      {bom && bom.items.length > 0 && (
        <div className="animate-fadeIn card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink-800"><Ic name="wallet" size={16} /> لیست قطعات (BOM)</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${bom.isValid ? 'bg-brand-100 text-brand-700' : 'bg-rose-100 text-rose-700'}`}>
              {bom.isValid ? (
                <><Ic name="circleCheck" size={13} /> معتبر</>
              ) : (
                <><Ic name="circleX" size={13} /> نامعتبر</>
              )}
            </span>
          </div>

          {bom.warnings.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              {bom.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-800"><Ic name="alert" size={13} className="inline-block align-middle" /> {w}</p>
              ))}
            </div>
          )}

          <div className="mt-4 overflow-x-auto rounded-xl border border-ink-200">
            <table className="w-full min-w-[600px] text-right text-sm">
              <thead className="bg-ink-50 text-xs font-bold text-ink-500">
                <tr>
                  <th className="px-4 py-3">قطعه</th>
                  <th className="px-4 py-3">نقش</th>
                  <th className="px-4 py-3">تعداد</th>
                  <th className="px-4 py-3">تأمین‌کننده</th>
                  <th className="px-4 py-3">قیمت واحد</th>
                  <th className="px-4 py-3">جمع</th>
                  <th className="px-4 py-3">موجودی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {bom.items.map((item) => (
                  <tr key={item.logicalPartId} className="bg-white transition-colors hover:bg-brand-50/30">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-800">{item.logicalPartName}</p>
                      <p className="font-mono text-[11px] text-ink-400" dir="ltr">{item.logicalPartId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        item.role === 'Required' ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-600'
                      }`}>
                        {item.role === 'Required' ? 'الزامی' : item.role === 'Optional' ? 'اختیاری' : item.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3 text-ink-600">{item.supplierName ?? '—'}</td>
                    <td className="px-4 py-3">{formatPrice(item.unitPrice)}</td>
                    <td className="px-4 py-3 font-bold text-ink-900">{formatPrice(item.lineTotal)}</td>
                    <td className="px-4 py-3"><StockDot status={item.stockStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-teal-50 p-5">
            <div>
              <p className="text-xs font-semibold text-brand-700">جمع کل</p>
              <p className="text-2xl font-extrabold text-brand-800">{formatPrice(bom.total)}</p>
            </div>
            <div className="flex gap-2">
              <Link to={`/recipes/${encodeURIComponent(project.recipeId)}`} className="btn-outline text-xs">
                <Ic name="wrench" size={14} /> مشاهدهٔ دستور
              </Link>
              <Link
                to={`/projects/${project.id}/buy`}
                className="btn-primary text-xs"
              >
                <Ic name="cart" size={14} /> خرید قطعات
              </Link>
            </div>
          </div>
        </div>
      )}

      {!bom && project.bomId && (
        <div className="card p-5 text-center text-sm text-ink-500">
          <p>در حال بارگذاری BOM…</p>
        </div>
      )}

      {!project.bomId && (
        <div className="card p-5 text-center text-sm text-ink-500">
          <p className="flex items-center justify-center gap-2"><Ic name="lightbulb" size={14} /> BOM برای این پروژه هنوز ساخته نشده.</p>
          <Link to={`/recipes/${encodeURIComponent(project.recipeId)}`} className="mt-3 inline-block text-sm font-bold text-brand-600">
            رفتن به دستور <Ic name="arrowLeft" size={14} />
          </Link>
        </div>
      )}
    </div>
  )
}
