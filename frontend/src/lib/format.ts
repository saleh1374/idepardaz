// ابزارهای نمایشی: اعداد فارسی، قیمت، برچسب‌های سطوح

const faNum = new Intl.NumberFormat('fa-IR')

export function formatNumber(value: number): string {
  return faNum.format(value)
}

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${faNum.format(value)} تومان`
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return `~${faNum.format(minutes)} دقیقه`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `~${faNum.format(hours)} ساعت` : `~${faNum.format(hours)} ساعت و ${faNum.format(rest)} دقیقه`
}

export const difficultyLabel: Record<string, string> = {
  beginner: 'مبتدی',
  intermediate: 'متوسط',
  advanced: 'پیشرفته',
}

export const safetyLabel: Record<string, string> = {
  LOW: 'کم‌خطر',
  MEDIUM: 'متوسط',
  HIGH: 'پرخطر',
  CRITICAL: 'بسیار پرخطر',
}

export const roleLabel: Record<string, string> = {
  Required: 'الزامی',
  Optional: 'اختیاری',
  Alternative: 'جایگزین',
}

export const stockLabel: Record<string, string> = {
  InStock: 'موجود',
  LowStock: 'موجودی محدود',
  OutOfStock: 'ناموجود',
  Unknown: 'نامشخص',
}

export function clampInteger(v: number, min?: number | null, max?: number | null): number {
  let out = Number.isFinite(v) ? Math.round(v) : (min ?? 1)
  if (min != null) out = Math.max(min, out)
  if (max != null) out = Math.min(max, out)
  return out
}