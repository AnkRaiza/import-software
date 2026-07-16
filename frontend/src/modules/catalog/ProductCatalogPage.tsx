import { ComingSoon, PageHeader } from '../../components/ui'

export default function ProductCatalogPage() {
  return (
    <>
      <PageHeader
        title="Product Catalog"
        subtitle="Reusable catalog of importable products (SKU, dimensions, FOB price)"
      />
      <ComingSoon
        features={[
          'Add/edit products: SKU, name, category, thickness, finish (1/2-side UV)',
          'Dimensions with auto-calculated area (m²), weight, unit FOB price',
          'Link products to suppliers',
          'Unlimited products with search and filtering',
        ]}
      />
    </>
  )
}
