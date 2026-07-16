import { ComingSoon, PageHeader } from '../../components/ui'

export default function CostAllocationPage() {
  return (
    <>
      <PageHeader
        title="Cost Allocation"
        subtitle="Distribute logistics and taxes across products"
      />
      <ComingSoon
        features={[
          'Allocation methods: by quantity, weight, area (m²), or FOB value',
          'Proportional logistics and tax allocation per product',
          'Final table: FOB, logistics, tax, landed cost, cost/unit, cost/m²',
          'Recomputed instantly by the shared calc engine',
        ]}
      />
    </>
  )
}
