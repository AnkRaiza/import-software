// Create/edit form for a supplier. Rendered inside a Modal; the modal's footer
// Save button submits this form via the shared form id.

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CURRENCIES, INCOTERMS, type Supplier } from '../../lib/db/types'
import type { NewEntity } from '../../lib/repo'
import { SelectField, TextAreaField, TextField } from '../../components/fields'

export const SUPPLIER_FORM_ID = 'supplier-form'

const schema = z.object({
  company: z.string().trim().min(1, 'Company is required'),
  contact: z.string().trim().optional(),
  country: z.string().trim().optional(),
  currency: z.enum(CURRENCIES as [string, ...string[]]),
  paymentTerms: z.string().trim().optional(),
  incoterms: z.string().optional(),
  notes: z.string().trim().optional(),
})

type FormValues = z.infer<typeof schema>

export function SupplierForm({
  initial,
  onSubmit,
}: {
  initial?: Supplier
  onSubmit: (values: NewEntity<Supplier>) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      company: initial?.company ?? '',
      contact: initial?.contact ?? '',
      country: initial?.country ?? '',
      currency: initial?.currency ?? 'USD',
      paymentTerms: initial?.paymentTerms ?? '',
      incoterms: initial?.incoterms ?? '',
      notes: initial?.notes ?? '',
    },
  })

  const submit = handleSubmit((values) => {
    onSubmit({
      company: values.company,
      contact: values.contact || undefined,
      country: values.country || undefined,
      currency: values.currency as Supplier['currency'],
      paymentTerms: values.paymentTerms || undefined,
      incoterms: (values.incoterms || undefined) as Supplier['incoterms'],
      notes: values.notes || undefined,
    })
  })

  return (
    <form id={SUPPLIER_FORM_ID} onSubmit={submit} className="space-y-4">
      <TextField
        label="Company"
        required
        error={errors.company?.message}
        {...register('company')}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Contact" {...register('contact')} />
        <TextField label="Country" {...register('country')} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Currency"
          required
          error={errors.currency?.message}
          {...register('currency')}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
        <SelectField label="Incoterms" {...register('incoterms')}>
          <option value="">—</option>
          {INCOTERMS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </SelectField>
      </div>
      <TextField label="Payment Terms" {...register('paymentTerms')} />
      <TextAreaField label="Notes" {...register('notes')} />
    </form>
  )
}
