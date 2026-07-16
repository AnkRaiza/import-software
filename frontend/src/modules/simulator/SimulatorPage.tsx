import { ComingSoon, PageHeader } from '../../components/ui'

export default function SimulatorPage() {
  return (
    <>
      <PageHeader
        title="Scenario Simulator"
        subtitle="Change inputs and see landed cost recalculate instantly"
      />
      <ComingSoon
        features={[
          'Adjust exchange rate, freight, insurance, tax rates, quantities',
          'Everything recalculates instantly (client-side engine)',
          'Compare against the base scenario',
          'No round-trips — pure in-browser math',
        ]}
      />
    </>
  )
}
