import { Link } from 'react-router-dom'
import { Ic } from '../lib/icons'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <img src="/empty-search.svg" alt="" className="h-52 w-auto" />
      <h1 className="mt-4 text-4xl font-black text-ink-900">۴۰۴</h1>
      <p className="mt-3 max-w-md text-base leading-7 text-ink-500">
        صفحهٔ مورد نظر شما پیدا نشد. شاید آدرس را اشتباه تایپ کرده‌اید یا صفحه حذف شده است.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary px-8 py-3">
          <Ic name="home" size={17} />
          بازگشت به خانه
        </Link>
        <Link to="/recipes" className="btn-outline px-8 py-3">
          <Ic name="clipboard" size={17} />
          مرور دستورها
        </Link>
      </div>
    </div>
  )
}
