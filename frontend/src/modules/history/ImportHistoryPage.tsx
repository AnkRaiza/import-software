import { ComingSoon, PageHeader } from '../../components/ui'

export default function ImportHistoryPage() {
  return (
    <>
      <PageHeader
        title="Import History"
        subtitle="Every saved import, with comparison"
      />
      <ComingSoon
        features={[
          'Record per import: date, supplier, FOB, logistics, taxes, total cost',
          'Compare imports side by side',
          'Cost evolution over time',
          'Excel/JSON export and import (secure library TBD)',
        ]}
      />
    </>
  )
}
