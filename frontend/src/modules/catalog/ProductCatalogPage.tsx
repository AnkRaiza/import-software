import { useTranslation } from 'react-i18next'
import { ComingSoon, PageHeader } from '../../components/ui'

export default function ProductCatalogPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader
        title={t('modules.products.title')}
        subtitle={t('modules.products.subtitle')}
      />
      <ComingSoon
        features={t('modules.products.features', { returnObjects: true }) as string[]}
      />
    </>
  )
}
