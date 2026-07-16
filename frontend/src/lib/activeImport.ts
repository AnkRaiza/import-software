// The "active import" — the working import that the Purchase Order, Logistics,
// Customs, Allocation, Pricing and Simulator modules all edit. There is one
// source of truth (the ImportRecord in the repository); this hook tracks which
// one is active via a localStorage pointer and exposes it live.

import { useCallback, useSyncExternalStore } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { repo, type NewEntity } from './repo'
import type { ImportRecord, LogisticsCosts } from './db/types'

const ACTIVE_KEY = 'icm-active-import'

// Tiny external store so every useActiveImport() instance (e.g. the switcher
// and the page it sits on) stays in sync on the active id.
const listeners = new Set<() => void>()
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
const getActiveIdSnapshot = () => localStorage.getItem(ACTIVE_KEY)
function writeActiveId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_KEY, id)
  else localStorage.removeItem(ACTIVE_KEY)
  listeners.forEach((l) => l())
}

export function blankLogistics(): LogisticsCosts {
  return {
    international: { oceanFreight: 0, insurance: 0, blService: 0, other: 0 },
    destination: {
      deconsolidation: 0,
      warehouse: 0,
      handling: 0,
      customsRelease: 0,
      monitoring: 0,
      portCharges: 0,
      other: 0,
    },
    broker: { brokerage: 0, customsProcessing: 0, localDelivery: 0, miscellaneous: 0 },
  }
}

/** A fresh import with sensible Peru defaults (IGV 16%, IPM 2%, Perception 3.5%). */
export function createBlankImport(name?: string): NewEntity<ImportRecord> {
  const today = new Date().toISOString().slice(0, 10)
  return {
    name: name ?? `Import ${today}`,
    date: today,
    items: [],
    logistics: blankLogistics(),
    taxes: {
      exchangeRate: 3.75,
      adValoremPct: 0,
      igvPct: 16,
      ipmPct: 2,
      perceptionPct: 3.5,
    },
    allocationMethod: 'fob',
    targetMargin: 0.3,
  }
}

export function useActiveImport() {
  const activeId = useSyncExternalStore(subscribe, getActiveIdSnapshot)

  const imports = useLiveQuery(() => repo.imports.all(), [])
  const active = useLiveQuery(
    () => (activeId ? repo.imports.get(activeId) : Promise.resolve(undefined)),
    [activeId],
  )

  const setActive = useCallback((id: string | null) => writeActiveId(id), [])

  const createNew = useCallback(async (name?: string) => {
    const rec = await repo.imports.create(createBlankImport(name))
    writeActiveId(rec.id)
    return rec
  }, [])

  return { activeId, active, imports, setActive, createNew }
}
