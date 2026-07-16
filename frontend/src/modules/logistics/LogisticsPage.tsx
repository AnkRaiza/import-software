import { ComingSoon, PageHeader } from '../../components/ui'

export default function LogisticsPage() {
  return (
    <>
      <PageHeader
        title="Logistics"
        subtitle="International, destination, and customs-broker costs"
      />
      <ComingSoon
        features={[
          'International: ocean freight, insurance, BL service, other',
          'Destination: deconsolidation, warehouse, handling, customs release, monitoring, port charges',
          'Customs broker: brokerage, processing, local delivery, misc',
          'Auto-calculated subtotals and total logistics cost',
        ]}
      />
    </>
  )
}
