// Create/edit form for a catalog product. Area (m²) is an auto-calculated,
// read-only field derived from length × width — editable inputs are kept
// clearly separate from calculated ones (PRD principle).

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { z } from 'zod'
import { FINISHES, FINISH_LABEL_KEYS, type Product } from '../../lib/db/types'
import { repo, type NewEntity } from '../../lib/repo'
import { round } from '../../lib/calc/money'
import { SelectField, TextField } from '../../components/fields'

export const PRODUCT_FORM_ID = 'product-form'

const requiredNum = z.coerce.number().nonnegative('products.form.positiveNumber')
const optionalNum = z.preprocess(
  (v) => (v === '' || v === null || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v),
  z.coerce.number().nonnegative('products.form.positiveNumber').optional(),
)

const schema = z.object({
  sku: z.string().trim().min(1, 'products.form.skuRequired'),
  name: z.string().trim().min(1, 'products.form.nameRequired'),
  category: z.string().trim().optional(),
  thickness: optionalNum,
  finish: z.string().optional(),
  length: requiredNum,
  width: requiredNum,
  weight: requiredNum,
  unitFobPrice: requiredNum,
  supplierId: z.string().optional(),
})

type FormValues = z.input<typeof schema>

export function ProductForm({
  initial,
  onSubmit,
}: {
  initial?: Product
  onSubmit: (values: NewEntity<Product>) => void
}) {
  const { t } = useTranslation()
  const suppliers = useLiveQuery(() => repo.suppliers.all(), [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: initial?.sku ?? '',
      name: initial?.name ?? '',
      category: initial?.category ?? '',
      thickness: initial?.thickness ?? '',
      finish: initial?.finish ?? '',
      length: initial?.length ?? '',
      width: initial?.width ?? '',
      weight: initial?.weight ?? '',
      unitFobPrice: initial?.unitFobPrice ?? '',
      supplierId: initial?.supplierId ?? '',
    },
  })

  // Live area preview (length × width).
  const length = Number(watch('length')) || 0
  const width = Number(watch('width')) || 0
  const area = round(length * width, 4)

  const submit = handleSubmit((values) => {
    const parsed = schema.parse(values)
    onSubmit({
      sku: parsed.sku,
      name: parsed.name,
      category: parsed.category || undefined,
      thickness: parsed.thickness,
      finish: (parsed.finish || undefined) as Product['finish'],
      length: parsed.length,
      width: parsed.width,
      area: round(parsed.length * parsed.width, 4),
      weight: parsed.weight,
      unitFobPrice: parsed.unitFobPrice,
      supplierId: parsed.supplierId || undefined,
    })
  })

  const err = (k: keyof FormValues) => {
    const m = errors[k]?.message
    return m ? t(m) : undefined
  }

  return (
    <form id={PRODUCT_FORM_ID} onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label={t('products.col.sku')}
          required
          error={err('sku')}
          {...register('sku')}
        />
        <TextField
          label={t('products.col.name')}
          required
          error={err('name')}
          {...register('name')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label={t('products.col.category')} {...register('category')} />
        <SelectField label={t('products.col.finish')} {...register('finish')}>
          <option value="">{t('common.none')}</option>
          {FINISHES.map((f) => (
            <option key={f} value={f}>
              {t(FINISH_LABEL_KEYS[f])}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <TextField
          label={t('products.col.length')}
          type="number"
          step="any"
          required
          error={err('length')}
          {...register('length')}
        />
        <TextField
          label={t('products.col.width')}
          type="number"
          step="any"
          required
          error={err('width')}
          {...register('width')}
        />
        {/* Read-only calculated field */}
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {t('products.col.area')}
          </span>
          <input
            value={area}
            readOnly
            tabIndex={-1}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-muted outline-none"
          />
          <span className="mt-1 block text-xs text-muted">
            {t('products.areaAuto')}
          </span>
        </label>
        <TextField
          label={t('products.col.thickness')}
          type="number"
          step="any"
          error={err('thickness')}
          {...register('thickness')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField
          label={t('products.col.weight')}
          type="number"
          step="any"
          required
          error={err('weight')}
          {...register('weight')}
        />
        <TextField
          label={t('products.col.fob')}
          type="number"
          step="any"
          required
          error={err('unitFobPrice')}
          {...register('unitFobPrice')}
        />
        <SelectField label={t('products.col.supplier')} {...register('supplierId')}>
          <option value="">{t('products.noSupplier')}</option>
          {suppliers?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.company}
            </option>
          ))}
        </SelectField>
      </div>
    </form>
  )
}
