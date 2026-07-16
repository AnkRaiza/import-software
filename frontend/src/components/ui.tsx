// Shared presentational primitives used across modules.

import type { ReactNode } from 'react'
import clsx from 'clsx'

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-border bg-surface p-5 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function ComingSoon({
  features,
}: {
  features: string[]
}) {
  return (
    <Card>
      <div className="mb-3 inline-flex items-center rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
        Planned for the MVP
      </div>
      <ul className="space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode
  title: string
  description?: string
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <div className="text-base font-medium">{title}</div>
      {description && (
        <p className="max-w-md text-sm text-muted">{description}</p>
      )}
    </Card>
  )
}
