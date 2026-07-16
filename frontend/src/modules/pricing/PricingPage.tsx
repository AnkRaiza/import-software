import { ComingSoon, PageHeader } from '../../components/ui'

export default function PricingPage() {
  return (
    <>
      <PageHeader
        title="Pricing"
        subtitle="Selling prices and margins from landed cost"
      />
      <ComingSoon
        features={[
          'Margin tiers: 20%, 25%, 30%, 35%, 40%, 50%',
          'Selling price, gross profit, and margin per tier',
          'Custom target margin',
          'Driven by the landed cost from allocation',
        ]}
      />
    </>
  )
}
