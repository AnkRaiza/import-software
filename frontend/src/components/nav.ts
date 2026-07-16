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
  label: string
  icon: LucideIcon
  /** PRD module number, for reference. */
  module: number
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, module: 1 },
  { path: '/products', label: 'Product Catalog', icon: Boxes, module: 2 },
  { path: '/suppliers', label: 'Suppliers', icon: PackageSearch, module: 3 },
  { path: '/purchase-order', label: 'Purchase Order', icon: Truck, module: 4 },
  { path: '/logistics', label: 'Logistics', icon: Ship, module: 5 },
  { path: '/customs', label: 'Customs (SUNAT)', icon: Percent, module: 6 },
  { path: '/allocation', label: 'Cost Allocation', icon: ArrowLeftRight, module: 7 },
  { path: '/pricing', label: 'Pricing', icon: DollarSign, module: 8 },
  { path: '/history', label: 'Import History', icon: History, module: 9 },
  { path: '/simulator', label: 'Scenario Simulator', icon: Calculator, module: 10 },
]
