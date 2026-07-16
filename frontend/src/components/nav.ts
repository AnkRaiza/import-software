// Navigation model — a single source for routes + sidebar entries.

import {
  ArrowLeftRight,
  Boxes,
  Calculator,
  DollarSign,
  History,
  LayoutDashboard,
  PackageSearch,
  Percent,
  Ship,
  Truck,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  path: string
  /** i18n key for the sidebar label. */
  labelKey: string
  icon: LucideIcon
  /** PRD module number, for reference. */
  module: number
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, module: 1 },
  { path: '/products', labelKey: 'nav.products', icon: Boxes, module: 2 },
  { path: '/suppliers', labelKey: 'nav.suppliers', icon: PackageSearch, module: 3 },
  { path: '/purchase-order', labelKey: 'nav.purchaseOrder', icon: Truck, module: 4 },
  { path: '/logistics', labelKey: 'nav.logistics', icon: Ship, module: 5 },
  { path: '/customs', labelKey: 'nav.customs', icon: Percent, module: 6 },
  { path: '/allocation', labelKey: 'nav.allocation', icon: ArrowLeftRight, module: 7 },
  { path: '/pricing', labelKey: 'nav.pricing', icon: DollarSign, module: 8 },
  { path: '/history', labelKey: 'nav.history', icon: History, module: 9 },
  { path: '/simulator', labelKey: 'nav.simulator', icon: Calculator, module: 10 },
]
