import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-xs text-ink-400">
        <Link to="/" className="hover:text-brand-600 transition-colors">خانه</Link>
        <span>/</span>
        <span className="text-ink-600">شرایط استفاده</span>
      </nav>

      <h1 className="text-3xl font-black text-ink-900">شرایط استفاده از بساز</h1>
      <p className="mt-2 text-sm text-ink-500">آخرین به‌روزرسانی: ۱۴۰۵/۰۷/۰۱</p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-ink-700">
        {/* بخش ۱ */}
        <section>
          <h2 className="text-lg font-bold text-ink-900">۱. مسئولیت ایمنی</h2>
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              پروژه‌های تأییدشده توسط تیم فنی/ایمنی بساز بازبینی شده‌اند
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              با این‌حال، <strong>مسئولولیت نهایی ایمنی بر عهدهٔ کاربر است</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              همیشه هشدارهای ایمنی را رعایت کنید
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              در صورت بی‌احتیاطی، بساز مسئولیتی ندارد
            </li>
          </ul>
        </section>

        {/* بخش ۲ */}
        <section>
          <h2 className="text-lg font-bold text-ink-900">۲. محدودیت سنی</h2>
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              پروژه‌های سطح <strong>HIGH</strong> برای افراد زیر ۱۸ سال <strong>بدون نظارت بزرگ‌سال</strong> مجاز نیست
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              پروژه‌های سطح <strong>CRITICAL</strong> در MVP <strong>ارائه نمی‌شوند</strong>
            </li>
          </ul>
        </section>

        {/* بخش ۳ */}
        <section>
          <h2 className="text-lg font-bold text-ink-900">۳. دقت اطلاعات</h2>
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              قیمت‌ها <strong>تقریبی</strong> هستند و ممکن است تغییر کنند
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              موجودی فروشگاه‌ها به‌صورت لحظه‌ای به‌روز نمی‌شود
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <strong>قبل از خرید، موجودی و قیمت را از فروشگاه تأیید کنید</strong>
            </li>
          </ul>
        </section>

        {/* بخش ۴ */}
        <section>
          <h2 className="text-lg font-bold text-ink-900">۴. مالکیت فکری</h2>
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              Recipeها با لایسنس <strong>CC-BY-NC-4.0</strong> منتشر شده‌اند
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              استفادهٔ تجاری با ذکر منبع مجاز است
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              تولید محتوای مشابه با ذکر منبع مجاز است
            </li>
          </ul>
        </section>

        {/* بخش ۵ */}
        <section>
          <h2 className="text-lg font-bold text-ink-900">۵. محدودیت‌های MVP</h2>
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              پروژه‌های HIGH/CRITICAL فقط برای <strong>تست داخلی</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              پرداخت آنلاین هنوز <strong>فعال نیست</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              صنعتگران فقط در حالت <strong>Waitlist</strong> هستند
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              AI فقط <strong>StubMatcher آفلاین</strong> است
            </li>
          </ul>
        </section>

        {/* بخش ۶ */}
        <section>
          <h2 className="text-lg font-bold text-ink-900">۶. قوانین حاکم</h2>
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              این شرایط تابع قوانین جمهوری اسلامی ایران است
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              در صورت اختلاف، مرجع حل اختلاف <strong>دادگاه تهران</strong> است
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-12 text-center">
        <Link to="/" className="text-sm font-bold text-brand-600 hover:text-brand-700">
          ← بازگشت به صفحهٔ اصلی
        </Link>
      </div>
    </div>
  )
}
