import { useTranslation } from 'react-i18next'
import { ComingSoon, PageHeader } from '../../components/ui'

export default function PurchaseOrderPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader
        title={t('modules.purchaseOrder.title')}
        subtitle={t('modules.purchaseOrder.subtitle')}
      />
      <ComingSoon
        features={
          t('modules.purchaseOrder.features', { returnObjects: true }) as string[]
        }
      />
    </>
  )
}
