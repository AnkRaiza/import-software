import { useTranslation } from 'react-i18next'
import { ComingSoon, PageHeader } from '../../components/ui'

export default function CostAllocationPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader
        title={t('modules.allocation.title')}
        subtitle={t('modules.allocation.subtitle')}
      />
      <ComingSoon
        features={t('modules.allocation.features', { returnObjects: true }) as string[]}
      />
    </>
  )
}
