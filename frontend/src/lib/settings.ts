// Company profile (app settings singleton) used on quotation PDFs. Stored as a
// single row keyed by a fixed id.

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/schema'
import type { CompanyProfile } from './db/types'

const COMPANY_ID = 'company'

// Returns undefined while loading, null when no profile has been saved yet,
// or the CompanyProfile. The null lets callers tell "empty" apart from "loading".
export function useCompanyProfile() {
  return useLiveQuery(
    async () => (await db.settings.get(COMPANY_ID)) ?? null,
    [],
  )
}

export function getCompanyProfile(): Promise<CompanyProfile | undefined> {
  return db.settings.get(COMPANY_ID)
}

export async function saveCompanyProfile(
  data: Omit<CompanyProfile, 'id'>,
): Promise<void> {
  await db.settings.put({ ...data, id: COMPANY_ID })
}
