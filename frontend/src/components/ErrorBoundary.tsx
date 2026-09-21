import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <span className="text-6xl">💥</span>
          <h1 className="mt-6 text-2xl font-black text-ink-900">خطایی رخ داد!</h1>
          <p className="mt-3 max-w-md text-sm leading-7 text-ink-500">
            متأفانه یک خطای غیرمنتظره رخ داد. لطفاً صفحه را رفرش کنید یا به صفحهٔ خانه برگردید.
          </p>
          {this.state.error && (
            <pre className="mt-4 max-w-lg overflow-x-auto rounded-xl border border-rose-200 bg-rose-50 p-4 text-left text-xs text-rose-700">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
            className="btn-primary mt-6 px-8 py-3"
          >
            بازگشت به خانه
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
