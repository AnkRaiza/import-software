import { ComingSoon, PageHeader } from '../../components/ui'

export default function SuppliersPage() {
  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle="Manage supplier companies and trading terms"
      />
      <ComingSoon
        features={[
          'Company, contact, country, currency',
          'Payment terms and incoterms',
          'Notes per supplier',
          'Used across products and purchase orders',
        ]}
      />
    </>
  )
}
