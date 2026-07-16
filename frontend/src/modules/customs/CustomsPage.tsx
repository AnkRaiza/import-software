import { ComingSoon, PageHeader } from '../../components/ui'

export default function CustomsPage() {
  return (
    <>
      <PageHeader
        title="Customs (SUNAT)"
        subtitle="Peruvian customs duties and taxes"
      />
      <ComingSoon
        features={[
          'Inputs: exchange rate, Ad Valorem %, IGV %, IPM %, Perception %',
          'Auto-calculated CIF and tax base',
          'Ad Valorem, IGV, IPM, and Perception amounts',
          'Total SUNAT taxes',
        ]}
      />
    </>
  )
}
