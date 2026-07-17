// Company profile (app settings singleton) used on quotation PDFs. Stored as a
// single row keyed by a fixed id.

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/schema'
import type { CompanyProfile } from './db/types'

const COMPANY_ID = 'company'

export function useCompanyProfile() {
  return useLiveQuery(() => db.settings.get(COMPANY_ID), [])
}

export function getCompanyProfile(): Promise<CompanyProfile | undefined> {
  return db.settings.get(COMPANY_ID)
}

export async function saveCompanyProfile(
  data: Omit<CompanyProfile, 'id'>,
): Promise<void> {
  await db.settings.put({ ...data, id: COMPANY_ID })
}
