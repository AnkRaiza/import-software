import { useTranslation } from 'react-i18next'
import { ComingSoon, PageHeader } from '../../components/ui'

export default function PricingPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader
        title={t('modules.pricing.title')}
        subtitle={t('modules.pricing.subtitle')}
      />
      <ComingSoon
        features={t('modules.pricing.features', { returnObjects: true }) as string[]}
      />
    </>
  )
}
