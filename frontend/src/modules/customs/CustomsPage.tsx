import { useTranslation } from 'react-i18next'
import { ComingSoon, PageHeader } from '../../components/ui'

export default function CustomsPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader
        title={t('modules.customs.title')}
        subtitle={t('modules.customs.subtitle')}
      />
      <ComingSoon
        features={t('modules.customs.features', { returnObjects: true }) as string[]}
      />
    </>
  )
}
