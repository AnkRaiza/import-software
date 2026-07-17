// Settings — company profile shown on quotation PDFs.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Save } from 'lucide-react'
import { saveCompanyProfile, useCompanyProfile } from '../../lib/settings'
import { Button } from '../../components/Button'
import { TextField } from '../../components/fields'
import { Card, PageHeader } from '../../components/ui'

const schema = z.object({
  name: z.string().trim().min(1, 'settings.nameRequired'),
  ruc: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
})
type FormValues = z.infer<typeof schema>

export default function SettingsPage() {
  const { t } = useTranslation()
  const profile = useCompanyProfile()

  if (profile === undefined) return null // loading

  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <SettingsForm key={profile?.id ?? 'new'} initial={profile} />
    </>
  )
}

function SettingsForm({
  initial,
}: {
  initial?: { name: string; ruc?: string; address?: string; phone?: string; email?: string }
}) {
  const { t } = useTranslation()
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      ruc: initial?.ruc ?? '',
      address: initial?.address ?? '',
      phone: initial?.phone ?? '',
      email: initial?.email ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    await saveCompanyProfile({
      name: values.name,
      ruc: values.ruc || undefined,
      address: values.address || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
    })
    setSaved(true)
  })

  return (
    <Card className="max-w-2xl">
      <h2 className="mb-4 text-sm font-semibold">{t('settings.companyTitle')}</h2>
      <form onSubmit={submit} className="space-y-4">
        <TextField
          label={t('settings.name')}
          required
          error={errors.name?.message ? t(errors.name.message) : undefined}
          {...register('name', { onChange: () => setSaved(false) })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label={t('settings.ruc')} {...register('ruc', { onChange: () => setSaved(false) })} />
          <TextField label={t('settings.phone')} {...register('phone', { onChange: () => setSaved(false) })} />
        </div>
        <TextField label={t('settings.address')} {...register('address', { onChange: () => setSaved(false) })} />
        <TextField label={t('settings.email')} {...register('email', { onChange: () => setSaved(false) })} />
        <div className="flex items-center gap-3">
          <Button type="submit">
            <Save className="size-4" />
            {t('common.save')}
          </Button>
          {saved && <span className="text-sm text-positive">{t('common.saved')}</span>}
        </div>
      </form>
    </Card>
  )
}
