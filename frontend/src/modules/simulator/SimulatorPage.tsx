import { useTranslation } from 'react-i18next'
import { ComingSoon, PageHeader } from '../../components/ui'

export default function SimulatorPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader
        title={t('modules.simulator.title')}
        subtitle={t('modules.simulator.subtitle')}
      />
      <ComingSoon
        features={t('modules.simulator.features', { returnObjects: true }) as string[]}
      />
    </>
  )
}
