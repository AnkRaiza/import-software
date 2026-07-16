import { useTranslation } from 'react-i18next'
import { ComingSoon, PageHeader } from '../../components/ui'

export default function ImportHistoryPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader
        title={t('modules.history.title')}
        subtitle={t('modules.history.subtitle')}
      />
      <ComingSoon
        features={t('modules.history.features', { returnObjects: true }) as string[]}
      />
    </>
  )
}
