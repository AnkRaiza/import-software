// Settings — company profile shown on quotation PDFs.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { ImagePlus, Save } from 'lucide-react'
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

  if (profile === undefined) return null // loading (null = no profile saved yet)

  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <SettingsForm key={profile?.id ?? 'new'} initial={profile ?? undefined} />
    </>
  )
}

function SettingsForm({
  initial,
}: {
  initial?: {
    name: string
    ruc?: string
    address?: string
    phone?: string
    email?: string
    logo?: string
  }
}) {
  const { t } = useTranslation()
  const [saved, setSaved] = useState(false)
  const [logo, setLogo] = useState<string | undefined>(initial?.logo)
  const [logoError, setLogoError] = useState<string>()
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

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      setLogoError(t('settings.logoInvalid'))
      return
    }
    if (file.size > 3_000_000) {
      setLogoError(t('settings.logoTooLarge'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setLogo(reader.result as string)
      setLogoError(undefined)
      setSaved(false)
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogo(undefined)
    setSaved(false)
  }

  const submit = handleSubmit(async (values) => {
    await saveCompanyProfile({
      name: values.name,
      ruc: values.ruc || undefined,
      address: values.address || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      logo,
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

        {/* Logo */}
        <div>
          <span className="mb-1 block text-sm font-medium">{t('settings.logo')}</span>
          <div className="flex items-center gap-4">
            {logo && (
              <img
                src={logo}
                alt="logo"
                className="h-16 w-auto max-w-40 rounded border border-border bg-white object-contain p-1"
              />
            )}
            <div className="flex flex-col gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-2">
                <ImagePlus className="size-4" />
                {t('settings.uploadLogo')}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={onLogoChange}
                  className="hidden"
                />
              </label>
              {logo && (
                <Button type="button" variant="ghost" size="sm" onClick={removeLogo}>
                  {t('settings.removeLogo')}
                </Button>
              )}
            </div>
          </div>
          <span className="mt-1 block text-xs text-muted">{t('settings.logoHint')}</span>
          {logoError && <span className="mt-1 block text-xs text-negative">{logoError}</span>}
        </div>

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
