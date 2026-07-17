// App shell: fixed sidebar navigation + top bar with theme toggle.

import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, Moon, Sun, X } from 'lucide-react'
import clsx from 'clsx'
import { NAV_ITEMS } from './nav'
import { useTheme } from '../lib/theme'
import { LanguageSwitcher } from './LanguageSwitcher'

export default function Layout() {
  const { theme, toggle } = useTheme()
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 w-64 shrink-0 border-r border-border bg-surface',
          'flex flex-col transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-4">
          <img
            src="/nisaro-logo.png"
            alt="Nisaro"
            className="h-11 w-auto rounded-md bg-white p-1"
          />
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {NAV_ITEMS.map(({ path, labelKey, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-fg'
                    : 'text-muted hover:bg-surface-2 hover:text-text',
                )
              }
            >
              <Icon className="size-4.5 shrink-0" />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4 text-xs text-muted">
          {t('app.mvpNote')}
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-surface-2 lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={t('common.toggleNav')}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div className="hidden text-sm text-muted lg:block">
            {t('app.tagline')}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={toggle}
              className="rounded-lg p-2 text-muted hover:bg-surface-2"
              aria-label={t('common.toggleTheme')}
            >
              {theme === 'dark' ? (
                <Sun className="size-5" />
              ) : (
                <Moon className="size-5" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
