import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error): void {
    // Scrubbed logging — never log PII, biometric signatures, or raw stack traces.
    console.error('[ErrorBoundary] Render crash caught:', error.message)
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = (): void => {
    window.location.href = '/'
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 mb-1">Something went wrong</h2>
          <p className="text-sm text-zinc-500 max-w-sm mb-6">
            An unexpected error occurred while rendering this section. Your data is safe — try
            refreshing or return to the home page.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <RotateCw size={14} />
              Reload Section
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              <Home size={14} />
              Go Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
