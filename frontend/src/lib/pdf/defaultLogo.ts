// Resolves the company profile used on quotation PDFs. If the user hasn't set a
// logo in Settings, falls back to the bundled Nisaro logo so PDFs are branded
// by default. The logo is fetched once and cached as a data URL for jsPDF.

import { getCompanyProfile } from '../settings'
import type { CompanyProfile } from '../db/types'

let cachedLogo: string | null = null

async function loadDefaultLogo(): Promise<string | undefined> {
  if (cachedLogo) return cachedLogo
  try {
    const res = await fetch('/nisaro-logo.png')
    if (!res.ok) return undefined
    const blob = await res.blob()
    cachedLogo = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    return cachedLogo
  } catch {
    return undefined
  }
}

export async function resolveCompanyForPdf(): Promise<CompanyProfile | undefined> {
  const company = await getCompanyProfile()
  if (company?.logo) return company
  const logo = await loadDefaultLogo()
  if (!logo) return company
  // User's profile fields win; only the logo is defaulted.
  return { id: 'company', name: 'Nisaro', ...(company ?? {}), logo }
}
