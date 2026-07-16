// Single entry point for data access. Swap the implementation here (e.g. an
// HTTP repository in phase 2) and the whole app follows — no other changes.

import { dexieRepository } from './dexieRepo'
import type { Repository } from './types'

export const repo: Repository = dexieRepository

export type { Repository, CrudRepository, NewEntity, EntityPatch } from './types'
