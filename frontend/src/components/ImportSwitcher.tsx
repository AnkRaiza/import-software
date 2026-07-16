// Reusable bar for selecting the active import (or creating a new one). Shared
// across the import-editing modules (Purchase Order, Logistics, Customs, …).

import { useTranslation } from 'react-i18next'
import { FilePlus2 } from 'lucide-react'
import { useActiveImport } from '../lib/activeImport'
import { Button } from './Button'

export function ImportSwitcher() {
  const { t } = useTranslation()
  const { activeId, imports, setActive, createNew } = useActiveImport()

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <span className="text-sm font-medium text-muted">{t('imports.active')}</span>
      <select
        value={activeId ?? ''}
        onChange={(e) => setActive(e.target.value || null)}
        aria-label={t('imports.active')}
        className="min-w-48 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text outline-none focus:border-primary"
      >
        <option value="">{t('imports.select')}</option>
        {imports?.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </select>
      <Button variant="secondary" size="sm" onClick={() => createNew()}>
        <FilePlus2 className="size-4" />
        {t('imports.new')}
      </Button>
    </div>
  )
}
