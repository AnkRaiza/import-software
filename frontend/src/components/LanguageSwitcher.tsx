// Language dropdown. Changing it updates i18next and persists the choice.

import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { SUPPORTED_LANGUAGES } from '../i18n'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage ?? 'en'

  return (
    <label className="flex items-center gap-1.5 text-muted">
      <Languages className="size-4" aria-hidden="true" />
      <span className="sr-only">{t('common.language')}</span>
      <select
        value={current}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        aria-label={t('common.language')}
        className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text outline-none focus:border-primary"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  )
}
