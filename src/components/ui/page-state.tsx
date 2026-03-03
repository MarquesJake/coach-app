import { EmptyState } from './empty-state'

const Spinner = () => (
  <svg className="animate-spin h-8 w-8 text-muted-foreground" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

type PageStateLoading = {
  state: 'loading'
  /** Min height for the loading area (default: 60vh for list, full for standalone) */
  minHeight?: 'sm' | 'full'
}

type PageStateError = {
  state: 'error'
  message: string
  onRetry?: () => void
  minHeight?: 'sm' | 'full'
}

type PageStateEmpty = {
  state: 'empty'
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  minHeight?: 'sm' | 'full'
}

export type PageStateProps = PageStateLoading | PageStateError | PageStateEmpty

const minHeightClass = {
  sm: 'min-h-[60vh]',
  full: 'min-h-screen',
}

export function PageState(props: PageStateProps) {
  const minH = props.minHeight ?? 'sm'
  const wrapperClass = `flex items-center justify-center ${minHeightClass[minH]} w-full`

  if (props.state === 'loading') {
    return (
      <div className={wrapperClass}>
        <Spinner />
      </div>
    )
  }

  if (props.state === 'error') {
    return (
      <div className={`${wrapperClass} p-4`}>
        <div className="card-surface rounded-xl p-8 max-w-sm w-full text-center">
          <h2 className="text-sm font-semibold text-foreground">Something went wrong</h2>
          <p className="text-xs text-muted-foreground mt-2">{props.message}</p>
          {props.onRetry && (
            <button
              type="button"
              onClick={props.onRetry}
              className="mt-5 inline-flex items-center justify-center px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  if (props.state === 'empty') {
    return (
      <div className={wrapperClass}>
        <div className="w-full max-w-md px-4">
          <EmptyState
            title={props.title}
            description={props.description}
            actionLabel={props.actionLabel}
            actionHref={props.actionHref}
          />
        </div>
      </div>
    )
  }

  return null
}
