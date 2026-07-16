import { useTranslation } from 'react-i18next'
import { ComingSoon, PageHeader } from '../../components/ui'

export default function LogisticsPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader
        title={t('modules.logistics.title')}
        subtitle={t('modules.logistics.subtitle')}
      />
      <ComingSoon
        features={t('modules.logistics.features', { returnObjects: true }) as string[]}
      />
    </>
  )
}
