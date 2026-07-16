import { ComingSoon, PageHeader } from '../../components/ui'

export default function PurchaseOrderPage() {
  return (
    <>
      <PageHeader
        title="Purchase Order"
        subtitle="Build an order from catalog products — FOB is always calculated"
      />
      <ComingSoon
        features={[
          'Select supplier and products, enter quantities',
          'Auto-retrieve unit price, area, and weight from the catalog',
          'Auto-calculate line totals, total quantity/weight/area, and FOB total',
          'FOB is never entered manually (PRD rule)',
        ]}
      />
    </>
  )
}
